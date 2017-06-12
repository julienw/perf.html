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
  source: ?(IDBIndex<any, any, V> | IDBObjectStore<any, V> | IDBCursor<any, V>);
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
  createIndex<L>(indexName: string, keyPath: string|string[], optionalParameter?: {
    unique?: bool,
    multiEntry?: bool,
  }): IDBIndex<K, L, V>;
  count(keyRange?: K|IDBKeyRange<K>): IDBRequest<number>;
  delete(key: K): IDBRequest<void>;
  deleteIndex(indexName: string): void;
  get(key: K): IDBRequest<V>;
  getKey(key: K|IDBKeyRange<K>): IDBRequest<K>;
  index<L>(indexName: string): IDBIndex<K, L, V>;
  indexNames: string[];
  name: string;
  keyPath: string | string[];
  openCursor(range?: K|IDBKeyRange<K>, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<K, V> | null>;
  openKeyCursor(range?: K|IDBKeyRange<K>, direction?: IDBDirection): IDBRequest<IDBCursor<K, V> | null>;
  put(value: V, key?: K): IDBRequest<void>;
  transaction: IDBTransaction;
}

declare interface IDBIndex<K, L, V> extends EventTarget {
  count(key?: L|IDBKeyRange<L>): IDBRequest<number>;
  get(key: L|IDBKeyRange<L>): IDBRequest<V>;
  getKey(key: L|IDBKeyRange<L>): IDBRequest<K>;
  openCursor(range?: L|IDBKeyRange<L>, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<K, V>>;
  openKeyCursor(range?: L|IDBKeyRange<L>, direction?: IDBDirection): IDBRequest<IDBCursor<K, V>>;
  name: string;
  objectStore: IDBObjectStore<K, V>;
  keyPath: any;
  multiEntry: bool;
  unique: bool;
}

declare interface IDBKeyRange<K> {
  bound<L>(lower: L, upper: L, lowerOpen?: bool, upperOpen?: bool): IDBKeyRange<L>;
  only<L>(value: L): IDBKeyRange<L>;
  lowerBound<L>(bound: L, open?: bool): IDBKeyRange<L>;
  upperBound<L>(bound: L, open?: bool): IDBKeyRange<L>;
  lower: K;
  upper: K;
  lowerOpen: bool;
  upperOpen: bool;
}

declare interface IDBCursor<K, V> {
  advance(count: number): void;
  continue(key?: K): void;
  delete(): IDBRequest<void>;
  update(newValue: V): IDBRequest<void>;
  source: IDBObjectStore<K, V>|IDBIndex<K, any, V>;
  direction: IDBDirection;
  key: K;
  primaryKey: any;
}
declare interface IDBCursorWithValue<K, V> extends IDBCursor<K, V> {
  value: V;
}
