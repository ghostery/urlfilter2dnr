import {
  FilterParsingError,
  normalize,
} from '@eyeo/webext-ad-filtering-solution/adblockpluscore/lib/filters/index.js';
import { createConverter } from '@eyeo/webext-ad-filtering-solution/adblockpluscore/lib/dnr/index.js';
import { normalizeFilter, normalizeRule, DEFAULT_PARAM_MAPPING } from './helpers.js';

const PARAM_MAPPING = {
  ...DEFAULT_PARAM_MAPPING,
  'redirect': 'rewrite',
  'redirect-rule': 'rewrite',
};

export default async function convert(filters: string[]) {
  const converter = createConverter({ isRegexSupported: () => true });
  const rules = [];
  const errors = [];
  let nextId = 1;
  for (const filter of filters) {
    try {
      const normalizedFilter = normalizeFilter(normalize(filter), { mapping: PARAM_MAPPING });

      if (!normalizedFilter) {
        throw new Error('Failed to normalize filter');
      }

      const dnrRules = await converter(normalizedFilter);
      if (dnrRules instanceof FilterParsingError) {
        throw dnrRules;
      }
      if (dnrRules.length > 0) {
        for (const rule of dnrRules) {
          rule.id = nextId++;
          rules.push(rule);
        }
      } else {
        throw new Error('Unknown problem');
      }
    } catch (e: any) {
      errors.push(`Error: "${e.message}" in rule: "${filter}"`);
    }
  }

  return {
    rules: rules.map((rule) => normalizeRule(rule)),
    errors,
  };
}
