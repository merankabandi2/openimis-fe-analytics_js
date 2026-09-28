import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXPORT_FORMATS,
  RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_EXPORT,
  RIGHT_ANALYTICS_CREATE_DASHBOARD,
  RIGHT_ANALYTICS_SHARE,
  RIGHT_ANALYTICS_SAVE_QUERY,
  RIGHT_ANALYTICS_UPDATE_QUERY,
} from '../src/constants.js';

const ANALYTICS_RIGHTS = [
  RIGHT_ANALYTICS_VIEW, RIGHT_ANALYTICS_CREATE_QUERY, RIGHT_ANALYTICS_EXPORT,
  RIGHT_ANALYTICS_CREATE_DASHBOARD, RIGHT_ANALYTICS_SHARE,
  RIGHT_ANALYTICS_SAVE_QUERY, RIGHT_ANALYTICS_UPDATE_QUERY,
];

// payment_cycle's query/create/update/delete rights (its apps.py DEFAULT_CONFIG).
const PAYMENT_CYCLE_RIGHTS = [200001, 200002, 200003, 200004];

test('menu right constants match the numeric rights fe-core passes to menu filters', () => {
  const userRights = [210001, 210002, 210003, 210006, 210007];
  for (const right of [
    RIGHT_ANALYTICS_VIEW, RIGHT_ANALYTICS_CREATE_QUERY, RIGHT_ANALYTICS_EXPORT,
    RIGHT_ANALYTICS_SAVE_QUERY, RIGHT_ANALYTICS_UPDATE_QUERY,
  ]) {
    assert.ok(userRights.includes(right), `${right} not matched`);
  }
});

test('analytics rights are the backend codes 210001-210007, in order', () => {
  assert.deepEqual(ANALYTICS_RIGHTS, [210001, 210002, 210003, 210004, 210005, 210006, 210007]);
});

test('no analytics right is a payment_cycle right', () => {
  assert.deepEqual(ANALYTICS_RIGHTS.filter((right) => PAYMENT_CYCLE_RIGHTS.includes(right)), []);
});

test('pdf is not offered as an export format', () => {
  assert.deepEqual(Object.values(EXPORT_FORMATS).sort(), ['csv', 'excel']);
});
