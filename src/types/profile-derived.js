/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import type { Milliseconds } from './units';
import type { MarkerPayload } from './markers';
import type { IndexIntoFuncTable } from './profile';
export type IndexIntoCallNodeTable = number;

/**
 * Contains a table of function call information that represents the stacks of what
 * functions were called, as opposed to stacks based on frames. There can be multiple
 * frames for a single function call. Using stacks as opposed to a computed tree of
 * CallNodes can cause duplicated functions in the call tree.
 *
 * For example:
 *
 *            stack1 (funcA)                             callNode1 (funcA)
 *                 |                                            |
 *                 v                                            v
 *            stack2 (funcB)         StackTable to       callNode2 (funcB)
 *                 |                 CallNodeTable              |
 *                 v                      ->                    v
 *            stack3 (funcC)                             callNode3 (funcC)
 *            /            \                                    |
 *           V              V                                   v
 *    stack4 (funcD)     stack5 (funcD)                  callNode4 (funcD)
 *         |                  |                          /               \
 *         v                  V                         V                 V
 *    stack6 (funcE)     stack7 (funcF)       callNode5 (funcE)     callNode6 (funcF)
 *
 * For a detailed explanation of callNodes see `docs/call-tree.md` and
 * `docs/call-nodes-in-cpp.md`.
 *
 * Whenever we use a number as an `IndexIntoCallNodeTable`, this means an entry in
 * this table. And actually this means an entry to both `prefix` (representing
 * the call chain) and `func` (representing the actual function). So this table
 * is nothing more than a relationship table.
 * We can convert from/to this table with the functions `getCallNodePathFromIndex`
 * and `getCallNodeIndexFromPath` in `profile-logic/profile-data.js`, as they're
 * completely equivalent. A CallNodePath is nothing more than having the call
 * chain unrolled.
 */
export type CallNodeTable = {
  prefix: Int32Array, // really Array<IndexIntoCallNodeTable>
  func: Int32Array, //   really Array<IndexIntoFuncTable>
  depth: number[],
  length: number,
};

/**
 * Both the callNodeTable and a map that converts an IndexIntoStackTable
 * into an IndexIntoCallNodeTable.
 */
export type CallNodeInfo = {
  callNodeTable: CallNodeTable,
  // IndexIntoStackTable -> IndexIntoCallNodeTable
  stackIndexToCallNodeIndex: Uint32Array,
};

/**
 * When working with call trees, individual nodes in the tree are not stable across
 * different types of transformations and filtering operations. In order to refer
 * to some place in the call tree we use a list of functions that either go from
 * root to tip for normal call trees, or from tip to root for inverted call trees.
 * These paths are then stored along with the implementation filter, and the whether
 * or not the tree is inverted for a stable reference into a call tree.
 *
 * In some parts of the code the term prefix path is used to refer to a CallNodePath that
 * goes from root to tip, and the term postfix path is used to refer to a CallNodePath
 * that goes from tip to root.
 */
export type CallNodePath = IndexIntoFuncTable[];

export type TracingMarker = {
  start: Milliseconds,
  dur: Milliseconds,
  name: string,
  title: string | null,
  data: MarkerPayload,
};

export type IndexIntoTracingMarkers = number;

export type CallNodeData = {
  funcName: string,
  totalTime: number,
  totalTimeRelative: number,
};

export type CallNodeDisplayData = {
  totalTime: string,
  totalTimePercent: string,
  selfTime: string,
  name: string,
  lib: string,
  dim: boolean,
  icon: string | null,
};

export type IndexIntoMarkerTiming = number;

export type MarkerTiming = {
  // Start time in milliseconds.
  start: number[],
  // End time in milliseconds.
  end: number[],
  index: IndexIntoTracingMarkers[],
  label: string[],
  name: string,
  length: number,
};
export type MarkerTimingRows = Array<MarkerTiming>;
