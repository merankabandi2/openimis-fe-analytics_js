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

const translations = (lang) => JSON.parse(
  readFileSync(new URL(`../src/translations/${lang}.json`, import.meta.url), 'utf8'),
);

// A page guarded like the query builder: the right is checked before the list
// is fetched, and without it the page renders only a translated message.
const assertPageGuard = (page, right, key) => {
  assert.match(page, new RegExp(`if \\(!allowed\\) return;[\\s\\S]*?fetch`));
  assert.match(page, new RegExp(`const allowed = hasRight\\(rights, ${right}\\);`));
  assert.match(page, new RegExp(`if \\(!allowed\\) \\{[\\s\\S]*?formatMessage\\('${key.replace('.', '\\.')}'\\)[\\s\\S]*?\\n {2}\\}`));
  assert.match(page, /rights: state\.core\?\.user\?\.i_user\?\.rights/);
  for (const lang of ['fr', 'en']) assert.ok(translations(lang)[`analytics.${key}`], `${key} missing in ${lang}`);
};

test('the dashboard page needs the dashboards right before loading anything', () => {
  assertPageGuard(source('AnalyticsDashboardPage.js'), 'RIGHT_ANALYTICS_VIEW', 'dashboard.noRight');
});

test('the saved-queries page needs the query right before loading anything', () => {
  assertPageGuard(source('SavedQueriesPage.js'), 'RIGHT_ANALYTICS_CREATE_QUERY', 'savedQueries.noRight');
});

test('the export history page needs the export right before loading anything', () => {
  assertPageGuard(source('ExportHistoryPage.js'), 'RIGHT_ANALYTICS_EXPORT', 'exportHistory.noRight');
});

test('the saved-queries "+" is rendered only past the query-right guard', () => {
  const page = source('SavedQueriesPage.js');
  const guard = page.indexOf('if (!allowed) {');
  assert.ok(guard >= 0 && guard < page.indexOf('<Fab'));
});

test('edit and delete are offered only on saved queries the server says the user may change', () => {
  const page = source('SavedQueriesPage.js');
  assert.match(page, /\{query\.canEdit && \(\s*<Tooltip title=\{formatMessage\('savedQueries\.edit'\)\}>/);
  assert.match(page, /\{query\.canEdit && \(\s*<Tooltip title=\{formatMessage\('savedQueries\.delete'\)\}>/);
  assert.doesNotMatch(page, /canUpdate/);
  const actions = readFileSync(new URL('../src/actions.js', import.meta.url), 'utf8');
  assert.match(actions, /analyticsQueries[\s\S]*?'canEdit'/);
});

test('widget errors are shown inside the translated widget error text', () => {
  const page = source('AnalyticsDashboardPage.js');
  assert.match(page, /formatMessageWithValues\('widget\.error', \{ error: localise\(rawError\) \}\)/);
  for (const lang of ['fr', 'en']) assert.ok(translations(lang)['analytics.widget.error']);
});

test('every page that shows a server message passes it through localiseError', () => {
  for (const [file, count] of [
    ['AnalyticsDashboardPage.js', 1], ['SavedQueriesPage.js', 1], ['ExportHistoryPage.js', 1], ['QueryBuilderPage.js', 1],
  ]) {
    const page = source(file);
    assert.ok((page.match(/localiseError\(/g) || []).length >= count, `${file} does not localise errors`);
  }
  const builder = readFileSync(new URL('../src/components/QueryBuilder.js', import.meta.url), 'utf8');
  assert.match(builder, /\{ error: localise\(queryError\) \}/);
  assert.match(builder, /\{ error: localise\(exportError\) \}/);
});

test('fr and en carry the same analytics keys', () => {
  assert.deepEqual(Object.keys(translations('fr')).sort(), Object.keys(translations('en')).sort());
});
