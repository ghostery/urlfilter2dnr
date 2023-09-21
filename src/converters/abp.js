import { convertFilter } from "@ghostery/abp2dnr";
import { Filter } from "adblockpluscore/lib/filterClasses";
import { normalizeFilter } from "./helpers";

export default async function convert(filters) {
  const rules = [];
  const errors = [];
  for (const filter of filters) {
    try {
      const normalizedFilter = normalizeFilter(Filter.normalize(filter));
      const abpFilter = Filter.fromText(normalizedFilter);
      const dnrRules = await convertFilter(abpFilter, () => ({
        isSupported: true,
      }));
      if (dnrRules.length > 0) {
        rules.push(...dnrRules);
      } else {
        throw new Error("Unknown problem");
      }
    } catch (e) {
      errors.push(`Error: "${e.message}" in rule: "${filter}"`);
    }
  }

  return {
    rules,
    errors,
  };
}
