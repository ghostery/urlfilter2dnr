import { convertFilter } from "@eyeo/abp2dnr";
import abcFilters from "@eyeo/webext-ad-filtering-solution/adblockpluscore/lib/filters/index.js";
import { normalizeFilter, normalizeRule } from "./helpers";

export default async function convert(filters) {
  const rules = [];
  const errors = [];
  let nextId = 1;
  for (const filter of filters) {
    try {
      const normalizedFilter = normalizeFilter(abcFilters.normalize(filter));
      const dnrRules = await convertFilter(normalizedFilter);
      if (dnrRules.length > 0) {
        for (const rule of dnrRules) {
          rule.id = nextId++;
          rules.push(rule);
        }
      } else {
        throw new Error("Unknown problem");
      }
    } catch (e) {
      errors.push(`Error: "${e.message}" in rule: "${filter}"`);
    }
  }

  return {
    rules: rules.map(normalizeRule),
    errors,
  };
}
