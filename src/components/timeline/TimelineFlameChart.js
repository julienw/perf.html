/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import FlameChartCanvas from './FlameChartCanvas';
import {
  selectorsForThread,
  getDisplayRange,
  getProfileInterval,
  getProfileViewOptions,
} from '../../reducers/profile-view';
import {
  getCategoryColorStrategy,
  getLabelingStrategy,
} from '../../reducers/flame-chart';
import actions from '../../actions';

import type { Thread } from '../../types/profile';
import type {
  Milliseconds,
  CssPixels,
  UnitIntervalOfProfileRange,
} from '../../types/units';
import type { StackTimingByDepth } from '../../profile-logic/stack-timing';
import type { GetCategory } from '../../profile-logic/color-categories';
import type { GetLabel } from '../../profile-logic/labeling-strategies';
import type { UpdateProfileSelection } from '../../actions/profile-view';
import type { ProfileSelection } from '../../types/actions';

require('./TimelineFlameChart.css');

const STACK_FRAME_HEIGHT = 16;
const TIMELINE_ROW_HEIGHT = 34;

type Props = {|
  thread: Thread,
  maxStackDepth: number,
  stackTimingByDepth: StackTimingByDepth,
  isSelected: boolean,
  timeRange: { start: Milliseconds, end: Milliseconds },
  threadIndex: number,
  interval: Milliseconds,
  getCategory: GetCategory,
  getLabel: GetLabel,
  updateProfileSelection: UpdateProfileSelection,
  viewHeight: CssPixels,
  getScrollElement: () => HTMLElement,
  selection: ProfileSelection,
  threadName: string,
  processDetails: string,
|};

class TimelineFlameChart extends PureComponent {
  props: Props;

  /**
   * Expanding view sizing strategy:
   *
   * EXACT SIZE:  Try and set it exactly to the size of the flame chart.
   * SMALL GRAPH: The smallest it can be is 1.5 times the row height, giving a visual cue
   *              to the user that this row is expanded, even if it's super shallow.
   * LARGE GRAPH: If the flame chart is too large, only expand out to most of the
   *              available space, leaving some margin to show the other rows.
   */
  getViewHeight(maxViewportHeight: number): number {
    const { viewHeight } = this.props;
    const exactSize = maxViewportHeight * 1.5;
    const largeGraph = viewHeight - TIMELINE_ROW_HEIGHT * 2;
    const smallGraph = TIMELINE_ROW_HEIGHT;
    return Math.max(smallGraph, Math.min(exactSize, largeGraph));
  }

  /**
   * Determine
   */
  getMaximumZoom(): UnitIntervalOfProfileRange {
    const { timeRange: { start, end }, interval } = this.props;
    return interval / (end - start);
  }

  render() {
    const {
      thread,
      maxStackDepth,
      stackTimingByDepth,
      isSelected,
      timeRange,
      threadIndex,
      interval,
      getCategory,
      getLabel,
      updateProfileSelection,
      selection,
      getScrollElement,
    } = this.props;

    // The viewport needs to know about the height of what it's drawing, calculate
    // that here at the top level component.
    const maxViewportHeight = maxStackDepth * STACK_FRAME_HEIGHT;
    const height = this.getViewHeight(maxViewportHeight);

    return (
      <div className="timelineFlameChart" style={{ height }}>
        <FlameChartCanvas
          key={threadIndex}
          // TimelineViewport props
          isSelected={isSelected}
          timeRange={timeRange}
          maxViewportHeight={maxViewportHeight}
          getScrollElement={getScrollElement}
          maximumZoom={this.getMaximumZoom()}
          selection={selection}
          updateProfileSelection={updateProfileSelection}
          viewportNeedsUpdate={viewportNeedsUpdate}
          // FlameChartCanvas props
          interval={interval}
          thread={thread}
          rangeStart={timeRange.start}
          rangeEnd={timeRange.end}
          stackTimingByDepth={stackTimingByDepth}
          getCategory={getCategory}
          getLabel={getLabel}
          maxStackDepth={maxStackDepth}
          stackFrameHeight={STACK_FRAME_HEIGHT}
        />
      </div>
    );
  }
}

export default connect((state, ownProps) => {
  const { threadIndex } = ownProps;
  const threadSelectors = selectorsForThread(threadIndex);
  const stackTimingByDepth = threadSelectors.getStackTimingByDepthForFlameChart(
    state
  );

  return {
    thread: threadSelectors.getFilteredThreadForFlameChart(state),
    maxStackDepth: threadSelectors.getCallNodeMaxDepthForFlameChart(state),
    stackTimingByDepth,
    isSelected: true,
    timeRange: getDisplayRange(state),
    interval: getProfileInterval(state),
    getCategory: getCategoryColorStrategy(state),
    getLabel: getLabelingStrategy(state),
    threadIndex,
    selection: getProfileViewOptions(state).selection,
  };
}, (actions: Object))(TimelineFlameChart);

function viewportNeedsUpdate(prevProps, newProps) {
  return prevProps.stackTimingByDepth !== newProps.stackTimingByDepth;
}
