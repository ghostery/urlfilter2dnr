import { DeclarativeFilterConverter, Filter } from '@adguard/tsurlfilter/es/declarative-converter';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new DeclarativeFilterConverter();

const createFilter = (rules, filterId = 0) => {
  return new Filter(filterId, { getContent: async () => rules });
};

export default async function convert(rules, { resourcesPath } = {}) {
  const filter = createFilter(rules.map(normalizeFilter));
  const conversionResult = await converter.convertStaticRuleSet(filter, { resourcesPath: '/a' });
  const declarativeRules = await conversionResult.ruleSet.getDeclarativeRules();

  return {
    rules: declarativeRules.map((rule) => normalizeRule(rule, { resourcesPath })),
    errors: conversionResult.errors,
    limitations: conversionResult.limitations,
  };
}
