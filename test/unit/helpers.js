import { expect } from "bun:test";

import convertWithAbp from "../../src/converters/abp.js";
import convertWithAdguard from "../../src/converters/adguard.js";

function normalize(rule) {
  if (!rule) {
    return undefined;
  }
  delete rule.priority;
  delete rule.id;
  return rule;
}

export async function testRule(rule) {
  const { rules: adguardRules } = await convertWithAdguard([rule]);
  const { rules: abpRules } = await convertWithAbp([rule]);
  try {
    expect(normalize(adguardRules[0])).toEqual(normalize(abpRules[0]));
  } catch (e) {
    e.message += `
Input filter: ${rule}
    `;
    throw e;
  }
}
