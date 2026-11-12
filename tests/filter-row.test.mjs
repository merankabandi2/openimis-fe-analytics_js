import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toLocalDateString } from '../src/utils/analytics.js';

const row = readFileSync(new URL('../src/components/FilterRow.jsx', import.meta.url), 'utf8');

test('the date filter uses the x-date-pickers DatePicker and reads its value as a dayjs day', () => {
  assert.match(row, /import \{ DatePicker \} from '@mui\/x-date-pickers';/);
  assert.match(row, /value=\{typeof filter\.value === 'string' && filter\.value \? dayjs\(filter\.value\) : null\}/);
  assert.match(row, /format="YYYY-MM-DD"/);
  assert.doesNotMatch(row, /@material-ui/);
});

test('a picked day is sent on as YYYY-MM-DD and a date still being typed changes nothing', () => {
  assert.match(row, /onChange=\{handleDateChange\}/);
  assert.match(
    row,
    /const handleDateChange = \(date\) => \{\s*if \(date === null\) \{\s*handleValueChange\(''\);\s*\} else if \(date\.isValid\(\)\) \{\s*handleValueChange\(toLocalDateString\(date\)\);\s*\}\s*\};/,
  );
});

test('a dayjs value is formatted by the same helper as the v4 moment value', () => {
  const dayjsLike = { format: (pattern) => (pattern === 'YYYY-MM-DD' ? '2026-09-30' : 'bad'), toDate: () => new Date() };
  assert.equal(toLocalDateString(dayjsLike), '2026-09-30');
});
