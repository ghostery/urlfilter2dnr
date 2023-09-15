import { convertFilter } from "@ghostery/abp2dnr";
import { Filter } from 'adblockpluscore/lib/filterClasses';

export default async function convert(rules) {
  const dnrRules = [];
  for (const rule of rules) {
    const filter = Filter.fromText(Filter.normalize(rule));
    for (const dnrRule of await convertFilter(filter, true)) {
      dnrRules.push(dnrRule);
    }
  }

  return dnrRules;
}
