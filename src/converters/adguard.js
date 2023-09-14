import * as AdGuardConverter from "@adguard/tsurlfilter/es/declarative-converter";

const converter = new AdGuardConverter.DeclarativeFilterConverter();

class Filter {
  constructor(content) {
    this.content = content;
  }

  getId() {
    return 1;
  }

  getContent() {
    return Promise.resolve(this.content);
  }

  getRuleByIndex(index) {
    return Promise.resolve(this.content[index]);
  }
}

export default async function convert(rules) {
  const filter = new Filter(rules);
  const result = await converter.convert([filter]);
  const { declarativeRules } = await result.ruleSets[0].serialize();
  return declarativeRules;
}
