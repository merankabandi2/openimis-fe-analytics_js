import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The pages are JSX, which `node --test` cannot load; these checks read the
// source to pin how dashboard editing and the withheld-rows warning are wired.
const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const translations = (lang) => JSON.parse(read(`translations/${lang}.json`));

test('the dashboard create right shows the "new dashboard" button', () => {
  const page = read('pages/AnalyticsDashboardPage.js');
  assert.match(page, /const canCreateDashboard = hasRight\(rights, RIGHT_ANALYTICS_CREATE_DASHBOARD\);/);
  assert.match(page, /\{canCreateDashboard && \(\s*<Button[^\n]*onClick=\{openCreateDashboard\}>/);
});

test('edit, delete and widget removal are offered only on a dashboard the user may edit', () => {
  const page = read('pages/AnalyticsDashboardPage.js');
  assert.match(page, /\{canEdit && \(\s*<Tooltip title=\{formatMessage\('dashboard\.edit'\)\}>/);
  assert.match(page, /\{canEdit && !currentDashboard\.isDefault && \(\s*<Tooltip title=\{formatMessage\('dashboard\.delete'\)\}>/);
  assert.match(page, /\{canEdit && \(\s*<IconButton[\s\S]*?setWidgetToRemove\(widget\)/);
  assert.match(page, /draggableCancel="\.analytics-remove-widget"/);
});

test('the public switch of the dashboard dialog needs the share right', () => {
  const page = read('pages/AnalyticsDashboardPage.js');
  assert.match(page, /const canShare = hasRight\(rights, RIGHT_ANALYTICS_SHARE\);/);
  assert.match(page, /\{canShare && \(\s*<FormControlLabel[\s\S]*?dashboard\.makePublic/);
  assert.match(page, /isPublic: canShare\s*\? dashboardForm\.isPublic/);
});

test('saved queries offer "add to a dashboard" with the dashboard right, to editable dashboards only', () => {
  const page = read('pages/SavedQueriesPage.js');
  assert.match(page, /const canAddToDashboard = hasRight\(rights, RIGHT_ANALYTICS_CREATE_DASHBOARD\);/);
  assert.match(page, /\{canAddToDashboard && \(\s*<Tooltip title=\{formatMessage\('savedQueries\.addToDashboard'\)\}>/);
  assert.match(page, /const editableDashboards = \(dashboards \|\| \[\]\)\.filter\(\(d\) => d\.canEdit\);/);
  assert.match(page, /addWidget\(\s*widgetForm\.dashboardId, widgetForm\.query\.id, widgetForm\.widgetType/);
});

test('the actions call the backend dashboard and widget mutations', () => {
  const actions = read('actions.js');
  for (const mutation of [
    'createAnalyticsDashboard(input: $input)',
    'updateAnalyticsDashboard(id: $id, input: $input)',
    'deleteAnalyticsDashboard(id: $id)',
    'addAnalyticsWidget(dashboardId: $dashboardId, queryId: $queryId, widgetType: $widgetType, title: $title)',
    'deleteAnalyticsWidget(id: $id)',
  ]) {
    assert.ok(actions.includes(mutation), mutation);
  }
});

test('a query result says when restricted grievances were withheld', () => {
  assert.match(read('actions.js'), /executeAnalyticsQuery\([^)]*\) \{\s*data\s*rowCount\s*truncated\s*restrictedRowsWithheld/);
  assert.match(
    read('components/QueryResults.js'),
    /\{restrictedRowsWithheld && \(\s*<Typography[^>]*role="alert">\s*\{formatMessage\('queryResults\.restrictedRowsWithheld'\)\}/,
  );
});

test('every message the new controls use exists in French and English', () => {
  const sources = ['pages/AnalyticsDashboardPage.js', 'pages/SavedQueriesPage.js', 'components/QueryResults.js']
    .map(read).join('\n');
  const keys = new Set(
    [...sources.matchAll(/'((?:dashboard|savedQueries|queryResults|common|pagination)\.[a-zA-Z]+)'/g)].map((m) => m[1]),
  );
  for (const type of ['bar_chart', 'line_chart', 'pie_chart', 'table', 'metric']) keys.add(`widgetType.${type}`);
  for (const lang of ['fr', 'en']) {
    const messages = translations(lang);
    for (const key of keys) {
      assert.ok(messages[`analytics.${key}`], `${lang}: analytics.${key}`);
    }
  }
});

test('the empty-dashboard hint names the action that adds a widget', () => {
  const fr = translations('fr');
  assert.ok(fr['analytics.dashboard.addWidgetsHint'].includes(fr['analytics.savedQueries.addToDashboard']));
  assert.ok(fr['analytics.dashboard.addWidgetsHint'].includes(fr['analytics.menu.analytics.savedQueries']));
});

test('refusals of the dashboard mutations are shown in French', async () => {
  const { localiseError } = await import('../src/utils/analytics.js');
  const fr = translations('fr');
  const lookup = (id) => fr[`analytics.${id}`] || id;
  const t = (message) => localiseError(message, lookup, (id) => lookup(id));
  assert.equal(t('You can only change your own dashboards'), fr['analytics.error.editOwnDashboards']);
  assert.equal(
    t('Making a query or dashboard public requires the analytics share right'),
    fr['analytics.error.shareRight'],
  );
  assert.equal(t('The default dashboard cannot be deleted'), fr['analytics.error.defaultDashboard']);
  assert.equal(t('This query is not visible to you'), fr['analytics.error.queryNotVisible']);
});
