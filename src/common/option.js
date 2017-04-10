// @flow

interface Option<T> {
  map<U>(fn: T => U): Option<U>;
  isSome(): boolean;
  isNone(): boolean;
  unwrap(): T;
  unwrapOr(def: T): T;
  or(optb: Option<T>): Option<T>;
  and<U>(optb: Option<U>): Option<U>;
}

export type { Option };

export class Some<T> implements Option<T> {
  _value: T;

  constructor(value: T) {
    this._value = value;
  }

  map<U>(fn: T => U): Some<U> {
    return new Some(fn(this._value));
  }

  isSome() {
    return true;
  }

  isNone() {
    return false;
  }

  unwrap(): T {
    return this._value;
  }

  unwrapOr(): T {
    return this.unwrap();
  }

  or(): Some<T> {
    return this;
  }

  and<U>(optb: Option<U>): Option<U> {
    return optb;
  }
}

export class None<T> implements Option<T> {
  constructor() {}

  map<U>(): None<U> {
    return new None();
  }

  isSome() {
    return false;
  }

  isNone() {
    return true;
  }

  unwrap() {
    throw new Error('Called unwrap() on a None value.');
  }

  unwrapOr(def: T): T {
    return def;
  }

  or(optb: Option<T>): Option<T> {
    return optb;
  }
  
  and<U>(): Option<U> {
    return new None();
  }
}
