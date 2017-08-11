// @flow
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import TimelineMarkerCanvas from './TimelineMarkerCanvas';
import {
  selectorsForThread,
  getDisplayRange,
  getProfileInterval,
  getProfileViewOptions,
} from '../../reducers/profile-view';
import actions from '../../actions';

import type { Thread } from '../../types/profile';
import type {
  TracingMarker,
  MarkerTimingRows,
} from '../../types/profile-derived';
import type {
  Milliseconds,
  CssPixels,
  UnitIntervalOfProfileRange,
} from '../../types/units';
import type { UpdateProfileSelection } from '../../actions/profile-view';
import type { ProfileSelection } from '../../types/actions';

require('./TimelineMarkers.css');

const ROW_HEIGHT = 16;
const TIMELINE_ROW_HEIGHT = 34;

type Props = {|
  thread: Thread,
  maxMarkerRows: number,
  timeRange: { start: Milliseconds, end: Milliseconds },
  threadIndex: number,
  interval: Milliseconds,
  updateProfileSelection: UpdateProfileSelection,
  viewHeight: CssPixels,
  getScrollElement: () => HTMLElement,
  selection: ProfileSelection,
  markerTimingRows: MarkerTimingRows,
  markers: TracingMarker[],
|};

class TimelineMarkers extends PureComponent {
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
      maxMarkerRows,
      timeRange,
      threadIndex,
      interval,
      markerTimingRows,
      markers,
      updateProfileSelection,
      selection,
      getScrollElement,
    } = this.props;

    // The viewport needs to know about the height of what it's drawing, calculate
    // that here at the top level component.
    const maxViewportHeight = maxMarkerRows * ROW_HEIGHT;
    const height = this.getViewHeight(maxViewportHeight);

    return (
      <div className="timelineMarkers" style={{ height }}>
        <TimelineMarkerCanvas
          key={threadIndex}
          // TimelineViewport props
          timeRange={timeRange}
          maxViewportHeight={maxViewportHeight}
          getScrollElement={getScrollElement}
          maximumZoom={this.getMaximumZoom()}
          selection={selection}
          updateProfileSelection={updateProfileSelection}
          viewportNeedsUpdate={viewportNeedsUpdate}
          // TimelineMarkerCanvas props
          interval={interval}
          thread={thread}
          rangeStart={timeRange.start}
          rangeEnd={timeRange.end}
          markerTimingRows={markerTimingRows}
          maxMarkerRows={maxMarkerRows}
          markers={markers}
          rowHeight={ROW_HEIGHT}
        />
      </div>
    );
  }
}

function viewportNeedsUpdate(prevProps, newProps) {
  return prevProps.markerTimingRows !== newProps.markerTimingRows;
}

export default connect((state, ownProps) => {
  const { threadIndex } = ownProps;
  const threadSelectors = selectorsForThread(threadIndex);
  const markers = threadSelectors.getTracingMarkers(state);
  const markerTimingRows = threadSelectors.getMarkerTiming(state);

  return {
    thread: threadSelectors.getFilteredThreadForFlameChart(state),
    markers,
    markerTimingRows,
    maxMarkerRows: markerTimingRows.length,
    timeRange: getDisplayRange(state),
    interval: getProfileInterval(state),
    threadIndex,
    selection: getProfileViewOptions(state).selection,
  };
}, (actions: Object))(TimelineMarkers);
