import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The export mutation queues the export on the server; the file is listed in
// the export history once the task has written it. The reducer and the query
// builder import @openimis/fe-core and JSX, so these checks read the source.
const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const translations = (lang) => JSON.parse(source(`translations/${lang}.json`));

test('the export mutation asks only whether the export is queued', () => {
  const actions = source('actions.js');
  const mutation = actions.slice(actions.indexOf('mutation ExportAnalyticsData'), actions.indexOf("'ANALYTICS_EXPORT'"));
  assert.match(mutation, /\) \{\s*queued\s*\}/);
  assert.doesNotMatch(mutation, /exportUrl|exportId|rowCount/);
});

test('the reducer keeps the queued flag of the export response', () => {
  const reducer = source('reducer.js');
  assert.match(reducer, /exportQueued: Boolean\(data && data\.queued\)/);
  assert.doesNotMatch(reducer, /exportUrl|exportRowCount/);
});

test('the query builder opens no file and says the export is queued', () => {
  const builder = source('components/QueryBuilder.js');
  assert.doesNotMatch(builder, /window\.open/);
  assert.match(builder, /\{exportQueued && \(\s*<Paper className=\{classes\.notice\}>[\s\S]*?formatMessage\('queryBuilder\.exportQueued'\)/);
  assert.match(builder, /exportQueued: state\.analytics\.exportQueued/);
});

test('the queued message names the export history in both languages', () => {
  const fr = translations('fr');
  const en = translations('en');
  assert.ok(fr['analytics.queryBuilder.exportQueued'].includes(`« ${fr['analytics.menu.analytics.exportHistory']} »`));
  assert.ok(en['analytics.queryBuilder.exportQueued'].includes(`"${en['analytics.menu.analytics.exportHistory']}"`));
  assert.equal(fr['analytics.queryBuilder.exportDone'], undefined);
  assert.equal(en['analytics.queryBuilder.exportDone'], undefined);
});
