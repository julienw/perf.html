/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
/**
 * This file deals with old versions of the Gecko profile format, i.e. the
 * format that the Gecko profiler platform outputs. We want to be able to
 * run perf.html on non-Nightly versions of Firefox, and we want to be able
 * to load old saved profiles, so this file upgrades old profiles to the
 * current format.
 */

import {
  upgradeGCMinorMarker,
  upgradeGCMajorMarker_Gecko8To9,
} from './convert-markers';
import { UniqueStringArray } from '../utils/unique-string-array';

export const CURRENT_VERSION = 12; // The current version of the Gecko profile format.

// Gecko profiles before version 1 did not have a profile.meta.version field.
// Treat those as version zero.
const UNANNOTATED_VERSION = 0;

/**
 * Upgrades the supplied profile to the current version, by mutating |profile|.
 * Throws an exception if the profile is too new.
 * @param {object} profile The profile in the "Gecko profile" format.
 */
export function upgradeGeckoProfileToCurrentVersion(profile: Object) {
  const profileVersion = profile.meta.version || UNANNOTATED_VERSION;
  if (profileVersion === CURRENT_VERSION) {
    return;
  }

  if (profileVersion > CURRENT_VERSION) {
    throw new Error(
      `Unable to parse a Gecko profile of version ${profileVersion} - are you running an outdated version of perf.html? ` +
        `The most recent version understood by this version of perf.html is version ${CURRENT_VERSION}.\n` +
        'You can try refreshing this page in case perf.html has updated in the meantime.'
    );
  }

  // Convert to CURRENT_VERSION, one step at a time.
  for (
    let destVersion = profileVersion + 1;
    destVersion <= CURRENT_VERSION;
    destVersion++
  ) {
    if (destVersion in _upgraders) {
      _upgraders[destVersion](profile);
    }
  }

  profile.meta.version = CURRENT_VERSION;
}

function _archFromAbi(abi) {
  if (abi === 'x86_64-gcc3') {
    return 'x86_64';
  }
  return abi;
}

// _upgraders[i] converts from version i - 1 to version i.
// Every "upgrader" takes the profile as its single argument and mutates it.
/* eslint-disable no-useless-computed-key */
const _upgraders = {
  [1]: () => {
    throw new Error(
      'Gecko profiles without version numbers are very old and no conversion code has been written for that version of the profile format.'
    );
  },
  [2]: () => {
    throw new Error(
      'Gecko profile version 1 is very old and no conversion code has been written for that version of the profile format.'
    );
  },
  [3]: () => {
    throw new Error(
      'Gecko profile version 2 is very old and no conversion code has been written for that version of the profile format.'
    );
  },
  [4]: profile => {
    function convertToVersionFourRecursive(p) {
      // In version < 3, p.libs was a JSON string.
      // Starting with version 4, libs is an actual array, each lib has
      // "debugName", "debugPath", "breakpadId" and "path" fields, and the
      // array is sorted by start address.
      p.libs = JSON.parse(p.libs)
        .map(lib => {
          if ('breakpadId' in lib) {
            lib.debugName = lib.name.substr(lib.name.lastIndexOf('/') + 1);
          } else {
            lib.debugName = lib.pdbName;
            const pdbSig = lib.pdbSignature.replace(/[{}-]/g, '').toUpperCase();
            lib.breakpadId = pdbSig + lib.pdbAge;
          }
          delete lib.pdbName;
          delete lib.pdbAge;
          delete lib.pdbSignature;
          lib.path = lib.name;
          lib.name = lib.debugName.endsWith('.pdb')
            ? lib.debugName.substr(0, lib.debugName.length - 4)
            : lib.debugName;
          lib.arch = _archFromAbi(p.meta.abi);
          lib.debugPath = '';
          return lib;
        })
        .sort((a, b) => a.start - b.start);

      for (let threadIndex = 0; threadIndex < p.threads.length; threadIndex++) {
        if (typeof p.threads[threadIndex] === 'string') {
          // Also do the modification to embedded subprocess profiles.
          const subprocessProfile = JSON.parse(p.threads[threadIndex]);
          convertToVersionFourRecursive(subprocessProfile);
          p.threads[threadIndex] = JSON.stringify(subprocessProfile);
        } else {
          // At the beginning of format version 3, the thread name for any
          // threads in a "tab" process was "Content", and the processType
          // field did not exist. When this was changed, the version was not
          // updated, so we handle both cases here.
          const thread = p.threads[threadIndex];
          if (!('processType' in thread)) {
            if (thread.name === 'Content') {
              thread.processType = 'tab';
              thread.name = 'GeckoMain';
            } else if (thread.name === 'Plugin') {
              thread.processType = 'plugin';
            } else {
              thread.processType = 'default';
            }
          }
        }
      }

      p.meta.version = 4;
    }
    convertToVersionFourRecursive(profile);
  },
  [5]: profile => {
    // In version 4, profiles from other processes were embedded as JSON
    // strings in the threads array. Version 5 breaks those out into a
    // separate "processes" array and no longer stringifies them.
    function convertToVersionFiveRecursive(p) {
      const allThreadsAndProcesses = p.threads.map(threadOrProcess => {
        if (typeof threadOrProcess === 'string') {
          const processProfile = JSON.parse(threadOrProcess);
          convertToVersionFiveRecursive(processProfile);
          return {
            type: 'process',
            data: processProfile,
          };
        }
        return {
          type: 'thread',
          data: threadOrProcess,
        };
      });
      p.processes = allThreadsAndProcesses
        .filter(x => x.type === 'process')
        .map(p => p.data);
      p.threads = allThreadsAndProcesses
        .filter(x => x.type === 'thread')
        .map(t => t.data);
      p.meta.version = 5;
    }
    convertToVersionFiveRecursive(profile);
  },
  [6]: profile => {
    // The frameNumber column was removed from the samples table.
    function convertToVersionSixRecursive(p) {
      for (const thread of p.threads) {
        delete thread.samples.schema.frameNumber;
        for (
          let sampleIndex = 0;
          sampleIndex < thread.samples.data.length;
          sampleIndex++
        ) {
          // Truncate the array to a maximum length of 5.
          // The frameNumber used to be the last item, at index 5.
          thread.samples.data[sampleIndex].splice(5);
        }
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionSixRecursive(subprocessProfile);
      }
    }
    convertToVersionSixRecursive(profile);
  },
  [7]: profile => {
    // The type field for DOMEventMarkerPayload was renamed to eventType.
    function convertToVersionSevenRecursive(p) {
      for (const thread of p.threads) {
        const stringTable = new UniqueStringArray(thread.stringTable);
        const nameIndex = thread.markers.schema.name;
        const dataIndex = thread.markers.schema.data;
        for (let i = 0; i < thread.markers.data.length; i++) {
          const name = stringTable.getString(thread.markers.data[i][nameIndex]);
          if (name === 'DOMEvent') {
            const data = thread.markers.data[i][dataIndex];
            data.eventType = data.type;
            data.type = 'DOMEvent';
          }
        }
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionSevenRecursive(subprocessProfile);
      }
    }
    convertToVersionSevenRecursive(profile);
  },
  [8]: profile => {
    // Profiles have the following new attributes:
    //  - meta.shutdownTime: null if the process is still running, otherwise
    //    the shutdown time of the process in milliseconds relative to
    //    meta.startTime
    //  - pausedRanges: an array of
    //    { startTime: number | null, endTime: number | null, reason: string }
    // Each thread has the following new attributes:
    //  - registerTime: The time this thread was registered with the profiler,
    //    in milliseconds since meta.startTime
    //  - unregisterTime: The time this thread was unregistered from the
    //    profiler, in milliseconds since meta.startTime, or null
    function convertToVersionEightRecursive(p) {
      // We can't invent missing data, so just initialize everything with some
      // kind of empty value.

      // "The profiler was never paused during the recorded range, and we never
      // collected a profile."
      p.pausedRanges = [];

      // "All processes were still alive by the time the profile was captured."
      p.meta.shutdownTime = null;

      for (const thread of p.threads) {
        // "All threads were registered instantly at process startup."
        thread.registerTime = 0;

        // "All threads were still alive by the time the profile was captured."
        thread.unregisterTime = null;
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionEightRecursive(subprocessProfile);
      }
    }
    convertToVersionEightRecursive(profile);
  },
  [9]: profile => {
    function convertToVersionNineRecursive(p) {
      for (const thread of p.threads) {
        //const stringTable = new UniqueStringArray(thread.stringTable);
        //const nameIndex = thread.markers.schema.name;
        const dataIndex = thread.markers.schema.data;
        for (let i = 0; i < thread.markers.data.length; i++) {
          let marker = thread.markers.data[i][dataIndex];
          if (marker) {
            switch (marker.type) {
              case 'GCMinor':
                marker = upgradeGCMinorMarker(marker);
                break;
              case 'GCMajor':
                marker = upgradeGCMajorMarker_Gecko8To9(marker);
                break;
              default:
                break;
            }
            thread.markers.data[i][dataIndex] = marker;
          }
        }
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionNineRecursive(subprocessProfile);
      }
    }
    convertToVersionNineRecursive(profile);
  },
  [10]: profile => {
    // Removed the startDate and endDate from DOMEventMarkerPayload and
    // made it a tracing marker instead. DOMEventMarkerPayload is no longer a
    // single marker, it requires a start and an end marker. Therefore, we have
    // to change the old DOMEvent marker and also create an end marker for each
    // DOMEvent.
    function convertToVersionTenRecursive(p) {
      for (const thread of p.threads) {
        const { markers } = thread;
        const stringTable = new UniqueStringArray(thread.stringTable);
        const nameIndex = markers.schema.name;
        const dataIndex = markers.schema.data;
        const timeIndex = markers.schema.time;
        const extraMarkers = [];
        for (let i = 0; i < markers.data.length; i++) {
          const marker = markers.data[i];
          const name = stringTable.getString(marker[nameIndex]);
          const data = marker[dataIndex];
          if (name === 'DOMEvent' && data.type !== 'tracing') {
            const endMarker = [];
            endMarker[dataIndex] = {
              type: 'tracing',
              category: 'DOMEvent',
              timeStamp: data.timeStamp,
              interval: 'end',
              eventType: data.eventType,
              phase: data.phase,
            };
            endMarker[timeIndex] = data.endTime;
            endMarker[nameIndex] = marker[nameIndex];
            extraMarkers.push(endMarker);

            marker[timeIndex] = data.startTime;
            marker[dataIndex] = {
              type: 'tracing',
              category: 'DOMEvent',
              timeStamp: data.timeStamp,
              interval: 'start',
              eventType: data.eventType,
              phase: data.phase,
            };
          }
        }

        // Add all extraMarkers to the end of the markers array. In the Gecko
        // profile format, markers don't need to be sorted by time.
        markers.data = markers.data.concat(extraMarkers);
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionTenRecursive(subprocessProfile);
      }
    }
    convertToVersionTenRecursive(profile);
  },
  [11]: profile => {
    // Ensure there is always a pid in the profile meta AND upgrade
    // profile.meta categories.

    // This first upgrader ensures there is always a PID. The PID has been included
    // in the Gecko profile version for quite a while, but there has never been
    // an upgrader ensuring that one exists. This pid upgrader is piggy-backing on
    // version 11, but is unrelated to the actual version bump. If no pid number exists,
    // then a unique string label is created.
    let unknownPid = 0;
    function ensurePidsRecursive(p) {
      for (const thread of p.threads) {
        if (thread.pid === null || thread.pid === undefined) {
          thread.pid = `Unknown Process ${++unknownPid}`;
        }
      }
      for (const subprocessProfile of p.processes) {
        ensurePidsRecursive(subprocessProfile);
      }
    }
    ensurePidsRecursive(profile);

    // profile.meta has a new property called "categories", which contains a
    // list of categories, which are objects with "name" and "color" properties.
    // The "category" column in the frameTable now refers to elements in this
    // list.
    //
    // Old category list:
    // https://searchfox.org/mozilla-central/rev/5a744713370ec47969595e369fd5125f123e6d24/js/public/ProfilingStack.h#193-201
    // New category list:
    // [To be inserted once the Gecko change lands in mozilla-central]
    const categories = [
      {
        name: 'Idle',
        color: 'transparent',
      },
      {
        name: 'Other',
        color: 'grey',
      },
      {
        name: 'JavaScript',
        color: 'yellow',
      },
      {
        name: 'Layout',
        color: 'purple',
      },
      {
        name: 'Graphics',
        color: 'green',
      },
      {
        name: 'DOM',
        color: 'blue',
      },
      {
        name: 'GC / CC',
        color: 'orange',
      },
      {
        name: 'Network',
        color: 'lightblue',
      },
    ];
    const oldCategoryToNewCategory = {
      [1 << 4 /* OTHER */]: 1 /* Other */,
      [1 << 5 /* CSS */]: 3 /* Layout */,
      [1 << 6 /* JS */]: 2 /* JavaScript */,
      [1 << 7 /* GC */]: 6 /* GC / CC */,
      [1 << 8 /* CC */]: 6 /* GC / CC */,
      [1 << 9 /* NETWORK */]: 7 /* Network */,
      [1 << 10 /* GRAPHICS */]: 4 /* Graphics */,
      [1 << 11 /* STORAGE */]: 1 /* Other */,
      [1 << 12 /* EVENTS */]: 1 /* Other */,
    };
    function convertToVersionElevenRecursive(p) {
      p.meta.categories = categories;
      for (const thread of p.threads) {
        const schemaIndexCategory = thread.frameTable.schema.category;
        for (const frame of thread.frameTable.data) {
          if (schemaIndexCategory in frame) {
            if (frame[schemaIndexCategory] !== null) {
              if (frame[schemaIndexCategory] in oldCategoryToNewCategory) {
                frame[schemaIndexCategory] =
                  oldCategoryToNewCategory[frame[schemaIndexCategory]];
              } else {
                frame[schemaIndexCategory] = 1 /* Other*/;
              }
            }
          }
        }
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionElevenRecursive(subprocessProfile);
      }
    }
    convertToVersionElevenRecursive(profile);
  },
  [12]: profile => {
    // This version will add column numbers to the JS functions and scripts.
    // There is also a new property in the frameTable called "column" which
    // swaps positions with the "category" property.  The new value for
    // "category" in the frameTable schema will be 5.
    const oldSchemaCategoryIndex = 4;
    const newSchemaCategoryIndex = 5;
    function convertToVersionTwelveRecursive(p) {
      for (const thread of p.threads) {
        const schemaIndexCategory = thread.frameTable.schema.category;
        for (const frame of thread.frameTable.data) {
          if (frame.hasOwnProperty(schemaIndexCategory)) {
            frame[newSchemaCategoryIndex] = frame[oldSchemaCategoryIndex];
            frame[oldSchemaCategoryIndex] = null;
          }
        }
        thread.frameTable.schema.category = newSchemaCategoryIndex;
        thread.frameTable.schema.column = oldSchemaCategoryIndex;
      }
      for (const subprocessProfile of p.processes) {
        convertToVersionTwelveRecursive(subprocessProfile);
      }
    }
    convertToVersionTwelveRecursive(profile);
  },
};
/* eslint-enable no-useless-computed-key */
