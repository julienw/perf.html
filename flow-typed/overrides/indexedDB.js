// Imported from Flow's source code and catered to our needs

// Implemented by window & worker
declare interface IDBEnvironment {
  indexedDB: IDBFactory;
}

type IDBDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';

declare interface IDBVersionChangeEvent extends Event {
  oldVersion: number,
  newVersion: number | null,
}

// Implemented by window.indexedDB & worker.indexedDB
declare interface IDBFactory {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
  cmp<K>(a: K, b: K): -1|0|1;
}

declare interface IDBRequest<V> extends EventTarget {
  result: V,
  error: Error;
  source: ?(IDBIndex<any, any, V> | IDBObjectStore<any, V> | IDBCursor<any, any, V>);
  transaction: IDBTransaction;
  readyState: 'pending'|'done';
  onerror: (e: Event & { target: IDBRequest<V> }) => mixed;
  onsuccess: (e: Event & { target: IDBRequest<V> }) => mixed;
}

declare interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  onblocked: (e: IDBVersionChangeEvent & { target: IDBDatabase }) => mixed;
  onupgradeneeded: (e: IDBVersionChangeEvent & { target: IDBDatabase }) => mixed;
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
  onabort: (e: Event) => mixed;
  onerror: (e: Event) => mixed;
  onversionchange: (e: Event) => mixed;
}

declare interface IDBTransaction extends EventTarget {
  abort(): void;
  db: IDBDatabase;
  error: Error;
  mode: 'readonly'|'readwrite'|'versionchange';
  name: string;
  objectStore<K, V>(name: string): IDBObjectStore<K, V>;
  onabort: (e: Event) => mixed;
  oncomplete: (e: Event) => mixed;
  onerror: (e: Event) => mixed;
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
  keyPath: string | string[] | null;
  openCursor(range?: K|IDBKeyRange<K>, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<K, K, V> | null>;
  openKeyCursor(range?: K|IDBKeyRange<K>, direction?: IDBDirection): IDBRequest<IDBCursor<K, K, V> | null>;
  put(value: V, key?: K): IDBRequest<void>;
  transaction: IDBTransaction;
}

declare interface IDBIndex<K, L, V> extends EventTarget {
  count(key?: L|IDBKeyRange<L>): IDBRequest<number>;
  get(key: L|IDBKeyRange<L>): IDBRequest<V>;
  getKey(key: L|IDBKeyRange<L>): IDBRequest<K>;
  openCursor(range?: L|IDBKeyRange<L>, direction?: IDBDirection): IDBRequest<IDBCursorWithValue<K, L, V> | null>;
  openKeyCursor(range?: L|IDBKeyRange<L>, direction?: IDBDirection): IDBRequest<IDBCursor<K, L, V> | null>;
  name: string;
  objectStore: IDBObjectStore<K, V>;
  keyPath: string | string[] | null;
  multiEntry: bool;
  unique: bool;
}

// Theorically we'd need to have static functions with a different generic key,
// but this doesn't make a practical difference in this case.
declare interface IDBKeyRange<K> {
  bound(lower: K, upper: K, lowerOpen?: bool, upperOpen?: bool): IDBKeyRange<K>;
  only(value: K): IDBKeyRange<K>;
  lowerBound(bound: K, open?: bool): IDBKeyRange<K>;
  upperBound(bound: K, open?: bool): IDBKeyRange<K>;
  lower: K;
  upper: K;
  lowerOpen: bool;
  upperOpen: bool;
}

declare interface IDBCursor<K, L, V> {
  advance(count: number): void;
  continue(key?: L): void;
  continuePrimaryKey(key: L, primaryKey: K): void;
  delete(): IDBRequest<void>;
  update(newValue: V): IDBRequest<void>;
  source: IDBObjectStore<K, V>|IDBIndex<K, L, V>;
  direction: IDBDirection;
  key: L;
  primaryKey: K;
}
declare interface IDBCursorWithValue<K, L, V> extends IDBCursor<K, L, V> {
  value: V;
}
