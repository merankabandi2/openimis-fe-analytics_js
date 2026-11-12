import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY,
  menuEntries,
  routeProps,
  dashboardEntry,
} from '../src/menu/menuEntry.js';
import * as constants from '../src/constants.js';

const index = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const en = JSON.parse(readFileSync(new URL('../src/translations/en.json', import.meta.url), 'utf8'));
const fr = JSON.parse(readFileSync(new URL('../src/translations/fr.json', import.meta.url), 'utf8'));

test('the menu ids are the ones the fe-core menu configuration whitelists, in menu order', () => {
  assert.equal(ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY, 'analytics.MainMenu');
  assert.deepEqual(menuEntries.map((entry) => entry.id), [
    'analytics.dashboard',
    'analytics.queryBuilder',
    'analytics.savedQueries',
    'analytics.exportHistory',
  ]);
});

test('each entry shows with the right the v4 menu filter checked', () => {
  const rights = Object.fromEntries(menuEntries.map((entry) => [entry.id, entry.rights]));
  assert.deepEqual(rights, {
    'analytics.dashboard': [constants.RIGHT_ANALYTICS_VIEW],
    'analytics.queryBuilder': [constants.RIGHT_ANALYTICS_CREATE_QUERY],
    'analytics.savedQueries': [constants.RIGHT_ANALYTICS_CREATE_QUERY],
    'analytics.exportHistory': [constants.RIGHT_ANALYTICS_EXPORT],
  });
  assert.deepEqual(rights['analytics.dashboard'], [803001]);
});

test('routes have no leading slash, texts are translation keys of both languages', () => {
  menuEntries.forEach((entry) => {
    assert.ok(!entry.route.startsWith('/'), entry.route);
    assert.equal(typeof entry.icon, 'string');
    assert.ok(en[entry.text], `en ${entry.text}`);
    assert.ok(fr[entry.text], `fr ${entry.text}`);
  });
});

test('routeProps carries id, text, icon and rights but not the route', () => {
  assert.deepEqual(Object.keys(routeProps(dashboardEntry)).sort(), ['icon', 'id', 'rights', 'text']);
});

test('index.js registers each route with its entry and contributes the entries', () => {
  [
    ['ANALYTICS_DASHBOARD_ROUTE', 'dashboardEntry'],
    ['QUERY_BUILDER_ROUTE', 'queryBuilderEntry'],
    ['SAVED_QUERIES_ROUTE', 'savedQueriesEntry'],
    ['EXPORT_HISTORY_ROUTE', 'exportHistoryEntry'],
  ].forEach(([route, entry]) => {
    assert.match(index, new RegExp(`path: ${route}, \\.\\.\\.routeProps\\(${entry}\\)`));
  });
  assert.match(index, /\[ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY\]: menuEntries/);
  assert.doesNotMatch(index, /requiredRights|filter:/);
});
