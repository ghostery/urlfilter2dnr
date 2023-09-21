import { describe, it, expect } from "bun:test";

import { testRule } from "./helpers";

describe('testRule', () => {
  it('passes on compatible rule', async () => {
    await testRule('domain.com');
  });

  it('throws on incompatible rules', () => {
    expect(async () => {
      await testRule('||testcases.adguard.com$removeparam=p1case6');
    }).toThrow();
  });
});
