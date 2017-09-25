/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow
/* eslint-disable */
type Selector<TState, TProps, TResult> = {
    (state: TState, props: TProps, ...rest: any[]): TResult;
};

type SelectorCreator = {
  <TState, TProps, TResult, T1, T2>(
    selector1: Selector<TState, TProps, T1>,
    selector2: Selector<TState, TProps, T2>,
    resultFunc: (
      arg1: T1,
      arg2: T2
    ) => TResult
  ): Selector<TState, TProps, TResult>;

  <TState, TProps, TResult, T1>(
    selector1: Selector<TState, TProps, T1>,
    resultFunc: (
      arg1: T1
    ) => TResult
  ): Selector<TState, TProps, TResult>;
};

type State = {
  foo: any,
};

function test(createSelector: SelectorCreator) {
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
}

