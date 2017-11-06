/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getProfileViewOptions } from '../../reducers/profile-view';
import type { RequestedLib } from '../../types/reducers';

function englishSgPlLibrary(count) {
  return count === 1 ? 'library' : 'libraries';
}

function englishListJoin(list) {
  switch (list.length) {
    case 0:
      return '';
    case 1:
      return list[0];
    default: {
      const allButLast = list.slice(0, list.length - 1);
      return allButLast.join(', ') + ' and ' + list[list.length - 1];
    }
  }
}

type Props = {
  symbolicationStatus: string,
  waitingForLibs: Set<RequestedLib>,
};

class SymbolicationStatusOverlay extends PureComponent<Props> {
  render() {
    const { symbolicationStatus, waitingForLibs } = this.props;
    if (symbolicationStatus === 'SYMBOLICATING') {
      if (waitingForLibs.size > 0) {
        const libNames = Array.from(waitingForLibs.values()).map(
          lib => lib.debugName
        );
        return (
          <div className="symbolicationStatusOverlay">
            <span className="symbolicationStatusOverlayThrobber" />
            {`Waiting for symbol tables for ${englishSgPlLibrary(
              libNames.length
            )} ${englishListJoin(libNames)}...`}
          </div>
        );
      }
      return (
        <div className="symbolicationStatusOverlay">
          <span className="symbolicationStatusOverlayThrobber" />
          {'Symbolicating call stacks...'}
        </div>
      );
    }
    return <div className="symbolicationStatusOverlay hidden" />;
  }
}

export default connect((state): * => ({
  symbolicationStatus: getProfileViewOptions(state).symbolicationStatus,
  waitingForLibs: getProfileViewOptions(state).waitingForLibs,
}))(SymbolicationStatusOverlay);
