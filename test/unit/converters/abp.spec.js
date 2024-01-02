import { describe, it, expect } from "bun:test";

import convertWithAbp from '../../../src/converters/abp.js';

describe('abp converter', () => {
  it('handles 3p rules', async () => {
    const { rules: rules1 } = await convertWithAbp(['||sync.extend.tv^$3p']);
    expect(rules1[0]).not.toEqual(undefined);

    const { rules: rules2 } = await convertWithAbp(['||d3pkntwtp2ukl5.cloudfront.net^$3p']);
    expect(rules2[0]).not.toEqual(undefined);
  });

  it('handles trailing wildcard', async () => {
    const { rules } = await convertWithAbp(['/js/tealium/*']);
    expect(rules[0]).not.toEqual(undefined);
  });

  it("||tinypass.com^$3p,domain=~foreignpolicy.com", async () => {
    const { rules } = await convertWithAbp(['tinypass.com$3p,domain=x.z']);
    expect(rules[0]).toEqual({
      action: {
        type: "block"
      },
      condition: {
        domainType: "thirdParty",
        domains: [
          "x.z"
        ],
        isUrlFilterCaseSensitive: false,
        urlFilter: "tinypass.com"
      },
      priority: 2000,
      id: 1
    });
  });

  it("handles regexp rules", async () => {
    const { rules } = await convertWithAbp(["/js/"]);
    expect(rules[0]).toEqual(undefined);
  });
});
