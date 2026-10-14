import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const translations = (lang) => JSON.parse(
  readFileSync(new URL(`../src/translations/${lang}.json`, import.meta.url), 'utf8'),
);

// fe-core RoleRightsPanel labels a right with the message `${module}.${permsName}`
// and falls back to « [No Translation] Module | Words » when it is missing.
// These are the *_perms keys of the analytics backend config (apps.py DEFAULT_CFG).
const PERMS_NAMES = [
  'gql_analytics_dashboards_perms',
  'gql_analytics_query_perms',
  'gql_analytics_export_perms',
  'gql_analytics_dashboard_create_perms',
  'gql_analytics_dashboard_share_perms',
  'gql_analytics_query_create_perms',
  'gql_analytics_query_update_perms',
];

const MODULE_LABELS = { fr: 'Analytique', en: 'Analytics' };

for (const [lang, moduleLabel] of Object.entries(MODULE_LABELS)) {
  test(`every analytics right has a distinct ${lang} label on the role screen`, () => {
    const messages = translations(lang);
    const labels = PERMS_NAMES.map((name) => messages[`analytics.${name}`]);
    assert.deepEqual(PERMS_NAMES.filter((name, i) => !labels[i]), []);
    for (const label of labels) {
      assert.match(label, new RegExp(`^${moduleLabel} \\| \\S`));
    }
    assert.equal(new Set(labels).size, PERMS_NAMES.length);
  });
}
