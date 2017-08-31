/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getProfile, getProfileRootRange } from '../../reducers/profile-view';
import {
  getDataSource,
  getHash,
  getURLPredictor,
} from '../../reducers/url-state';
import actions from '../../actions';

import type { StartEndRange } from '../../types/units';
import type { Profile } from '../../types/profile';
import type { Action, DataSource } from '../../types/actions';

type ProfileSharingProps = {
  profile: Profile,
  rootRange: StartEndRange,
  dataSource: DataSource,
  hash: string,
  profilePublished: typeof actions.profilePublished,
  predictURL: (Action | Action[]) => string,
};

/*
const ProfileSharing = ({
  profile,
  rootRange,
  dataSource,
  hash,
  profilePublished,
  predictURL,
}: ProfileSharingProps) =>
  <div
    className="profileSharing"
    profile={profile}
    rootRange={rootRange}
    dataSource={dataSource}
    hash={hash}
    profilePublished={profilePublished}
    predictURL={predictURL}
  />;
*/

class ProfileSharing extends PureComponent<ProfileSharingProps> {
  render() {
    return <div className="profileSharing" {...this.props} />;
  }
}

export default connect(
  state => ({
    profile: getProfile(state),
    rootRange: getProfileRootRange(state),
    dataSource: getDataSource(state),
    hash: getHash(state),
    predictURL: getURLPredictor(state),
  }),
  { onProfilePublished: actions.profilePublished }
)(ProfileSharing);
