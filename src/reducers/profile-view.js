/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow
/* eslint-disable */
import { createSelector } from 'reselect';

type UrlState = {
  selectedThread: number,
};

type State = {
  urlState: UrlState,
};

/**
 * Profile
 */
export const getThreads = (state: State): string => 'foo';
export type SelectorsForThread = {
  getTransformLabels: State => string[],
};
const getTransformStack = (state: State): string => {
  return 'foo';
};

const selectorsForThreads: { [key: number]: SelectorsForThread } = {};

export function getMyFriendlyThreadName(
  _threads: string,
  _thread: string
): string {
  return 'foo';
}

export function getMyTransformLabels(
  _thread: string,
  _threadName: string,
  _transforms: string
) {
  const labels = ['plop'];
  return labels;
}

export const selectorsForThread = (
  threadIndex: number
): SelectorsForThread => {
  if (!(threadIndex in selectorsForThreads)) {
    /**
     * The first per-thread selectors filter out and transform a thread based on user's
     * interactions. The transforms are order dependendent.
     *
     * 1. Unfiltered - The first selector gets the unmodified original thread.
     * 2. Range - New samples table with only samples in range.
     * 3. Transform - Apply the transform stack that modifies the stacks and samples.
     * 4. Implementation - Modify stacks and samples to only show a single implementation.
     * 5. Search - Exclude samples that don't include some text in the stack.
     * 6. Range selection - Only include samples that are within a user's sub-selection.
     */
    const getThread = (state: State): string => 'bar';
    const getFriendlyThreadName = createSelector(
      getThreads,
      getThread,
      getMyFriendlyThreadName
    );
    const getTransformLabels: (state: State) => string[] = createSelector(
      getThread,
      getFriendlyThreadName,
      getTransformStack,
      getMyTransformLabels
    );

    selectorsForThreads[threadIndex] = {
      getTransformLabels,
    };
  }
  return selectorsForThreads[threadIndex];
};

export const selectedThreadSelectors: SelectorsForThread = (() => {
  const anyThreadSelectors: SelectorsForThread = selectorsForThread(0);
  const result: { [key: string]: (State) => any } = {};
  for (const key in anyThreadSelectors) {
    result[key] = (state: State) =>
      selectorsForThread(state.urlState.selectedThread)[key](state);
  }
  const result2: SelectorsForThread = result;
  return result2;
})();
