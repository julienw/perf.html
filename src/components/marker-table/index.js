/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import explicitConnect from '../../utils/connect';
import TreeView from '../shared/TreeView';
import {
  getZeroAt,
  selectedThreadSelectors,
} from '../../reducers/profile-view';
import { getSelectedThreadIndex } from '../../reducers/url-state';
import { changeSelectedMarker } from '../../actions/profile-view';
import { formatNumber } from '../../utils/format-numbers';
import Settings from './Settings';

import './index.css';

import type {
  Thread,
  ThreadIndex,
  MarkersTable,
  IndexIntoMarkersTable,
} from '../../types/profile';
import type { Milliseconds } from '../../types/units';
import type {
  ExplicitConnectOptions,
  ConnectedProps,
} from '../../utils/connect';

type MarkerDisplayData = {|
  timestamp: string,
  name: string,
  category: string,
|};

class MarkerTree {
  _markers: MarkersTable;
  _thread: Thread;
  _zeroAt: Milliseconds;
  _displayDataByIndex: Map<IndexIntoMarkersTable, MarkerDisplayData>;

  constructor(thread: Thread, markers: MarkersTable, zeroAt: Milliseconds) {
    this._markers = markers;
    this._thread = thread;
    this._zeroAt = zeroAt;
    this._displayDataByIndex = new Map();
  }

  getRoots(): IndexIntoMarkersTable[] {
    const markerIndices = [];
    for (let i = 0; i < this._markers.length; i++) {
      markerIndices.push(i);
    }
    return markerIndices;
  }

  getChildren(markerIndex: IndexIntoMarkersTable): IndexIntoMarkersTable[] {
    return markerIndex === -1 ? this.getRoots() : [];
  }

  hasChildren(markerIndex: IndexIntoMarkersTable): boolean {
    // If this marker has a cause callstack, indicate it with a tree disclosure
    // arrow. However, we don't currently support expanding those marker nodes
    // or displaying the cause callstacks, so this is not the greatest piece
    // of UI.
    return (
      this._markers.data[markerIndex] !== null &&
      'cause' in this._markers.data[markerIndex]
    );
  }

  getAllDescendants() {
    return new Set();
  }

  getParent(): IndexIntoMarkersTable {
    // -1 isn't used, but needs to be compatible with the call tree.
    return -1;
  }

  getDepth() {
    return 0;
  }

  hasSameNodeIds(tree) {
    return this._markers === tree._markers;
  }

  getDisplayData(markerIndex: IndexIntoMarkersTable): MarkerDisplayData {
    let displayData = this._displayDataByIndex.get(markerIndex);
    if (displayData === undefined) {
      const markers = this._markers;
      const { stringTable } = this._thread;
      let category = 'unknown';
      let name = stringTable.getString(markers.name[markerIndex]);
      if (markers.data[markerIndex]) {
        const data = markers.data[markerIndex];

        if (typeof data.category === 'string') {
          category = data.category;
        }

        switch (data.type) {
          case 'tracing':
            if (category === 'log') {
              // name is actually the whole message that was sent to fprintf_stderr. Would you consider that.
              if (name.length > 100) {
                name = name.substring(0, 100) + '...';
              }
            } else {
              name = `[${data.interval}] ${name}`;
            }
            break;

          case 'UserTiming':
            name = `${name} [${data.name}]`;
            break;

          case 'DOMEvent': {
            category = 'DOMEvent';
            const duration = data.endTime - data.startTime;
            name = `[${formatNumber(duration)}ms] ${data.eventType}`;
            break;
          }

          default:
        }
      }

      displayData = {
        timestamp: `${(
          (markers.time[markerIndex] - this._zeroAt) /
          1000
        ).toFixed(3)}s`,
        name,
        category,
      };
      this._displayDataByIndex.set(markerIndex, displayData);
    }
    return displayData;
  }
}

type StateProps = {|
  +threadIndex: ThreadIndex,
  +thread: Thread,
  +markers: MarkersTable,
  +selectedMarker: IndexIntoMarkersTable,
  +zeroAt: Milliseconds,
|};

type DispatchProps = {|
  +changeSelectedMarker: typeof changeSelectedMarker,
|};

type Props = ConnectedProps<{||}, StateProps, DispatchProps>;

class MarkerTable extends PureComponent<Props> {
  _fixedColumns = [
    { propName: 'timestamp', title: 'Time Stamp' },
    { propName: 'category', title: 'Category' },
  ];
  _mainColumn = { propName: 'name', title: '' };
  _expandedNodeIds: Array<IndexIntoMarkersTable> = [];
  _onExpandedNodeIdsChange = () => {};
  _treeView: ?TreeView<IndexIntoMarkersTable, MarkerDisplayData>;
  _takeTreeViewRef = treeView => (this._treeView = treeView);

  componentDidMount() {
    this.focus();
  }

  focus() {
    const treeView = this._treeView;
    if (treeView) {
      treeView.focus();
    }
  }

  _onSelectionChange = (selectedMarker: IndexIntoMarkersTable) => {
    const { threadIndex, changeSelectedMarker } = this.props;
    changeSelectedMarker(threadIndex, selectedMarker);
  };

  render() {
    const { thread, markers, zeroAt, selectedMarker } = this.props;
    const tree = new MarkerTree(thread, markers, zeroAt);
    return (
      <div className="markerTable">
        <Settings />
        <TreeView
          maxNodeDepth={0}
          tree={tree}
          fixedColumns={this._fixedColumns}
          mainColumn={this._mainColumn}
          onSelectionChange={this._onSelectionChange}
          onExpandedNodesChange={this._onExpandedNodeIdsChange}
          selectedNodeId={selectedMarker}
          expandedNodeIds={this._expandedNodeIds}
          ref={this._takeTreeViewRef}
          contextMenuId={'MarkersContextMenu'}
        />
      </div>
    );
  }
}

const options: ExplicitConnectOptions<{||}, StateProps, DispatchProps> = {
  mapStateToProps: state => ({
    threadIndex: getSelectedThreadIndex(state),
    thread: selectedThreadSelectors.getRangeSelectionFilteredThread(state),
    markers: selectedThreadSelectors.getSearchFilteredMarkers(state),
    selectedMarker: selectedThreadSelectors.getViewOptions(state)
      .selectedMarker,
    zeroAt: getZeroAt(state),
  }),
  mapDispatchToProps: { changeSelectedMarker },
  component: MarkerTable,
};
export default explicitConnect(options);
