import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { localiseError } from '../src/utils/analytics.js';

const fr = JSON.parse(readFileSync(new URL('../src/translations/fr.json', import.meta.url), 'utf8'));

// Minimal stand-ins for fe-core's module-bound formatters: look the key up in
// fr.json and substitute {placeholders}.
const lookup = (id) => fr[`analytics.${id}`] || fr[id] || id;
const formatMessage = (id) => lookup(id);
const formatMessageWithValues = (id, values = {}) => lookup(id).replace(/\{(\w+)\}/g, (_, k) => String(values[k]));
const t = (message) => localiseError(message, formatMessage, formatMessageWithValues);

test('a missing-right refusal is shown in French', () => {
  assert.equal(t('Unauthorized'), fr['analytics.error.unauthorized']);
  assert.doesNotMatch(t('Unauthorized'), /Unauthorized/);
});

test('ownership refusals on saved queries are shown in French', () => {
  assert.equal(t('You can only edit your own queries'), fr['analytics.error.editOwnQueries']);
  assert.equal(t('You can only delete your own queries'), fr['analytics.error.deleteOwnQueries']);
  assert.equal(
    t('This query is used by a dashboard widget and cannot be deleted'),
    fr['analytics.error.queryUsedByWidget'],
  );
});

test('a field refused by a widget query names the field, the query part and the entity in French', () => {
  const text = t("Field 'benefit_plan__name' is not allowed in group_by for entity 'beneficiary'");
  assert.match(text, /benefit_plan__name/);
  assert.match(text, new RegExp(fr['analytics.error.context.group_by']));
  assert.match(text, new RegExp(fr['analytics.entity.beneficiary']));
  assert.doesNotMatch(text, /is not allowed|for entity/);
});

test('a message containing "; " is matched as a whole before being split', () => {
  const text = t('Export exceeds maximum rows (50000); add filters or grouping');
  assert.match(text, /50000/);
  assert.doesNotMatch(text, /exceeds/);
});

test('joined messages are translated one by one and unknown ones are kept as sent', () => {
  assert.equal(
    t('Unauthorized; connection reset'),
    `${fr['analytics.error.unauthorized']}; connection reset`,
  );
  assert.equal(t('Network request failed'), 'Network request failed');
  assert.equal(t(null), null);
});

test('every known backend message has a French and an English text', () => {
  const en = JSON.parse(readFileSync(new URL('../src/translations/en.json', import.meta.url), 'utf8'));
  const errorKeys = Object.keys(fr).filter((k) => k.startsWith('analytics.error.'));
  assert.ok(errorKeys.length >= 10);
  for (const key of errorKeys) assert.ok(en[key], `${key} missing in en.json`);
});
