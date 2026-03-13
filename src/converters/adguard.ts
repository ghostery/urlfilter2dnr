import { DeclarativeFilterConverter, Filter } from '@adguard/tsurlfilter/es/declarative-converter';
import { FilterList } from '@adguard/tsurlfilter';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new DeclarativeFilterConverter();

const createFilter = (rules: string[], filterId = 0) => {
  return new Filter(
    filterId,
    {
      getContent: async () => Promise.resolve(new FilterList(rules.join('\n'))),
    },
    true,
  );
};

export default async function convert(
  rules: string[],
  { resourcesPath = '/prefix' }: { resourcesPath?: string } = {},
) {
  if (rules.length === 0) {
    return {
      rules: [],
      errors: [],
      limitations: [],
    };
  }

  const filter = createFilter(rules.map((rule) => normalizeFilter(rule) ?? ''));
  const conversionResult = await converter.convertStaticRuleSet(filter, { resourcesPath });
  const declarativeRules = await conversionResult.ruleSet.getDeclarativeRules();

  const normalizeRules = [];
  const errors = conversionResult.errors.map((e) => e.toString());

  for (const [index, rule] of declarativeRules.entries()) {
    try {
      normalizeRules.push(normalizeRule(rule, { resourcesPath, id: index + 1 }));
    } catch (e) {
      errors.push(
        `Could not normalize rule: ${JSON.stringify(rule)} - ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  return {
    rules: normalizeRules,
    errors,
    limitations: conversionResult.limitations,
  };
}
