import { DeclarativeFilterConverter, Filter } from '@adguard/tsurlfilter/es/declarative-converter';
import { FilterListPreprocessor } from '@adguard/tsurlfilter';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new DeclarativeFilterConverter();

const createFilter = (rules, filterId = 0) => {
  return new Filter(
    filterId,
    {
      getContent: async () => Promise.resolve(FilterListPreprocessor.preprocess(rules.join('\n'))),
    },
    true,
  );
};

export default async function convert(rules, { resourcesPath = '/prefix' } = {}) {
  const filter = createFilter(rules.map(normalizeFilter));
  const conversionResult = await converter.convertStaticRuleSet(filter, { resourcesPath });
  const declarativeRules = await conversionResult.ruleSet.getDeclarativeRules();

  return {
    rules: declarativeRules.map((rule, index) => normalizeRule(rule, { resourcesPath, id: index + 1 })),
    errors: conversionResult.errors,
    limitations: conversionResult.limitations,
  };
}
