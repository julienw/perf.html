/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import Collapse, { Panel } from 'rc-collapse';
import FlameChartSettings from './FlameChartSettings';
import TimelineFlameChart from './TimelineFlameChart';
import TimelineMarkers from './TimelineMarkers';
import { withSize } from '../shared/WithSize';
import { getSelectedThreadIndex } from '../../reducers/url-state';
import { selectorsForThread } from '../../reducers/profile-view';

import type { State } from '../../types/reducers';
import type { ThreadIndex } from '../../types/profile';

require('./TimelineView.css');
require('rc-collapse/assets/index.css');

type Props = {|
  threadIndex: ThreadIndex,
  threadName: string,
  height: number,
|};

class TimlineViewTimelinesImpl extends PureComponent {
  props: Props;

  _scrollElement: ?HTMLElement;

  constructor(props: Props) {
    super(props);
    (this: any)._getScrollElement = this._getScrollElement.bind(this);
    (this: any)._setScrollElementRef = this._setScrollElementRef.bind(this);
  }

  _getScrollElement(): ?HTMLElement {
    return this._scrollElement;
  }

  _setScrollElementRef(element: HTMLElement) {
    this._scrollElement = element;
  }

  render() {
    const { threadIndex, threadName, height } = this.props;

    return (
      <Collapse accordion={true}>
        <Panel header={`Sample based callstacks (${threadName})`}>
          <TimelineFlameChart
            threadIndex={threadIndex}
            viewHeight={height}
            getScrollElement={this._getScrollElement}
          />
        </Panel>
        <Panel header={`Marker Events (${threadName})`}>
          <TimelineMarkers
            threadIndex={threadIndex}
            viewHeight={height}
            getScrollElement={this._getScrollElement}
          />
        </Panel>
      </Collapse>
    );
  }
}

const TimelineViewTimelines = withSize(TimlineViewTimelinesImpl);

class TimelineView extends PureComponent {
  props: {
    threadIndex: ThreadIndex,
    threadName: string,
  };

  render() {
    return (
      <div className="timelineView">
        <FlameChartSettings />
        <TimelineViewTimelines {...this.props} />
      </div>
    );
  }
}

export default connect((state: State) => {
  const threadIndex = getSelectedThreadIndex(state);
  const threadSelectors = selectorsForThread(threadIndex);
  return {
    threadIndex,
    threadName: threadSelectors.getFriendlyThreadName(state),
  };
})(TimelineView);
