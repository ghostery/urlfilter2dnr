import assert from 'node:assert/strict';

import convertWithAbp from '../../src/converters/abp.js';
import convertWithAdguard from '../../src/converters/adguard.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalize(rule: any) {
  if (!rule) {
    return undefined;
  }
  if (rule.condition?.resourceTypes !== undefined) {
    rule.condition.resourceTypes = rule.condition.resourceTypes.sort();
  }
  if (rule.condition?.regexFilter !== undefined) {
    rule.condition.regexFilter = rule.condition.regexFilter
      // @eyeo/webext-ad-filtering-solution is adding unnecessary escaping to slash
      .replace(/\\\//g, '/');
  }
  delete rule.priority;
  delete rule.id;
  return rule;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function testRule(rule: any) {
  const { rules: adguardRules, errors: adguardErrors } = await convertWithAdguard([rule]);
  const { rules: abpRules, errors: abpErrors } = await convertWithAbp([rule]);

  assert.notEqual(
    adguardRules[0],
    undefined,
    `failed to convert using adguard converter: rule="${rule}" e=${adguardErrors[0]}`,
  );
  assert.notEqual(
    abpRules[0],
    undefined,
    `failed to convert using abp converter: rule="${rule}" e=${abpErrors[0]}`,
  );
  assert.deepEqual(normalize(adguardRules[0]), normalize(abpRules[0]));
}
