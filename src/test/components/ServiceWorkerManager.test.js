/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow

import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent } from 'react-testing-library';
import serviceWorkerRuntime from 'offline-plugin/runtime';

import ServiceWorkerManager from '../../components/app/ServiceWorkerManager';
import { stateFromLocation } from '../../app-logic/url-handling';
import { updateUrlState } from '../../actions/app';
import {
  fatalError,
  viewProfile,
  startSymbolicating,
  doneSymbolicating,
} from '../../actions/receive-profile';

import { blankStore } from '../fixtures/stores';
import { getProfileFromTextSamples } from '../fixtures/profiles/processed-profile';

// Mock the offline plugin library.
jest.mock('offline-plugin/runtime', () => ({
  install: jest.fn(),
  applyUpdate: jest.fn(),
}));

function _getSimpleProfile() {
  return getProfileFromTextSamples('A').profile;
}

describe('app/ServiceWorkerManager', () => {
  // Opt out of Flow checking for this variable because we're doing
  // unconventional things with it.
  let nativeLocation: any;
  beforeEach(() => {
    // Because of how window.location is implemented in browsers and jsdom, we
    // can't easily spy on `window.location.reload`. That's why we replace the
    // full property 'location' instead.

    nativeLocation = Object.getOwnPropertyDescriptor(window, 'location');

    // It seems node v8 doesn't let us change the value unless we delete it before.
    delete window.location;
    // $FlowExpectError because the value we pass isn't a proper Location object.
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = 'development';

    Object.defineProperty(window, 'location', nativeLocation);
    nativeLocation = null;
  });

  function setup() {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    function navigateToStoreLoadingPage() {
      const newUrlState = stateFromLocation({
        pathname: '/public/ThisIsAFakeHash/calltree',
        search: '',
        hash: '',
      });
      store.dispatch(updateUrlState(newUrlState));
    }

    function navigateToAddonLoadingPage() {
      const newUrlState = stateFromLocation({
        pathname: '/from-addon/',
        search: '',
        hash: '',
      });
      store.dispatch(updateUrlState(newUrlState));
    }

    const store = blankStore();

    const renderResult = render(
      <Provider store={store}>
        <ServiceWorkerManager />
      </Provider>
    );

    return {
      ...renderResult,
      navigateToStoreLoadingPage,
      navigateToAddonLoadingPage,
      dispatch: store.dispatch,
    };
  }

  it('does not register a service worker in the development environment', () => {
    setup();
    expect(serviceWorkerRuntime.install).not.toHaveBeenCalled();
  });

  describe('in the home, with the `none` datasource', () => {
    it('calls the appropriate functions to update the service worker', () => {
      process.env.NODE_ENV = 'production';

      setup();
      expect(serviceWorkerRuntime.install).toHaveBeenCalled();

      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];
      installOptions.onUpdating();
      expect(serviceWorkerRuntime.applyUpdate).not.toHaveBeenCalled();
      installOptions.onUpdateReady();
      expect(serviceWorkerRuntime.applyUpdate).toHaveBeenCalled();
      installOptions.onUpdated();
      installOptions.onInstalled();
      expect(console.log).toHaveBeenCalledTimes(4);
    });

    it('shows a notice when the SW is updated, and the user can close it', () => {
      process.env.NODE_ENV = 'production';

      const { container, getByLabelText, getByText } = setup();

      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];
      installOptions.onUpdated();
      expect(console.log).toHaveBeenCalled();
      expect(container.firstChild).toMatchSnapshot();

      const closeButton = getByLabelText(/hide/i);
      fireEvent.click(closeButton);
      expect(container.firstChild).toBe(null);

      // Getting a new update should display the notice again
      installOptions.onUpdated();
      const reloadButton = getByText(/reload/i);
      fireEvent.click(reloadButton);
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('with the `public` datasource', () => {
    it(`doesn't show a notice until a profile is fully loaded`, async () => {
      process.env.NODE_ENV = 'production';

      const { navigateToStoreLoadingPage, container, dispatch } = setup();

      navigateToStoreLoadingPage();

      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];

      installOptions.onUpdateReady();
      expect(serviceWorkerRuntime.applyUpdate).not.toHaveBeenCalled();
      expect(container.firstChild).toBe(null);

      await dispatch(viewProfile(_getSimpleProfile()));
      expect(serviceWorkerRuntime.applyUpdate).toHaveBeenCalled();

      installOptions.onUpdated();
      expect(container.firstChild).not.toBe(null);
    });

    it(`doesn't show a notice until we're done symbolicating`, async () => {
      process.env.NODE_ENV = 'production';

      const { navigateToStoreLoadingPage, dispatch, container } = setup();

      navigateToStoreLoadingPage();
      await dispatch(viewProfile(_getSimpleProfile()));
      dispatch(startSymbolicating());

      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];

      installOptions.onUpdateReady();
      expect(serviceWorkerRuntime.applyUpdate).not.toHaveBeenCalled();
      expect(container.firstChild).toBe(null);

      dispatch(doneSymbolicating());
      expect(serviceWorkerRuntime.applyUpdate).toHaveBeenCalled();

      installOptions.onUpdated();
      expect(container.firstChild).not.toBe(null);
    });
  });

  it('does not show a notice with the `from-addon` datasource', () => {
    process.env.NODE_ENV = 'production';

    const { navigateToAddonLoadingPage, container } = setup();
    navigateToAddonLoadingPage();

    const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];
    installOptions.onUpdateReady();
    installOptions.onUpdated();
    expect(serviceWorkerRuntime.applyUpdate).not.toHaveBeenCalled();
    expect(container.firstChild).toBe(null);
  });

  describe('automatic reloading', () => {
    it('reloads the application automatically if there is an error and there is a pending version', () => {
      process.env.NODE_ENV = 'production';

      const { dispatch } = setup();

      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];

      dispatch(fatalError(new Error('Error while loading profile')));
      expect(window.location.reload).not.toHaveBeenCalled();
      expect(serviceWorkerRuntime.applyUpdate).not.toHaveBeenCalled();
      installOptions.onUpdateReady();
      expect(serviceWorkerRuntime.applyUpdate).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('reloads the application automatically if there is an error and there is a ready version happening then', () => {
      process.env.NODE_ENV = 'production';

      const { dispatch } = setup();
      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];

      dispatch(fatalError(new Error('Error while loading profile')));
      expect(window.location.reload).not.toHaveBeenCalled();
      installOptions.onUpdated();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('reloads the application automatically if there is an error and a new version has been notified before', () => {
      process.env.NODE_ENV = 'production';

      const { dispatch } = setup();
      const installOptions = serviceWorkerRuntime.install.mock.calls[0][0];

      installOptions.onUpdated();
      expect(window.location.reload).not.toHaveBeenCalled();
      dispatch(fatalError(new Error('Error while loading profile')));
      expect(window.location.reload).toHaveBeenCalled();
    });
  });
});
