import { Filter, FilterConverter } from '@adguard/dnr-converter';
import resourceMapping from '../mappings.js';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new FilterConverter();

const resources: Record<string, { ubo?: string }> = resourceMapping;
// The last `redirect=` of a filter is the option. uBO allows a priority after the resource name
const REDIRECT_RESOURCE_PATTERN = /.*[$,]redirect=([^,]+?)(?::-?\d+)?(?:,|$)/;

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
  const results = await converter.convert([filter], { resourcesPath, withSourceMap: true });

  const declarativeRules = [];
  const normalizeRules = [];
  const errors = results.flatMap((result) => result.errors.map((e) => e.toString()));

  for (const { ruleset } of results) {
    for (const rule of await ruleset.getDeclarativeRules()) {
      const file = rule.action.redirect?.extensionPath?.slice(resourcesPath.length + 1);
      // AdGuard does not have every uBO resource and does not report one it cannot resolve
      if (rule.action.redirect && file && !resources[file]) {
        const [{ sourceRule = '' } = {}] = await ruleset.getRulesById(rule.id);
        const [, name = ''] = REDIRECT_RESOURCE_PATTERN.exec(sourceRule) ?? [];
        const resource = resources[name]?.ubo;
        if (!resource) {
          errors.push(`Error: Unknown redirect resource "${name}" in the rule: "${sourceRule}"`);
          continue;
        }
        rule.action.redirect.extensionPath = `${resourcesPath}/${resource}`;
      }
      declarativeRules.push(rule);
    }
  }

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
