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
import { getIsFlameChartExpanded } from '../../reducers/timeline-view';
import actions from '../../actions';
import { getImplementationName } from '../../profile-logic/labeling-strategies';
import classNames from 'classnames';
import ContextMenuTrigger from '../shared/ContextMenuTrigger';

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

type Props = {
  thread: Thread,
  isRowExpanded: boolean,
  maxStackDepth: number,
  stackTimingByDepth: StackTimingByDepth,
  isSelected: boolean,
  timeRange: { start: Milliseconds, end: Milliseconds },
  threadIndex: number,
  interval: Milliseconds,
  getCategory: GetCategory,
  getLabel: GetLabel,
  changeTimelineFlameChartExpandedThread: (number, boolean) => {},
  updateProfileSelection: UpdateProfileSelection,
  viewHeight: CssPixels,
  getScrollElement: () => HTMLElement,
  selection: ProfileSelection,
  threadName: string,
  processDetails: string,
};

class TimelineFlameChart extends PureComponent<Props> {
  constructor(props) {
    super(props);
    (this: any).toggleThreadCollapse = this.toggleThreadCollapse.bind(this);
  }

  toggleThreadCollapse() {
    const {
      changeTimelineFlameChartExpandedThread,
      threadIndex,
      isRowExpanded,
    } = this.props;
    changeTimelineFlameChartExpandedThread(threadIndex, !isRowExpanded);
  }

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
    const { viewHeight, isRowExpanded } = this.props;
    const exactSize = isRowExpanded
      ? maxViewportHeight * 1.5
      : maxViewportHeight;
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
      isRowExpanded,
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
      threadName,
      processDetails,
      getScrollElement,
    } = this.props;

    // The viewport needs to know about the height of what it's drawing, calculate
    // that here at the top level component.
    const maxViewportHeight = maxStackDepth * STACK_FRAME_HEIGHT;
    const height = this.getViewHeight(maxViewportHeight);
    const buttonClass = classNames('timelineFlameChartCollapseButton', {
      expanded: isRowExpanded,
      collapsed: !isRowExpanded,
    });

    return (
      <div className="timelineFlameChart" style={{ height }}>
        {/**
          * The timeline will eventually have its own context menu, but for now re-use
          * the one in the header for hiding threads.
          */}
        <ContextMenuTrigger
          id={'ProfileThreadHeaderContextMenu'}
          title={processDetails}
          attributes={{ className: 'timelineFlameChartLabels grippy' }}
        >
          <span>
            {threadName}
          </span>
          <button className={buttonClass} onClick={this.toggleThreadCollapse} />
        </ContextMenuTrigger>
        <FlameChartCanvas
          key={threadIndex}
          // TimelineViewport props
          isRowExpanded={isRowExpanded}
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
  const isRowExpanded = getIsFlameChartExpanded(state, threadIndex);
  const stackTimingByDepth = isRowExpanded
    ? threadSelectors.getStackTimingByDepthForFlameChart(state)
    : threadSelectors.getLeafCategoryStackTimingForFlameChart(state);

  return {
    thread: threadSelectors.getFilteredThreadForFlameChart(state),
    isRowExpanded,
    maxStackDepth: isRowExpanded
      ? threadSelectors.getCallNodeMaxDepthForFlameChart(state)
      : 1,
    stackTimingByDepth,
    isSelected: true,
    timeRange: getDisplayRange(state),
    interval: getProfileInterval(state),
    getCategory: getCategoryColorStrategy(state),
    getLabel: isRowExpanded
      ? getLabelingStrategy(state)
      : getImplementationName,
    threadIndex,
    selection: getProfileViewOptions(state).selection,
    threadName: threadSelectors.getFriendlyThreadName(state),
    processDetails: threadSelectors.getThreadProcessDetails(state),
  };
}, (actions: Object))(TimelineFlameChart);

function viewportNeedsUpdate(prevProps, newProps) {
  return prevProps.stackTimingByDepth !== newProps.stackTimingByDepth;
}
