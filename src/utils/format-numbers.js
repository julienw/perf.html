/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import memoize from 'memoize-immutable';
import NamedTupleMap from 'namedtuplemap';

import type { Microseconds, Milliseconds } from '../types/units';

// Calling `toLocalestring` repeatedly in a tight loop can be a performance
// problem. It's much better to reuse an instance of `Intl.NumberFormat`.
// This function simply returns an instance of this class, and then we use a
// memoization tool to store an instance for each set of arguments.
// It's probably OK to keep all instances because their number is finite.
function _getNumberFormat({
  places,
  style,
}: {
  places: number,
  style: 'decimal' | 'percent',
}) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
    style: style,
  });
}

const _memoizedGetNumberFormat = memoize(_getNumberFormat, {
  cache: new NamedTupleMap(),
});

/**
 * Format a positive float into a string.
 *
 * Try to format the value to with `significantDigits` significant digits as
 * much as possible but without using scientific notation.  The number of
 * decimal places depends on the value: the closer to zero the value is, the
 * more decimal places are used in the resulting string.  No more than
 * `maxFractionalDigits` decimal places will be used.
 *
 * For example, using significantDigits = 2 (the default):
 *
 * formatNumber(123    ) = "123"
 * formatNumber(12.3   ) =  "12"
 * formatNumber(1.23   ) =   "1.2"
 * formatNumber(0.01234) =   "0.012"
 */
export function formatNumber(
  value: number,
  significantDigits: number = 2,
  maxFractionalDigits: number = 3,
  style: 'decimal' | 'percent' = 'decimal'
): string {
  /*
   * Note that numDigitsOnLeft can be negative when the first non-zero digit
   * is on the right of the decimal point.  0.01 = -1
   */
  if (isNaN(value)) {
    return 'NaN';
  }

  let numDigitsOnLeft = Math.floor(Math.log10(Math.abs(value))) + 1;
  if (style === 'percent') {
    // We receive percent values as `0.4` but display them as `40`, so we
    // should add `2` here to account for this difference.
    numDigitsOnLeft += 2;
  }
  let places = significantDigits - numDigitsOnLeft;
  if (places < 0) {
    places = 0;
  } else if (places > maxFractionalDigits) {
    places = maxFractionalDigits;
  }

  const numberFormat = _memoizedGetNumberFormat({ places, style });
  return numberFormat.format(value);
}

/**
 * When the interval is an integer, then there will never be fractions for timing
 * information in the call tree. In this case it's nice to display integers. If the
 * interval is fractional, then timing information could be nicer with more precise
 * numbers. This function handles this formatting method.
 *
 * e.g. (true, 6.0) => "6"
 * e.g. (false, 6.0) => "6.0"
 * e.g. (true, 6.555) => "6"
 * e.g. (false, 6.555) => "6.6"
 */
export function formatNumberDependingOnInterval(
  isIntegerInterval: boolean,
  number: number
): string {
  const maxFractionalDigits = isIntegerInterval ? 0 : 1;
  return formatNumber(number, 3, maxFractionalDigits);
}

export function formatPercent(value: number): string {
  return formatNumber(
    value,
    /* significantDigits */ 2,
    /* maxFractionalDigits */ 1,
    'percent'
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 10000) {
    // Use singles up to 10,000.  I think 9,360B looks nicer than 9.36KB.
    return formatNumber(bytes) + 'B';
  } else if (bytes < 1024 * 1024) {
    return formatNumber(bytes / 1024, 3, 2) + 'KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return formatNumber(bytes / (1024 * 1024), 3, 2) + 'MB';
  }
  return formatNumber(bytes / (1024 * 1024 * 1024), 3, 2) + 'GB';
}

export function formatSI(num: number): string {
  if (num < 10000) {
    // Use singles up to 10,000.  I think 9,360 looks nicer than 9.36K.
    return formatNumber(num);
  } else if (num < 1000 * 1000) {
    return formatNumber(num / 1000, 3, 2) + 'K';
  } else if (num < 1000 * 1000 * 1000) {
    return formatNumber(num / (1000 * 1000), 3, 2) + 'M';
  }
  return formatNumber(num / (1000 * 1000 * 1000), 3, 2) + 'G';
}

export function formatMicroseconds(
  time: Microseconds,
  significantDigits: number = 2,
  maxFractionalDigits: number = 3
) {
  return formatNumber(time, significantDigits, maxFractionalDigits) + 'μs';
}

export function formatMilliseconds(
  time: Milliseconds,
  significantDigits: number = 2,
  maxFractionalDigits: number = 3
) {
  return formatNumber(time, significantDigits, maxFractionalDigits) + 'ms';
}

export function formatSeconds(
  time: Milliseconds,
  significantDigits: number = 5,
  maxFractionalDigits: number = 3
) {
  return (
    formatNumber(time / 1000, significantDigits, maxFractionalDigits) + 's'
  );
}

/*
 * Format a value and a total to the form "v/t (p%)".  For example this can
 * be used to print "7MB/10MB (70%)"  fornatNum is a function to format the
 * individual numbers and includePercent may be set to false if you do not
 * wish to print the percentage.
 */
export function formatValueTotal(
  a: number,
  b: number,
  formatNum: number => string = String,
  includePercent: boolean = true
) {
  const value_total = formatNum(a) + ' / ' + formatNum(b);
  let percent = '';
  if (includePercent) {
    percent = ' (' + formatPercent(a / b) + ')';
  }

  return value_total + percent;
}
