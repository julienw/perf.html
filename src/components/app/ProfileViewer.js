/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent, PropTypes } from 'react';
import { connect } from 'react-redux';
import TabBar from './TabBar';
import classNames from 'classnames';
import ProfileSummaryView from '../summary/ProfileSummaryView';
import ProfileCallTreeView from '../calltree/ProfileCallTreeView';
import MarkersView from '../markers/MarkersView';
import ProfileTaskTracerView from '../tasktracer/ProfileTaskTracerView';
import ProfileFilterNavigator from './ProfileFilterNavigator';
import ProfileSharing from './ProfileSharing';
import SymbolicationStatusOverlay from './SymbolicationStatusOverlay';
import TimelineView from '../timeline/TimelineView';
import actions from '../../actions';
import {
  getProfileViewOptions,
  getDisplayRange,
} from '../../reducers/profile-view';
import { getSelectedTab } from '../../reducers/url-state';
import ProfileViewerHeader from '../header/ProfileViewerHeader';
import ProfileCallTreeContextMenu from '../calltree/ProfileCallTreeContextMenu';
import MarkersContextMenu from '../markers/ContextMenu';
import ProfileThreadHeaderContextMenu from '../header/ProfileThreadHeaderContextMenu';

import type { StartEndRange } from '../../types/units';
import type { Tab } from './TabBar';
import type { Action } from '../../types/actions';

type Props = {
  className: string,
  tabOrder: number[],
  timeRange: StartEndRange,
  selectedTab: string,
  changeSelectedTab: string => void,
  changeTabOrder: (number[]) => Action,
};

type State = {
  isMounted: boolean,
};

class ProfileViewer extends PureComponent<Props, State> {
  _tabs: Tab[];

  constructor(props) {
    super(props);
    (this: any)._onSelectTab = this._onSelectTab.bind(this);
    this.state = { isMounted: false };
    // If updating this list, make sure and update the tabOrder reducer with another index.
    this._tabs = [
      {
        name: 'calltree',
        title: 'Call Tree',
      },
      {
        name: 'timeline',
        title: 'Timeline',
      },
      {
        name: 'markers',
        title: 'Markers',
      },
      {
        name: 'summary',
        title: 'Summary',
      },
    ];
  }

  _onSelectTab(selectedTab: string) {
    const { changeSelectedTab } = this.props;
    changeSelectedTab(selectedTab);
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  render() {
    const {
      className,
      tabOrder,
      timeRange,
      changeTabOrder,
      selectedTab,
    } = this.props;
    const { isMounted } = this.state;

    return (
      <div
        className={classNames(
          className,
          isMounted ? `${className}IsMounted` : null
        )}
      >
        <div className={`${className}TopBar`}>
          <ProfileFilterNavigator />
          <ProfileSharing />
        </div>
        <ProfileViewerHeader />
        <TabBar
          tabs={this._tabs}
          selectedTabName={selectedTab}
          tabOrder={tabOrder}
          onSelectTab={this._onSelectTab}
          onChangeTabOrder={changeTabOrder}
        />
        {
          {
            summary: <ProfileSummaryView />,
            calltree: <ProfileCallTreeView />,
            markers: <MarkersView />,
            tasktracer: (
              <ProfileTaskTracerView
                rangeStart={timeRange.start}
                rangeEnd={timeRange.end}
              />
            ),
            timeline: <TimelineView />,
          }[selectedTab]
        }
        <SymbolicationStatusOverlay />
        <ProfileCallTreeContextMenu />
        <MarkersContextMenu />
        <ProfileThreadHeaderContextMenu />
      </div>
    );
  }
}

ProfileViewer.propTypes = {
  className: PropTypes.string.isRequired,
  tabOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
  timeRange: PropTypes.object.isRequired,
  selectedTab: PropTypes.string.isRequired,
  changeSelectedTab: PropTypes.func.isRequired,
  changeTabOrder: PropTypes.func.isRequired,
};

export default connect(
  state => ({
    tabOrder: getProfileViewOptions(state).tabOrder,
    selectedTab: getSelectedTab(state),
    className: 'profileViewer',
    timeRange: getDisplayRange(state),
  }),
  actions
)(ProfileViewer);
