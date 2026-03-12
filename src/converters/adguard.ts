import {
  DeclarativeFilterConverter,
  type IFilter,
} from '@adguard/tsurlfilter/es/declarative-converter';
import { normalizeFilter, normalizeRule } from './helpers.js';

const converter = new DeclarativeFilterConverter();

class SimpleFilterList {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }

  getConversionData() {
    return { originals: [] as string[], conversions: {} as Record<number, number> };
  }

  getRuleText(offset: number): string | null {
    if (offset >= this.content.length) return null;
    const nlIndex = this.content.indexOf('\n', offset);
    const endIndex = nlIndex === -1 ? this.content.length : nlIndex;
    const line = this.content.slice(offset, endIndex);
    return line.endsWith('\r') ? line.slice(0, -1) : line;
  }

  getOriginalRuleText(offset: number): string | null {
    if (offset < 0 || offset >= this.content.length) return null;
    return this.getRuleText(offset);
  }

  getConvertedRuleOriginal(): string | null {
    return null;
  }

  getOriginalContent(): string {
    return this.content;
  }
}

const createFilter = (rules: string[], filterId = 0): IFilter => {
  const filterList = new SimpleFilterList(rules.join('\n'));
  return {
    getId: () => filterId,
    getContent: async () => filterList as any,
    getRuleByIndex: async (index: number) => filterList.getOriginalRuleText(index) ?? '',
    isTrusted: () => true,
    unloadContent: () => {},
  };
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
