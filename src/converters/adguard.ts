import { Filter, FilterConverter } from '@adguard/dnr-converter';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new FilterConverter();

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

  const filter = new Filter(0, rules.map((rule) => normalizeFilter(rule) ?? '').join('\n'));
  const results = await converter.convert([filter], { resourcesPath });
  const declarativeRules = results.flatMap((result) => result.ruleset.getDeclarativeRules());

  const normalizeRules = [];
  const errors = results.flatMap((result) => result.errors.map((e) => e.toString()));

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
    limitations: results.flatMap((result) => result.limitations),
  };
}
