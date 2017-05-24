import Worker from './fake-worker';

const workerFiles = {
  'zee-worker': `${__dirname}/../../../res/zee-worker.js`,
  'worker': `${__dirname}/../../worker/index.js`,
};

const workerInstances = [];

export default class {
  constructor(file) {
    const worker = new Worker(workerFiles[file], true);
    workerInstances.push(worker);
    return worker;
  }
}

export function shutdownWorkers() {
  return;
  workerInstances.forEach(worker => worker.terminate());
  workerInstances.length = 0;
}
