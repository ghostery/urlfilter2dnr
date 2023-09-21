import { expect } from "bun:test";

import convertWithAbp from "../../src/converters/abp.js";
import convertWithAdguard from "../../src/converters/adguard.js";

export function normalizeDNRRule(rule) {
  if (!rule) {
    return;
  }
  const newRule = structuredClone(rule);
  delete newRule.priority;
  delete newRule.id;

  if (newRule.condition && newRule.condition.urlFilter) {
    if (newRule.condition.urlFilter.endsWith("*")) {
      newRule.condition.urlFilter = newRule.condition.urlFilter.slice(0, -1);
    }
    if (newRule.condition.isUrlFilterCaseSensitive === undefined) {
      newRule.condition.isUrlFilterCaseSensitive = false;
    }
  }

  if (
    newRule.condition &&
    newRule.condition.regexFilter &&
    !(
      newRule.condition.regexFilter.startsWith("/") &&
      newRule.condition.regexFilter.endsWith("/")
    )
  ) {
    newRule.condition.regexFilter = `/${newRule.condition.regexFilter}/`;
  }
  return newRule;
}

export async function testRule(rule) {
  const { rules: adguardRules } = await convertWithAdguard([rule]);
  const { rules: abpRules } = await convertWithAbp([rule]);
  try {
    expect(normalizeDNRRule(adguardRules[0])).toEqual(normalizeDNRRule(abpRules[0]));
  } catch (e) {
    e.message += `
Input filter: ${rule}
    `;
    throw e;
  }
}
