/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import type { Thread } from '../../types/profile';
import './ThreadMarkerOverlay.css';

type Props = {
  rangeStart: number,
  rangeEnd: number,
  thread: Thread,
  onSelectMarker: number => *,
};

class ThreadMarkerOverlay extends PureComponent<Props> {
  constructor(props: Props) {
    super(props);
    (this: any)._mouseDownListener = this._mouseDownListener.bind(this);
  }

  _mouseDownListener(e: SyntheticMouseEvent<HTMLElement>) {
    if (!('index' in e.currentTarget.dataset)) {
      return;
    }
    this.props.onSelectMarker(+e.currentTarget.dataset.index);
  }

  render() {
    const { thread, rangeStart, rangeEnd } = this.props;
    const { markers } = thread;
    return (
      <ol className="threadMarkerOverlay" onMouseDown={this._mouseDownListener}>
        {markers.name.map((markerName, markerIndex) => {
          const time = markers.time[markerIndex];
          if (time < rangeStart || time > rangeEnd) {
            return null;
          }
          const data = markers.data[markerIndex];
          if (data) {
            if ('interval' in data) {
              return null;
            }
          }
          return (
            <li
              className="threadMarkerOverlayMarkerItem"
              key={markerIndex}
              data-index={markerIndex}
              style={{
                left: (time - rangeStart) / (rangeEnd - rangeStart) * 100 + '%',
              }}
            />
          );
        })}
      </ol>
    );
  }
}

export default ThreadMarkerOverlay;
