import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { axisTickFormatter } from '../src/utils/analytics.js';

const PROGRAMMES = [
  'Transferts monétaires pour la réponse aux crises éligibles',
  'Transferts monétaires Refugies',
  'Transferts monétaires réguliers',
];

const ticks = (values) => {
  const format = axisTickFormatter(values);
  return values.map((value) => format(value));
};

test('categories sharing a long prefix get distinct axis ticks', () => {
  const out = ticks(PROGRAMMES);
  assert.equal(new Set(out).size, PROGRAMMES.length, out.join(' | '));
  assert.deepEqual(out, ['…pour la réponse au…', '…Refugies', '…réguliers']);
});

test('ticks do not depend on the order of the categories', () => {
  const reversed = [...PROGRAMMES].reverse();
  const format = axisTickFormatter(reversed);
  assert.deepEqual(PROGRAMMES.map((value) => format(value)), ticks(PROGRAMMES));
});

test('only colliding labels lose their shared prefix; the others keep the plain short form', () => {
  const values = ['Autre', 'discrimination_ethnie_religion', 'Transferts monétaires A', 'Transferts monétaires B'];
  assert.deepEqual(ticks(values), ['Autre', 'discrimination_eth…', '…A', '…B']);
});

test('a label equal to the shared prefix keeps a visible word', () => {
  const values = ['Transferts monétaires', 'Transferts monétaires réguliers'];
  const out = ticks(values);
  assert.equal(new Set(out).size, 2, out.join(' | '));
  assert.ok(out.every((label) => label.replace('…', '').trim() !== ''), out.join(' | '));
});

test('repeated category values are one category, not a collision', () => {
  const values = ['Transferts monétaires réguliers', 'Transferts monétaires réguliers', 'Paiement'];
  assert.deepEqual(ticks(values), ['Transferts monétai…', 'Transferts monétai…', 'Paiement']);
});

test('ticks stay distinct and bounded when the diverging word is itself long', () => {
  const values = ['Prefix averyveryverylongword_alpha', 'Prefix averyveryverylongword_beta', 'Other'];
  const out = ticks(values);
  assert.equal(new Set(out).size, 3, out.join(' | '));
  assert.ok(out.every((label) => label.length <= 26), out.join(' | '));
});

test('labels colliding without a shared word are numbered, with no leading ellipsis', () => {
  const values = ['averyveryverylongword_beta', 'averyveryverylongword_alpha'];
  assert.deepEqual(ticks(values), ['averyveryverylongw… (2)', 'averyveryverylongw… (1)']);
});

test('numbers and unknown values are formatted like any category', () => {
  const format = axisTickFormatter([2024, 2025]);
  assert.equal(format(2024), '2024');
  assert.equal(format('never seen in the rows, long enough'), 'never seen in the …');
});

test('the bar chart axis formats ticks from the whole category set', () => {
  const widget = readFileSync(new URL('../src/components/widgets/ChartWidget.js', import.meta.url), 'utf8');
  const barChart = widget.slice(widget.indexOf('const renderBarChart'), widget.indexOf('const renderLineChart'));
  assert.match(barChart, /axisTickFormatter\(rows\.map\(\(row\) => row\[categoryKey\]\)\)/);
  assert.match(barChart, /<XAxis[\s\S]*?interval=\{0\}[\s\S]*?tickFormatter=\{tickFormatter\}/);
});
