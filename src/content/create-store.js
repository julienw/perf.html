/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import reducers from './reducers';
import threadDispatcher from '../common/thread-middleware';
import messages from './messages';
import handleMessages from '../common/message-handler';

/**
 * Isolate the store creation into a function, so that it can be used outside of the
 * app's execution context, e.g. for testing.
 * @return {object} Redux store.
 */
export default function initializeStore() {
  let worker;
  if (process.env.NODE_ENV === 'test') {
    console.log('>>>>', __dirname, process.cwd());
    const Worker = require('workerjs');
    worker = new Worker(__dirname + '/../worker/index.js', true /* support require */);
  } else {
    worker = new window.Worker('/worker.js');
  }

  const store = createStore(
    combineReducers(Object.assign({}, reducers, {
      worker,
    })),
    applyMiddleware(...[
      thunk,
      threadDispatcher(worker, 'toWorker'),
      process.env.NODE_ENV === 'development'
        ? createLogger({titleFormatter: action => `content action ${action.type}`})
        : null,
    ].filter(fn => fn)));

  handleMessages(worker, store, messages);

  return store;
}
