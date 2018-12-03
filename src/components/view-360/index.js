/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React from 'react';

import LongestMarkers from './LongestMarkers';
import FrequentMarkers from './FrequentMarkers';
import FilteredMarkersList from './FilteredMarkersList';
import MostSelftimeFunctions from '../shared/FunctionsList';
import MostSelftimeCategories from './MostSelftimeCategories';

import './View360.css';

type State = {|
  selectedFrequentMarker: string | null,
|};

export default class View360 extends React.PureComponent<{||}, State> {
  state = { selectedFrequentMarker: null };
  onFrequentMarkerSelect = (selectedMarker: string | null) => {
    this.setState({
      selectedFrequentMarker: selectedMarker,
    });
  };

  render() {
    return (
      <section className="view360">
        <div className="view360-column">
          <h2>Most selftime spent grouped per functions</h2>
          <MostSelftimeFunctions />
        </div>
        <div className="view360-column">
          <h2>Most selftime spent grouped per category</h2>
          <MostSelftimeCategories />
        </div>
        <div className="view360-column">
          <h2>Longest markers</h2>
          <LongestMarkers />
        </div>
        <div className="view360-column">
          <h2>Most frequent markers</h2>
          <FrequentMarkers onMarkerSelect={this.onFrequentMarkerSelect} />
          <FilteredMarkersList filter={this.state.selectedFrequentMarker} />
        </div>
      </section>
    );
  }
}
