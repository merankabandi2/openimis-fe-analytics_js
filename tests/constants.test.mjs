import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXPORT_FORMATS,
  RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_EXPORT,
  RIGHT_ANALYTICS_SAVE_QUERY,
  RIGHT_ANALYTICS_UPDATE_QUERY,
} from '../src/constants.js';

test('menu right constants match the numeric rights fe-core passes to menu filters', () => {
  const userRights = [200001, 200002, 200003, 200006, 200007];
  for (const right of [
    RIGHT_ANALYTICS_VIEW, RIGHT_ANALYTICS_CREATE_QUERY, RIGHT_ANALYTICS_EXPORT,
    RIGHT_ANALYTICS_SAVE_QUERY, RIGHT_ANALYTICS_UPDATE_QUERY,
  ]) {
    assert.ok(userRights.includes(right), `${right} not matched`);
  }
});

test('pdf is not offered as an export format', () => {
  assert.deepEqual(Object.values(EXPORT_FORMATS).sort(), ['csv', 'excel']);
});
