import * as AdGuardConverter from "@adguard/tsurlfilter/es/declarative-converter";
import { normalizeFilter, normalizeRule } from "./helpers.js";

const converter = new AdGuardConverter.DeclarativeFilterConverter();

class Filter {
  constructor(rules) {
    this.content = rules.map((r => normalizeFilter(r)));
  }

  getId() {
    return 1;
  }

  async getContent() {
    return this.content;
  }

  async getRuleByIndex(index) {
    return this.content[index];
  }
}

export default async function convert(rules) {
  const filter = new Filter(rules);
  const result = await converter.convert([filter]);
  const conversion = await result.ruleSets[0].serialize();
  return {
    rules: conversion.declarativeRules.map(normalizeRule),
    errors: result.errors,
  };
}
