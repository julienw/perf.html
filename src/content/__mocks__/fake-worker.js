import vm from 'vm';
import fs from 'fs';

function workerPostMessage(context) {
  return data => {
    if (typeof context.onmessage === 'function') {
      setImmediate(() => context.onmessage({ data }));
    }
  };
}

export default class FakeWorker {
  constructor(file) {
    let code = fs.readFileSync(file, 'utf8');
    if (/\brequire\(/.test(code)) {
      code = `require('${file}')`;
    }

    const global = {
      postMessage: workerPostMessage(this),
      require,
      process, // emscripten-compiled zee-worker wants this
      //importScripts: () => {},
    };
    global.self = global;
    this._global = global;

    vm.runInNewContext(code, global, { filename: file });
  }

  postMessage(data) {
    if (typeof this._global.onmessage === 'function') {
      setImmediate(() => this._global.onmessage({ data }));
    }
  }

  terminate() {
    this._global = null;
  }
}

