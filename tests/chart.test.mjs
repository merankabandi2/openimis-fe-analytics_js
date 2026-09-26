import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { chartDisplay, shortLabel, withCategoryLabels } from '../src/utils/analytics.js';

test('pie charts show a legend and sector labels unless the widget config turns them off', () => {
  assert.deepEqual(chartDisplay({ display: 'default' }, 'pie_chart'), { legend: true, labels: true });
  assert.deepEqual(chartDisplay({ showLegend: false, showLabels: false }, 'pie_chart'), { legend: false, labels: false });
});

test('single-series bar and line charts keep the legend opt-in', () => {
  assert.deepEqual(chartDisplay({}, 'bar_chart'), { legend: false, labels: false });
  assert.deepEqual(chartDisplay({ showLegend: true }, 'line_chart'), { legend: true, labels: false });
});

test('long category labels are shortened for the axis', () => {
  assert.equal(shortLabel('corruption'), 'corruption');
  assert.equal(shortLabel('discrimination_ethnie_religion'), 'discrimination_eth…');
  assert.equal(shortLabel('discrimination_ethnie_religion').length, 19);
  assert.equal(shortLabel(12), '12');
});

test('rows without a category get a visible label instead of an empty tick', () => {
  const rows = [{ category: null, n: 3 }, { category: 'telephone', n: 5 }, { category: '', n: 1 }];
  assert.deepEqual(withCategoryLabels(rows, 'category', '(non renseigné)'), [
    { category: '(non renseigné)', n: 3 }, { category: 'telephone', n: 5 }, { category: '(non renseigné)', n: 1 },
  ]);
  assert.equal(withCategoryLabels(rows, null, 'x'), rows);
});

test('the bar chart axis renders every category label', () => {
  const widget = readFileSync(new URL('../src/components/widgets/ChartWidget.js', import.meta.url), 'utf8');
  const barChart = widget.slice(widget.indexOf('const renderBarChart'), widget.indexOf('const renderLineChart'));
  assert.match(barChart, /<XAxis[\s\S]*?interval=\{0\}[\s\S]*?tickFormatter=\{shortLabel\}/);
  const pieChart = widget.slice(widget.indexOf('const renderPieChart'));
  assert.match(pieChart, /label=\{display\.labels\}/);
  assert.match(pieChart, /\{display\.legend && <Legend \/>\}/);
});
