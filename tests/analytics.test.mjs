import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQueryConfig,
  graphqlErrorMessage,
  hasRight,
  layoutPositions,
  pageArgs,
  pickChartKeys,
  toLocalDateString,
  widgetLayout,
} from '../src/utils/analytics.js';

test('a picked calendar day is sent as that local day', () => {
  // 30 Sept 2026 late evening local time is still the 30th, whatever the offset.
  assert.equal(toLocalDateString(new Date(2026, 8, 30, 23, 30)), '2026-09-30');
  assert.equal(toLocalDateString(new Date(2026, 8, 30, 0, 5)), '2026-09-30');
  const momentLike = { format: (f) => (f === 'YYYY-MM-DD' ? '2026-09-30' : 'bad'), toDate: () => new Date() };
  assert.equal(toLocalDateString(momentLike), '2026-09-30');
  assert.equal(toLocalDateString('2026-09-30'), '2026-09-30');
});

test('an aggregation without a name is kept under a generated name', () => {
  const config = buildQueryConfig({
    groupBy: ['status'],
    aggregations: [{ name: '', function: 'count', field: 'id' }, { name: 'total', function: 'sum', field: 'amount' }],
    limit: 1000,
  });
  assert.deepEqual(config, {
    group_by: ['status'],
    aggregations: { count_id: { function: 'count', field: 'id' }, total: { function: 'sum', field: 'amount' } },
    limit: 1000,
  });
});

test('empty filters and aggregations are omitted from the config', () => {
  const config = buildQueryConfig({ filters: [{ field: 'status', operator: 'exact', value: '' }], limit: 10 });
  assert.deepEqual(config, { limit: 10 });
});

test('list pages send first, offset and orderBy as GraphQL arguments', () => {
  assert.deepEqual(
    pageArgs({ page: 1, rowsPerPage: 10, orderBy: ['-validityFrom'] }),
    ['first: 10', 'offset: 10', 'orderBy: ["-validityFrom"]'],
  );
  assert.deepEqual(pageArgs({ rowsPerPage: 20 }), ['first: 20']);
});

test('GraphQL errors of an HTTP 200 response are surfaced', () => {
  const payload = {
    errors: [{ message: "Field 'location__parent__name' is not allowed" }],
    data: { executeAnalyticsQuery: null },
  };
  assert.equal(graphqlErrorMessage(payload), "Field 'location__parent__name' is not allowed");
  assert.equal(graphqlErrorMessage({ data: { executeAnalyticsQuery: {} } }), null);
});

test('chart value key is the numeric column when the widget config names none', () => {
  const rows = [{ status: 'ACCEPTED', count_value: 102797 }, { status: 'REJECTED', count_value: 14662 }];
  assert.deepEqual(pickChartKeys(rows, { display: 'default' }, 'nameKey'), {
    valueKey: 'count_value', categoryKey: 'status',
  });
  assert.deepEqual(pickChartKeys(rows, { dataKey: 'count_value', xAxisKey: 'status' }, 'xAxisKey'), {
    valueKey: 'count_value', categoryKey: 'status',
  });
});

test('widget positions stored as JSON strings drive the grid', () => {
  const widget = { id: 'W1', position: '{"h": 4, "w": 6, "x": 6, "y": 0}' };
  assert.deepEqual(widgetLayout(widget), { i: 'W1', x: 6, y: 0, w: 6, h: 4, minW: 2, minH: 2 });
  assert.deepEqual(layoutPositions([widgetLayout(widget)]), { W1: { x: 6, y: 0, w: 6, h: 4 } });
});

test('hasRight compares rights numerically', () => {
  assert.ok(hasRight([200006], '200006'));
  assert.ok(!hasRight([200002], 200006));
});
