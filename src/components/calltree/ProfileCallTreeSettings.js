/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import {
  changeImplementationFilter,
  changeInvertCallstack,
  changeCallTreeSearchString,
} from '../../actions/profile-view';
import {
  getImplementationFilter,
  getInvertCallstack,
  getCurrentSearchString,
  getSearchStrings,
} from '../../reducers/url-state';
import IdleSearchField from '../shared/IdleSearchField';
import { toValidImplementationFilter } from '../../profile-logic/profile-data';

import './ProfileCallTreeSettings.css';

import type { ImplementationFilter } from '../../types/actions';

type Props = {|
  +implementationFilter: ImplementationFilter,
  +invertCallstack: boolean,
  +currentSearchString: string,
  +searchStrings: string[],
  +changeImplementationFilter: typeof changeImplementationFilter,
  +changeInvertCallstack: typeof changeInvertCallstack,
  +changeCallTreeSearchString: typeof changeCallTreeSearchString,
|};

class ProfileCallTreeSettings extends PureComponent {
  props: Props;
  state: {| searchFieldFocused: boolean |};

  constructor(props: Props) {
    super(props);
    (this: any)._onImplementationFilterChange = this._onImplementationFilterChange.bind(
      this
    );
    (this: any)._onInvertCallstackClick = this._onInvertCallstackClick.bind(
      this
    );
    (this: any)._onSearchFieldIdleAfterChange = this._onSearchFieldIdleAfterChange.bind(
      this
    );
    (this: any)._onSearchFieldFocus = this._onSearchFieldFocus.bind(this);
    (this: any)._onSearchFieldBlur = this._onSearchFieldBlur.bind(this);

    this.state = { searchFieldFocused: false };
  }

  _onImplementationFilterChange(e: Event & { target: HTMLSelectElement }) {
    this.props.changeImplementationFilter(
      // This function is here to satisfy Flow that we are getting a valid
      // implementation filter.
      toValidImplementationFilter(e.target.value)
    );
  }

  _onInvertCallstackClick(e: Event & { target: HTMLInputElement }) {
    this.props.changeInvertCallstack(e.target.checked);
  }

  _onSearchFieldIdleAfterChange(value: string) {
    this.props.changeCallTreeSearchString(value);
  }

  _onSearchFieldFocus() {
    this.setState({ searchFieldFocused: true });
  }

  _onSearchFieldBlur() {
    this.setState(() => ({ searchFieldFocused: false }));
  }

  render() {
    const {
      implementationFilter,
      invertCallstack,
      currentSearchString,
      searchStrings,
    } = this.props;
    const { searchFieldFocused } = this.state;
    const showIntroduction =
      searchFieldFocused &&
      searchStrings.length &&
      !currentSearchString.includes(',');

    return (
      <div className="profileCallTreeSettings">
        <ul className="profileCallTreeSettingsList">
          <li className="profileCallTreeSettingsListItem">
            <label className="profileCallTreeSettingsLabel">
              Filter:
              <select
                className="profileCallTreeSettingsSelect"
                onChange={this._onImplementationFilterChange}
                value={implementationFilter}
              >
                <option value="combined">Combined stacks</option>
                <option value="js">JS only</option>
                <option value="cpp">C++ only</option>
              </select>
            </label>
          </li>
          <li className="profileCallTreeSettingsListItem">
            <label className="profileCallTreeSettingsLabel">
              <input
                type="checkbox"
                className="profileCallTreeSettingsCheckbox"
                onChange={this._onInvertCallstackClick}
                checked={invertCallstack}
              />
              {' Invert call stack'}
            </label>
          </li>
        </ul>
        <div className="profileCallTreeSettingsSearchbar">
          <label className="profileCallTreeSettingsSearchbarLabel">
            {'Filter stacks: '}
            <IdleSearchField
              className="profileCallTreeSettingsSearchField"
              title="Only display stacks which contain a function whose name matches this substring"
              idlePeriod={200}
              defaultValue={currentSearchString}
              onIdleAfterChange={this._onSearchFieldIdleAfterChange}
              onBlur={this._onSearchFieldBlur}
              onFocus={this._onSearchFieldFocus}
            />
            <div
              className={classNames(
                'profileCallTreeSettingsSearchIntroduction',
                { isHidden: !showIntroduction, isDisplayed: showIntroduction }
              )}
            >
              Did you know you can use the comma (,) to search using several
              terms ?
            </div>
          </label>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    invertCallstack: getInvertCallstack(state),
    implementationFilter: getImplementationFilter(state),
    currentSearchString: getCurrentSearchString(state),
    searchStrings: getSearchStrings(state),
  }),
  {
    changeImplementationFilter,
    changeInvertCallstack,
    changeCallTreeSearchString,
  }
)(ProfileCallTreeSettings);
