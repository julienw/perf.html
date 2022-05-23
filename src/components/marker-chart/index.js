/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import * as React from 'react';
import explicitConnect from 'firefox-profiler/utils/connect';
import { MarkerChartCanvas } from './Canvas2';
import { MarkerChartEmptyReasons } from './MarkerChartEmptyReasons';
import { MarkerSettings } from 'firefox-profiler/components/shared/MarkerSettings';
import {
  withSize,
  type SizeProps,
} from 'firefox-profiler/components/shared/WithSize';

import {
  getCommittedRange,
  getPreviewSelection,
} from 'firefox-profiler/selectors/profile';
import { selectedThreadSelectors } from 'firefox-profiler/selectors/per-thread';
import {
  getSelectedThreadsKey,
  getTimelineTrackOrganization,
} from 'firefox-profiler/selectors/url-state';
import { getTimelineMarginLeft } from 'firefox-profiler/selectors/app';
import {
  updatePreviewSelection,
  changeRightClickedMarker,
} from 'firefox-profiler/actions/profile-view';
import { ContextMenuTrigger } from 'firefox-profiler/components/shared/ContextMenuTrigger';

import type {
  Marker,
  MarkerIndex,
  MarkerTimingAndBuckets,
  UnitIntervalOfProfileRange,
  StartEndRange,
  PreviewSelection,
  ThreadsKey,
  CssPixels,
  TimelineTrackOrganization,
} from 'firefox-profiler/types';

import type { ConnectedProps } from 'firefox-profiler/utils/connect';

import './index.css';

const ROW_HEIGHT = 16;

type DispatchProps = {|
  +updatePreviewSelection: typeof updatePreviewSelection,
  +changeRightClickedMarker: typeof changeRightClickedMarker,
|};

type StateProps = {|
  +getMarker: (MarkerIndex) => Marker,
  +markerTimingAndBuckets: MarkerTimingAndBuckets,
  +timeRange: StartEndRange,
  +threadsKey: ThreadsKey,
  +previewSelection: PreviewSelection,
  +rightClickedMarkerIndex: MarkerIndex | null,
  +timelineMarginLeft: CssPixels,
  +timelineTrackOrganization: TimelineTrackOrganization,
|};

type Props = ConnectedProps<SizeProps, StateProps, DispatchProps>;

class MarkerChartImpl extends React.PureComponent<Props> {
  _viewport: HTMLDivElement | null = null;

  /**
   * Determine the maximum zoom of the viewport.
   */
  getMaximumZoom(): UnitIntervalOfProfileRange {
    const {
      timeRange: { start, end },
    } = this.props;

    // This is set to a very small value, that represents 1ns. We can't set it
    // to zero unless we revamp how ranges are handled in the app to prevent
    // less-than-1ns ranges, otherwise we can get stuck at a "0" zoom.
    const ONE_NS = 1e-6;
    return ONE_NS / (end - start);
  }

  _shouldDisplayTooltips = () => this.props.rightClickedMarkerIndex === null;

  componentDidMount() {
    //this._focusViewport();
  }

  render() {
    const {
      timeRange,
      threadsKey,
      markerTimingAndBuckets,
      getMarker,
      previewSelection,
      updatePreviewSelection,
      changeRightClickedMarker,
      rightClickedMarkerIndex,
      timelineMarginLeft,
      timelineTrackOrganization,
    } = this.props;

    let markerNameCounter = 0;
    let previousName = null;
    return (
      <div
        className="markerChart"
        id="marker-chart-tab"
        role="tabpanel"
        aria-labelledby="marker-chart-tab-button"
      >
        <MarkerSettings />
        {markerTimingAndBuckets.length === 0 ? (
          <MarkerChartEmptyReasons />
        ) : (
          <ContextMenuTrigger
            id="MarkerContextMenu"
            attributes={{
              className: 'treeViewContextMenu',
            }}
          >
            {markerTimingAndBuckets.map((timingOrBucket) => {
              if (typeof timingOrBucket === 'string') {
                return (
                  <div className="markerChart-bucket-name" key={timingOrBucket}>
                    {timingOrBucket}
                  </div>
                );
              }
              const { name } = timingOrBucket;

              if (name !== previousName) {
                markerNameCounter = 0;
                previousName = name;
              }
              return (
                <MarkerChartCanvas
                  key={`${name}-${markerNameCounter++}`}
                  timing={timingOrBucket}
                  getMarker={getMarker}
                  // $FlowFixMe Error introduced by upgrading to v0.96.0. See issue #1936.
                  updatePreviewSelection={updatePreviewSelection}
                  changeRightClickedMarker={changeRightClickedMarker}
                  rangeStart={timeRange.start}
                  rangeEnd={timeRange.end}
                  height={ROW_HEIGHT}
                  width={this.props.width}
                  threadsKey={threadsKey}
                  rightClickedMarkerIndex={rightClickedMarkerIndex}
                  shouldDisplayTooltips={this._shouldDisplayTooltips}
                />
              );
            })}
          </ContextMenuTrigger>
        )}
      </div>
    );
  }
}

export const MarkerChart = explicitConnect<{||}, StateProps, DispatchProps>({
  mapStateToProps: (state) => {
    const markerTimingAndBuckets =
      selectedThreadSelectors.getMarkerChartTimingAndBuckets(state);
    return {
      getMarker: selectedThreadSelectors.getMarkerGetter(state),
      markerTimingAndBuckets,
      timeRange: getCommittedRange(state),
      threadsKey: getSelectedThreadsKey(state),
      previewSelection: getPreviewSelection(state),
      rightClickedMarkerIndex:
        selectedThreadSelectors.getRightClickedMarkerIndex(state),
      timelineMarginLeft: getTimelineMarginLeft(state),
      timelineTrackOrganization: getTimelineTrackOrganization(state),
    };
  },
  mapDispatchToProps: { updatePreviewSelection, changeRightClickedMarker },
  component: withSize(MarkerChartImpl),
});
