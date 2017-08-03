/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';

type State = {
  isIntersecting: boolean,
};

export const withIntersection = <P, T: React$Component<*, P & State, *>>(
  Wrapped: Class<T>
) =>
  class WithIntersectionWrapper extends Component<*, P, State> {
    // TODO Flow doesn't seem to properly forward P to the wrapped component and so doesn't handle property name mismatches
    props: P;
    state: State;
    _observer: IntersectionObserver;

    constructor(props: P) {
      super(props);

      this.state = { isIntersecting: false };
      (this: any)._observeIntersection = this._observeIntersection.bind(this);
    }

    _observeIntersection(wrappedComponent: T) {
      if (!wrappedComponent) {
        return;
      }
      const container = findDOMNode(wrappedComponent);
      if (!(container instanceof HTMLElement)) {
        // appease flow
        return;
      }

      this._observer = new IntersectionObserver(([{ isIntersecting }]) => {
        console.log('new intersection value !', isIntersecting);
        this.setState({ isIntersecting });
      });
      this._observer.observe(container);
    }

    componentWillUnmount() {
      this._observer.disconnect();
    }

    render() {
      return (
        <Wrapped
          ref={this._observeIntersection}
          {...this.props}
          {...this.state}
        />
      );
    }
  };
