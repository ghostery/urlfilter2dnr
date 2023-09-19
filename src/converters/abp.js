import { convertFilter } from "@ghostery/abp2dnr";
import { Filter } from 'adblockpluscore/lib/filterClasses';
import { normalizeFilter } from "./helpers";

export default async function convert(rules) {
  const dnrRules = [];
  for (const rule of rules) {
    const normalizedFilter = normalizeFilter(Filter.normalize(rule));
    const filter = Filter.fromText(normalizedFilter);
    for (const dnrRule of await convertFilter(filter, () => ({ isSupported: true }))) {
      dnrRules.push(dnrRule);
    }
  }

  return dnrRules;
}
