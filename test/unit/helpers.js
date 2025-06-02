import assert from 'node:assert';

import convertWithAbp from '../../src/converters/abp.js';
import convertWithAdguard from '../../src/converters/adguard.js';

function normalize(rule) {
  if (!rule) {
    return undefined;
  }
  if (rule.condition?.resourceTypes !== undefined) {
    rule.condition.resourceTypes = rule.condition.resourceTypes.sort();
  }
  delete rule.priority;
  delete rule.id;
  return rule;
}

export async function testRule(rule) {
  try {
    const { rules: adguardRules } = await convertWithAdguard([rule]);
    const { rules: abpRules } = await convertWithAbp([rule]);

    assert.notStrictEqual(adguardRules[0], undefined);
    assert.deepStrictEqual(normalize(adguardRules[0]), normalize(abpRules[0]));
  } catch (e) {
    e.message += `
Input filter: ${rule}
    `;
    throw e;
  }
}
