import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The pages are JSX, which `node --test` cannot load; these checks read the
// source to pin the rights guard around the query-builder entry points.
const source = (path) => readFileSync(new URL(`../src/pages/${path}`, import.meta.url), 'utf8');

test('the dashboard "+" shortcut to the query builder needs the query right', () => {
  const page = source('AnalyticsDashboardPage.js');
  assert.match(page, /hasRight\(rights, RIGHT_ANALYTICS_CREATE_QUERY\) && \(\s*<Fab/);
  assert.match(page, /rights: state\.core\?\.user\?\.i_user\?\.rights/);
});

test('the query builder page renders nothing but a message without the query right', () => {
  const page = source('QueryBuilderPage.js');
  assert.match(
    page,
    /if \(!hasRight\(rights, RIGHT_ANALYTICS_CREATE_QUERY\)\) \{[\s\S]*?queryBuilder\.noRight[\s\S]*?\n {2}\}\n\n {2}return \(\n\s*<div className=\{classes\.page\}>[\s\S]*?<QueryBuilder/,
  );
});
