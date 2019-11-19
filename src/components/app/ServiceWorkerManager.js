/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow

import React, { PureComponent } from 'react';
import explicitConnect from '../../utils/connect';
import { assertExhaustiveCheck } from '../../utils/flow';

import { getDataSource } from '../../selectors/url-state';
import { getView } from '../../selectors/app';
import { getSymbolicationStatus } from '../../selectors/profile';

import type { ConnectedProps } from '../../utils/connect';
import type { DataSource } from '../../types/actions';
import type { Phase, SymbolicationStatus } from '../../types/state';

import './ServiceWorkerManager.css';

type StateProps = {|
  +dataSource: DataSource,
  +phase: Phase,
  +symbolicationStatus: SymbolicationStatus,
|};
type Props = ConnectedProps<{||}, StateProps, {||}>;

type InstallStatus = 'pending' | 'ready' | 'idle';
type State = {|
  installStatus: InstallStatus,
  isNoticeDisplayed: boolean,
|};

/**
 * This component is responsible for installing and updating the service worker,
 * possibly displaying an information notice to the user to reload the page
 * whenever a new version is ready and we're in a state that would accept a
 * reload.
 *
 * Here are some assumptions:
 * - The browser checks for an update (in background) only at startup.
 * - By the time we have a symbolicated profile displayed, everything that
 *   should be downloaded is already downloaded.
 *
 * This means that we can force the new service worker at that time: this
 * shouldn't disturb other open tabs that are fully loaded already, nor this
 * current tab that is also fully loaded.
 *
 * If we don't force the new service worker, then, to update, the user will have
 * to close all tabs first. This is not very nice, especially that it's common
 * that our users have several tabs open.
 *
 * In the future we could decide to force the new service worker only when the
 * user clicks the reload button. This might be necessary if we need to download
 * new content after the profile viewer is fully loaded.
 * But be wary that this breaks the F5 capability: the user would _have_ to
 * click the button to update (or close all tabs like said above).
 */

class ServiceWorkerManager extends PureComponent<Props, State> {
  state = {
    installStatus: 'idle',
    isNoticeDisplayed: false,
  };

  _isProfileLoadedAndReady(): boolean {
    const { phase, symbolicationStatus } = this.props;

    if (phase !== 'DATA_LOADED') {
      // Note we don't use a switch for the phase because it has a lot of
      // different values and won't likely change often. Hopefully this comment
      // won't age badly.
      return false;
    }

    switch (symbolicationStatus) {
      case 'DONE':
        return true;
      case 'SYMBOLICATING':
        return false;
      default:
        throw assertExhaustiveCheck(symbolicationStatus);
    }
  }

  _shouldUpdateServiceWorker(): boolean {
    const { dataSource } = this.props;

    switch (dataSource) {
      case 'from-file':
      case 'from-addon':
        // We should not propose to reload the page for these data sources,
        // because we'd lose the data.
        return false;
      case 'none':
        // But for these data sources it should be fine.
        return true;
      case 'public':
      case 'from-url':
      case 'compare':
      case 'local':
        // Before updating the service worker, we need to make sure the profile
        // is ready -- which means we don't need to download anything more.
        return this._isProfileLoadedAndReady();
      default:
        throw assertExhaustiveCheck(dataSource);
    }
  }

  _installServiceWorker() {
    const runtime = require('offline-plugin/runtime');
    runtime.install({
      onInstalled: () => {
        console.log('[ServiceWorker] App is ready for offline usage!');
      },
      onUpdating: () => {
        console.log(
          '[ServiceWorker] An update has been found and the browser is downloading the new assets.'
        );
      },
      onUpdateReady: () => {
        console.log(
          '[ServiceWorker] We have downloaded the new assets and we are ready to go.'
        );
        if (this._shouldUpdateServiceWorker()) {
          runtime.applyUpdate();
        }
        this.setState({ installStatus: 'pending' });
      },
      onUpdated: () => {
        console.log(
          '[ServiceWorker] The new version of the application has been enabled.'
        );
        this.setState({ installStatus: 'ready', isNoticeDisplayed: true });
      },
      onUpdateFailed: () => {
        console.log(
          '[ServiceWorker] We failed to update the application for an unknown reason.'
        );
      },
    });
  }

  componentDidMount() {
    if (process.env.NODE_ENV === 'production') {
      this._installServiceWorker();
    }
  }

  componentDidUpdate() {
    const { phase } = this.props;
    const { installStatus } = this.state;

    if (installStatus !== 'idle' && phase === 'FATAL_ERROR') {
      // If we got a fatal error and a new version of the application is
      // available, let's try to reload automatically, as this might fix the
      // fatal error.
      const runtime = require('offline-plugin/runtime');
      runtime.applyUpdate();
      this.reloadPage();
    } else if (
      installStatus === 'pending' &&
      this._shouldUpdateServiceWorker()
    ) {
      // We may have received a service worker update before we were ready to
      // update (for example: we were still symbolicating). We can apply the
      // new service worker now. When the new service worker will be enabled,
      // the notice will be displayed.
      const runtime = require('offline-plugin/runtime');
      runtime.applyUpdate();
    }
  }

  reloadPage() {
    window.location.reload();
  }

  _onCloseNotice = () => {
    this.setState({ isNoticeDisplayed: false });
  };

  render() {
    const { isNoticeDisplayed } = this.state;

    if (!isNoticeDisplayed) {
      return null;
    }

    if (!this._shouldUpdateServiceWorker()) {
      return null;
    }

    return (
      <div className="serviceworker-ready-notice-wrapper">
        {/* We use the wrapper to horizontally center the notice */}
        <div className="photon-message-bar serviceworker-ready-notice">
          A new version of the application has been downloaded and is ready to
          use.
          <button
            className="photon-button photon-button-micro photon-message-bar-action-button"
            type="button"
            onClick={this.reloadPage}
          >
            Reload the application
          </button>
          <button
            aria-label="Hide the reload notice"
            title="Hide the reload notice"
            className="photon-button photon-message-bar-close-button"
            type="button"
            onClick={this._onCloseNotice}
          />
        </div>
      </div>
    );
  }
}

export default explicitConnect<{||}, StateProps, {||}>({
  mapStateToProps: state => ({
    phase: getView(state).phase,
    dataSource: getDataSource(state),
    symbolicationStatus: getSymbolicationStatus(state),
  }),
  component: ServiceWorkerManager,
});
