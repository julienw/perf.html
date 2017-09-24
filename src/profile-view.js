/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow
/* eslint-disable */
import { createSelector } from 'reselect';

type State = {
  foo: any,
};

const simpleSelector = (state: State): string => 'foo';
const resultSelector = (arg: string): string => 'foo';

const combinedSelector1 = createSelector(
  simpleSelector,
  resultSelector,
);

const combinedSelector2: (state: State) => string = createSelector(
  combinedSelector1,
  resultSelector
);
