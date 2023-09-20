import { describe, it, expect } from "bun:test";

import convertWithAbp from '../../../src/converters/abp.js';

describe('abp converter', () => {
  it('handles 3p rules', async () => {
    const [rule1] = await convertWithAbp(['||sync.extend.tv^$3p']);
    expect(rule1).not.toEqual(undefined);

    const [rule2] = await convertWithAbp(['||d3pkntwtp2ukl5.cloudfront.net^$3p']);
    expect(rule2).not.toEqual(undefined);
  });

  it('handles trailing wildcard', async () => {
    const [rule1] = await convertWithAbp(['/js/tealium/*']);
    expect(rule1).not.toEqual(undefined);
  });

  it("||tinypass.com^$3p,domain=~foreignpolicy.com", async () => {
    const [rule1] = await convertWithAbp(['tinypass.com$3p,domain=x.z']);
    expect(rule1).toEqual({
      action: {
        type: "block"
      },
      condition: {
        domainType: "thirdParty",
        initiatorDomains: [
          "x.z"
        ],
        isUrlFilterCaseSensitive: false,
        urlFilter: "tinypass.com"
      },
      priority: 2000
    });
  });

  it("handles regexp rules", async () => {
    const [rule1] = await convertWithAbp(["/js/"]);
    expect(rule1).not.toEqual(undefined);
  });
});
