/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import { PathSet, PathMap, arePathsEqual } from '../../utils/path';

describe('PathSet', function() {
  const sampleValues = [[1], [1, 3], [2, 3, 9]];

  it('implements the constructor', function() {
    let set;

    // Default constructor
    set = new PathSet();
    expect(set.size).toBe(0);

    // Constructor with an iterable
    set = new PathSet(sampleValues);
    expect(set.size).toBe(sampleValues.length);
    sampleValues.forEach(value => expect(set.has(value)).toBe(true));

    // Constructing a PathSet from another PathSet
    set = new PathSet(set);
    sampleValues.forEach(value => expect(set.has(value)).toBe(true));

    // Constructing a PathSet from an iterable containing duplicate values
    const duplicatedSampleValues = [...sampleValues, ...sampleValues];
    set = new PathSet(duplicatedSampleValues);
    expect(set.size).toBe(sampleValues.length);
    expect(Array.from(set).length).toBe(sampleValues.length);

    // Doesn't get a hold on the argument
    const mutableValues = sampleValues.slice();
    set = new PathSet(mutableValues);
    mutableValues.push([5]);
    expect(set.has([5])).toBe(false);
  });

  it('implements .add', function() {
    const set = new PathSet();
    expect(set.add([1, 2, 3, 4])).toBe(set);
    expect(set.size).toBe(1);
    set.add([1, 2, 3, 4]); // twice the same value
    expect(set.size).toBe(1);
    set.add([1, 2, 3, 5]);
    expect(set.size).toBe(2);
    set.add([5]);
    expect(set.size).toBe(3);
  });

  it('implements .delete', function() {
    const set = new PathSet();
    set.add([1, 2, 3, 4]);
    set.add([1, 3, 3]);
    // Checks that after adding twice the same value, we need to delete it once only
    set.add([1, 3, 3]);
    expect(set.size).toBe(2);
    expect(set.delete([1, 5])).toBe(false); // non existent value
    expect(set.size).toBe(2);
    expect(set.delete([1, 2, 3, 4])).toBe(true);
    expect(set.size).toBe(1);
    set.delete([1, 3, 3]);
    expect(set.size).toBe(0);
  });

  it('implements .has', function() {
    const set = new PathSet();
    const callNode = [1, 2, 3, 4];
    set.add(callNode);
    set.add([1, 2, 3, 5]);
    expect(set.has(callNode)).toBe(true);
    expect(set.has([1, 2, 3, 4])).toBe(true);
    expect(set.has([1, 2, 3, 5])).toBe(true);
    expect(set.has([1, 2])).toBe(false);
    expect(set.has([4, 3, 2, 1])).toBe(false);
  });

  it('implements .clear', function() {
    const set = new PathSet(sampleValues);
    expect(set.size).toBe(sampleValues.length);
    set.clear();
    expect(set.size).toBe(0);
  });

  it('implements .forEach', function() {
    const set = new PathSet(sampleValues);

    const resultValues = [];
    set.forEach(function(value1, value2, thisSet) {
      expect(this).toBe(undefined); // eslint-disable-line babel/no-invalid-this
      expect(value1).toBe(value2);
      expect(thisSet).toBe(set);
      resultValues.push(value1);
    });
    expect(resultValues).toEqual(sampleValues);

    const context = {};
    set.forEach(function() {
      expect(this).toBe(context); // eslint-disable-line babel/no-invalid-this
    }, context);
  });

  it('implements iterable, .values, .entries', function() {
    const set = new PathSet(sampleValues);
    expect(Array.from(set)).toEqual(sampleValues);
    expect(Array.from(set.values())).toEqual(sampleValues);

    const expectedEntries = sampleValues.map(val => [val, val]);
    expect(Array.from(set.entries())).toEqual(expectedEntries);
  });
});

describe('PathMap', function() {
  const sampleValues = [[1], [1, 3], [2, 3, 9]];

  it('implements the constructors and basic methods', function() {
    const map = new PathMap();
    expect(map.size).toBe(0);

    // Basic set/get methods
    sampleValues.forEach((value, i) => map.set(value, i));
    expect(map.size).toBe(3);
    sampleValues.forEach((value, i) => expect(map.get(value.slice())).toBe(i));

    // Test we overwrite keys with the same content instead of adding them
    const slicedValue = sampleValues[2].slice();
    map.set(slicedValue, 10);
    expect(map.size).toBe(3);
    expect(map.get(slicedValue.slice())).toBe(10);
  });
});

describe('arePathsEqual', function() {
  it('returns true for equal paths', function() {
    expect(arePathsEqual([1], [1])).toBe(true);
    expect(arePathsEqual([1, 5], [1, 5])).toBe(true);
    expect(arePathsEqual([1, 5, 15], [1, 5, 15])).toBe(true);

    const path = [6, 9, 255];
    expect(arePathsEqual(path, path)).toBe(true);
  });

  it('returns false for unequal paths', function() {
    expect(arePathsEqual([1], [2])).toBe(false);
    expect(arePathsEqual([1], [1, 2])).toBe(false);
    expect(arePathsEqual([1, 2], [2, 1])).toBe(false);
  });
});
