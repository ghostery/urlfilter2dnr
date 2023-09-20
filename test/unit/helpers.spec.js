import { describe, it, expect } from "bun:test";

import { normalizeDNRRule, testRule } from "./helpers";

describe('normalizeDNRRule', () => {
  it('does nothing for empty rules', () => {
    expect(normalizeDNRRule(undefined)).toEqual(undefined);
  });

  it('removes priority', () => {
    expect(normalizeDNRRule({
      priority: 1000,
    })).toEqual({});
  });

  it('removes id', () => {
    expect(normalizeDNRRule({
      id: 1,
    })).toEqual({});
  });

  describe('with urlFilter', () => {
    it('sets isUrlFilterCaseSensitive default value', () => {
      expect(normalizeDNRRule({
        condition: {},
      })).toEqual({
        condition: {},
      });
      expect(normalizeDNRRule({
        condition: {
          urlFilter: 'test',
        },
      })).toEqual({
        condition: {
          urlFilter: 'test',
          isUrlFilterCaseSensitive: false,
        },
      });
    });

    it("removes trailing *", () => {
      expect(normalizeDNRRule({
        condition: {
          urlFilter: "test*",
        },
      })).toEqual({
        condition: {
          isUrlFilterCaseSensitive: false,
          urlFilter: "test",
        },
      });
    })
  })


  it('wraps regex rules in //', () => {
    expect(normalizeDNRRule({
      condition: {
        regexFilter: 'test',
      },
    })).toEqual({
      condition: {
        regexFilter: '/test/',
      },
    });
  });
});

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
