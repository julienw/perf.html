/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow

import type { Milliseconds, Microseconds, Seconds } from './units';
import type { GeckoMarkerStack } from './gecko-profile';
import type { IndexIntoStackTable } from './profile';

/**
 * Measurement for how long draw calls take for the compositor.
 */
export type GPUMarkerPayload = {
  type: 'gpu_timer_query',
  startTime: Milliseconds, // Same as cpustart
  endTime: Milliseconds, // Same as cpuend
  cpustart: Milliseconds,
  cpuend: Milliseconds,
  gpustart: Milliseconds, // Always 0.
  gpuend: Milliseconds, // The time the GPU took to execute the command.
};

export type CauseBacktrace = {
  time: Milliseconds,
  stack: IndexIntoStackTable,
};

/**
 * These markers don't have a start and end time. They work in pairs, one
 * specifying the start, the other specifying the end of a specific tracing
 * marker.
 */
export type PaintProfilerMarkerTracing_Gecko = {
  type: 'tracing',
  category: 'Paint',
  stack?: GeckoMarkerStack,
  interval: 'start' | 'end',
};

export type PaintProfilerMarkerTracing = {
  type: 'tracing',
  category: 'Paint',
  cause?: CauseBacktrace,
  interval: 'start' | 'end',
};

export type PhaseTimes<Unit> = { [phase: string]: Unit };

type GCSliceData_Shared = {
  // Slice number within the GCMajor collection.
  slice: number,

  pause: Milliseconds,

  // The reason for this slice.
  reason: string,

  // The GC state at the start and end of this slice.
  initial_state: string,
  final_state: string,

  // The incremental GC budget for this slice (see pause above).
  budget: Milliseconds,

  // The number of the GCMajor that this slice belongs to.
  major_gc_number: number,

  // These are present if the collection was triggered by exceeding some
  // threshold.  The reason field says how they should be interpreted.
  trigger_amount?: number,
  trigger_threshold?: number,

  // The number of page faults that occured during the slice.  If missing
  // there were 0 page faults.
  page_faults?: number,

  start_timestamp: Seconds,
};
export type GCSliceData_Gecko = GCSliceData_Shared & {
  times: PhaseTimes<Milliseconds>,
};
export type GCSliceData = GCSliceData_Shared & {
  phase_times: PhaseTimes<Microseconds>,
};

export type GCMajorAborted = {
  status: 'aborted',
};

type GCMajorCompleted_Shared = {
  status: 'completed',
  // timestamp is present but is usually 0
  // timestamp: number,
  max_pause: Milliseconds,

  // The sum of all the slice durations
  total_time: Milliseconds,

  // The reason from the first slice. see JS::gcreason::Reason
  reason: string,

  // Counts.
  zones_collected: number,
  total_zones: number,
  total_compartments: number,
  minor_gcs: number,
  // Present when non-zero.
  store_buffer_overflows?: number,
  slices: number,

  // Timing for the SCC sweep phase.
  scc_sweep_total: Milliseconds,
  scc_sweep_max_pause: Milliseconds,

  // The reason why this GC ran non-incrementally. Older profiles could have the string
  // 'None' as a reason.
  nonincremental_reason?: 'None' | string,

  // The allocated space for the whole heap before the GC started.
  allocated_bytes: number,

  // Only present if non-zero.
  added_chunks?: number,
  removed_chunks?: number,

  // The number for the start of this GC event.
  major_gc_number: number,
  minor_gc_number: number,

  // Slice number isn't in older profiles.
  slice_number?: number,

  // This usually isn't present with the gecko profiler, but it's the same
  // as all of the slice markers themselves.
  slices_list?: GCSliceData[],
};

export type GCMajorCompleted = GCMajorCompleted_Shared & {
  // MMU (Minimum mutator utilisation) A measure of GC's affect on
  // responsiveness  See Statistics::computeMMU(), these percentages in the
  // rage of 0-100.
  // Percentage of time the mutator ran in a 20ms window.
  mmu_20ms: number,
  // Percentage of time the mutator ran in a 50ms window.
  mmu_50ms: number,

  // The duration of each phase.
  phase_times: PhaseTimes<Microseconds>,
};
export type GCMajorCompleted_Gecko = GCMajorCompleted_Shared & {
  // As above except in parts of 100.
  mmu_20ms: number,
  mmu_50ms: number,
  totals: PhaseTimes<Milliseconds>,
};

export type GCMajorMarkerPayload = {
  type: 'GCMajor',
  startTime: Milliseconds,
  endTime: Milliseconds,
  timings: GCMajorAborted | GCMajorCompleted,
};

export type GCMajorMarkerPayload_Gecko = {
  type: 'GCMajor',
  startTime: Milliseconds,
  endTime: Milliseconds,
  timings: GCMajorAborted | GCMajorCompleted_Gecko,
};

export type GCMinorCompletedData = {
  status: 'complete',

  // The reason for initiating the GC.
  reason: string,

  // The size of the data moved into the tenured heap.
  bytes_tenured: number,

  // The total amount of data that was allocated in the nursery.
  bytes_used: number,

  // The total capacity of the nursery before and after this GC.
  // Capacity may change as the nursery size is tuned after each collection.
  // cur_capacity isn't in older profiles.
  cur_capacity?: number,

  // If the nursery is resized after this collection then this field is
  // present giving the new size.
  new_capacity?: number,

  // The nursery may be dynamically resized (since version 58)
  // this field is the lazy-allocated size.  It is not present in older
  // versions.
  // If the currently allocated size is different from the size
  // (cur_capacity) then this field is present and shows how much memory is
  // actually allocated.
  lazy_capacity?: number,

  chunk_alloc_us?: Microseconds,

  phase_times: PhaseTimes<Microseconds>,
};

export type GCMinorDisabledData = {|
  status: 'nursery disabled',
|};
export type GCMinorEmptyData = {|
  status: 'nursery empty',
|};

export type GCMinorMarkerPayload = {
  type: 'GCMinor',
  startTime: Milliseconds,
  endTime: Milliseconds,
  // nursery is only present in newer profile format.
  nursery?: GCMinorCompletedData | GCMinorDisabledData | GCMinorEmptyData,
};

export type GCSliceMarkerPayload = {
  type: 'GCSlice',
  startTime: Milliseconds,
  endTime: Milliseconds,
  timings: GCSliceData,
};

export type GCSliceMarkerPayload_Gecko = {
  type: 'GCSlice',
  startTime: Milliseconds,
  endTime: Milliseconds,
  timings: GCSliceData_Gecko,
};

/**
 * The bailout payload describes a bailout from JIT code where some assumption in
 * the optimization was broken, and the code had to fall back to Baseline. Currently
 * this information is encoded as a string and extracted as a selector.
 */
export type BailoutPayload = {
  type: 'Bailout',
  bailoutType: string,
  where: string,
  script: string,
  bailoutLine: number,
  functionLine: number,
  startTime: Milliseconds,
  endTime: Milliseconds,
};

/**
 * TODO - Please describe an invalidation.
 */
export type InvalidationPayload = {
  type: 'Invalidation',
  url: string,
  line: string,
  startTime: Milliseconds,
  endTime: Milliseconds,
};

/**
 * The payload for the UserTimings API. These are added through performance.measure()
 * and performance.mark(). https://developer.mozilla.org/en-US/docs/Web/API/Performance
 */
export type UserTimingMarkerPayload = {
  type: 'UserTiming',
  startTime: Milliseconds,
  endTime: Milliseconds,
  name: string,
  entryType: 'measure' | 'mark',
};

export type DOMEventMarkerPayload = {
  type: 'DOMEvent',
  timeStamp?: Milliseconds,
  startTime: Milliseconds,
  endTime: Milliseconds,
  eventType: string,
  phase: 0 | 1 | 2 | 3,
};

type StyleMarkerPayload_Shared = {
  type: 'Styles',
  category: 'Paint',
  startTime: Milliseconds,
  endTime: Milliseconds,

  // Counts
  elementsTraversed: number,
  elementsStyled: number,
  elementsMatched: number,
  stylesShared: number,
  stylesReused: number,
};

/**
 * The payload for Styles.
 */
export type StyleMarkerPayload_Gecko = StyleMarkerPayload_Shared & {
  stack?: GeckoMarkerStack,
};

export type StyleMarkerPayload = StyleMarkerPayload_Shared & {
  cause?: CauseBacktrace,
};

export type DummyForTestsMarkerPayload = {
  type: 'DummyForTests',
  startTime: Milliseconds,
  endTime: Milliseconds,
};

/**
 * The union of all the different marker payloads that perf.html knows about, this is
 * not guaranteed to be all the payloads that we actually get from the profiler.
 */
export type MarkerPayload =
  | GPUMarkerPayload
  | BailoutPayload
  | InvalidationPayload
  | UserTimingMarkerPayload
  | PaintProfilerMarkerTracing
  | DOMEventMarkerPayload
  | GCMinorMarkerPayload
  | GCMajorMarkerPayload
  | GCSliceMarkerPayload
  | StyleMarkerPayload
  | DummyForTestsMarkerPayload
  | null;

export type MarkerPayload_Gecko =
  | GPUMarkerPayload
  | UserTimingMarkerPayload
  | PaintProfilerMarkerTracing_Gecko
  | DOMEventMarkerPayload
  | GCMinorMarkerPayload
  | GCMajorMarkerPayload_Gecko
  | GCSliceMarkerPayload_Gecko
  | StyleMarkerPayload_Gecko
  | DummyForTestsMarkerPayload
  | null;
