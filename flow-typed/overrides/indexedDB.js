// Imported from Flow's source code and catered to our needs

// Implemented by window & worker
declare interface IDBEnvironment {
  indexedDB: IDBFactory;
}

type IDBDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';

// Implemented by window.indexedDB & worker.indexedDB
declare interface IDBFactory {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
  cmp(a: any, b: any): -1|0|1;
}

declare interface IDBRequest<V> extends EventTarget {
  result: V,
  error: Error;
  source: ?(IDBIndex | IDBObjectStore<any, V> | IDBCursor<any, V>);
  transaction: IDBTransaction;
  readyState: 'pending'|'done';
  onerror: (err: any) => mixed;
  onsuccess: (e: any) => mixed;
}

declare interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  onblocked: (e: any) => mixed;
  onupgradeneeded: (e: any) => mixed;
}

declare interface IDBDatabase extends EventTarget {
  close(): void;
  createObjectStore<K, V>(name: string, options?: {
    keyPath?: ?(string|string[]),
    autoIncrement?: bool,
  }): IDBObjectStore<K, V>;
  deleteObjectStore(name: string): void;
  transaction(storeNames: string|string[], mode?: 'readonly'|'readwrite'|'versionchange'): IDBTransaction;
  name: string;
  version: number;
  objectStoreNames: string[];
  onabort: (e: any) => mixed;
  onerror: (e: any) => mixed;
  onversionchange: (e: any) => mixed;
}

declare interface IDBTransaction extends EventTarget {
  abort(): void;
  db: IDBDatabase;
  error: Error;
  mode: 'readonly'|'readwrite'|'versionchange';
  name: string;
  objectStore(name: string): IDBObjectStore<*, *>;
  onabort: (e: any) => mixed;
  oncomplete: (e: any) => mixed;
  onerror: (e: any) => mixed;
}

declare interface IDBObjectStore<K, V> {
  add(value: V, key?: K | null): IDBRequest<void>;
  autoIncrement: bool;
  clear(): IDBRequest<void>;
  createIndex(indexName: string, keyPath: string|string[], optionalParameter?: {
    unique?: bool,
    multiEntry?: bool,
  }): IDBIndex;
  count(keyRange?: K|IDBKeyRange): IDBRequest<number>;
  delete(key: K): IDBRequest<void>;
  deleteIndex(indexName: string): void;
  get(key: K): IDBRequest<V>;
  index(indexName: string): IDBIndex;
  indexNames: string[];
  name: string;
  keyPath: string | string[];
  openCursor(range?: K|IDBKeyRange, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<K, V> | null>;
  openKeyCursor(range?: K|IDBKeyRange, direction?: IDBDirection): IDBRequest<IDBCursor<K, V> | null>;
  put(value: V, key?: K): IDBRequest<void>;
  transaction: IDBTransaction;
}

declare interface IDBIndex extends EventTarget {
  count(key?: any|IDBKeyRange): IDBRequest<number>;
  get(key: any|IDBKeyRange): IDBRequest<any>;
  getKey(key: any|IDBKeyRange): IDBRequest<any>;
  openCursor(range?: any|IDBKeyRange, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<any, any>>;
  openKeyCursor(range?: any|IDBKeyRange, direction?: IDBDirection): IDBRequest<IDBCursor<any, any>>;
  name: string;
  objectStore: IDBObjectStore<any, any>;
  keyPath: any;
  multiEntry: bool;
  unique: bool;
}

declare interface IDBKeyRange {
  bound(lower: any, upper: any, lowerOpen?: bool, upperOpen?: bool): IDBKeyRange;
  only(value: any): IDBKeyRange;
  lowerBound(bound: any, open?: bool): IDBKeyRange;
  upperBound(bound: any, open?: bool): IDBKeyRange;
  lower: any;
  upper: any;
  lowerOpen: bool;
  upperOpen: bool;
}

declare interface IDBCursor<K, V> {
  advance(count: number): void;
  continue(key?: K): void;
  delete(): IDBRequest<void>;
  update(newValue: V): IDBRequest<void>;
  source: IDBObjectStore<K, V>|IDBIndex;
  direction: IDBDirection;
  key: K;
  primaryKey: any;
}
declare interface IDBCursorWithValue<K, V> extends IDBCursor<K, V> {
  value: V;
}
