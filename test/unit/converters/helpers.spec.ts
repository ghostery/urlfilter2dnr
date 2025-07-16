import { describe, it } from 'mocha';
import assert from 'node:assert';

import { normalizeFilter, normalizeRule } from '../../../src/converters/helpers.js';

describe('normalizeFilter', () => {
  it('format params', () => {
    assert.strictEqual(
      normalizeFilter('||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch'),
      '||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch',
    );

    assert.strictEqual(
      normalizeFilter('||test$param1$params2$param3'),
      '||test$param1,params2,param3',
    );
  });

  it('replaces 3p with third-party', () => {
    assert.strictEqual(
      normalizeFilter('||tinypass.com^$3p,domain=~foreignpolicy.com'),
      '||tinypass.com^$third-party,domain=~foreignpolicy.com',
    );
  });

  it('removes duplicate params', () => {
    assert.strictEqual(
      normalizeFilter('||tealiumiq.com^$3p$third-party'),
      '||tealiumiq.com^$third-party',
    );
  });

  describe('with case-sesitive filters', () => {
    it('is casesensitive by default', () => {
      assert.strictEqual(normalizeFilter('TEST'), 'test');
    });

    it('keeps the case with match-case param', () => {
      assert.strictEqual(normalizeFilter('TEST$match-case'), 'TEST$match-case');
    });
  });

  describe('with redirect param', () => {
    it('replaces values with slashes', () => {
      assert.strictEqual(
        normalizeFilter('test$redirect=scorecardresearch_beacon.js'),
        'test$redirect=scorecardresearch-beacon',
      );
      assert.strictEqual(
        normalizeFilter('test$redirect-rule=3x2.png'),
        'test$redirect-rule=3x2-transparent.png',
      );
    });

    it('replaces resulting extension path', () => {
      assert.deepStrictEqual(
        normalizeRule(
          {
            'id': 1,
            'action': {
              'type': 'redirect',
              'redirect': {
                'extensionPath': '/rule_resources/redirects/nooptext.js',
              },
            },
            'condition': {
              'urlFilter': '||foo.com/files^',
            },
            'priority': 1001,
          },
          { resourcesPath: '/rule_resources/redirects' },
        ),
        {
          'id': 1,
          'action': {
            'type': 'redirect',
            'redirect': {
              'extensionPath': '/rule_resources/redirects/empty',
            },
          },
          'condition': {
            'urlFilter': '||foo.com/files^',
          },
          'priority': 1001,
        },
      );
    });
  });
});

describe('normalizeRule', () => {
  it('handles removeparam rules', () => {
    const rule = {
      action: {
        redirect: {
          transform: {
            query: '',
          },
        },
        type: 'redirect',
      },
      condition: {
        initiatorDomains: ['aternos.org'],
        resourceTypes: ['main_frame', 'sub_frame'],
        urlFilter: '||fastlane.rubiconproject.com^',
      },
      id: 130097215,
      priority: 201,
    };

    const normalizedRule = normalizeRule(rule);

    assert.deepStrictEqual(normalizedRule, rule);
  });

  it('does nothing for empty rules', () => {
    assert.strictEqual(normalizeRule(undefined), undefined);
  });

  describe('with urlFilter', () => {
    it('sets isUrlFilterCaseSensitive default value', () => {
      assert.deepStrictEqual(
        normalizeRule({
          condition: {
            isUrlFilterCaseSensitive: false,
          },
          action: {
            type: 'block',
          },
        }),
        {
          condition: {},
          action: {
            type: 'block',
          },
        },
      );
      assert.deepStrictEqual(
        normalizeRule({
          condition: {
            urlFilter: 'test',
            isUrlFilterCaseSensitive: true,
          },
          action: {
            type: 'block',
          },
        }),
        {
          condition: {
            urlFilter: 'test',
            isUrlFilterCaseSensitive: true,
          },
          action: {
            type: 'block',
          },
        },
      );
    });

    it('removes trailing *', () => {
      assert.deepStrictEqual(
        normalizeRule({
          condition: {
            urlFilter: 'test*',
          },
          action: {
            type: 'block',
          },
        }),
        {
          condition: {
            urlFilter: 'test',
          },
          action: {
            type: 'block',
          },
        },
      );
    });
  });

  it('does not wraps regex rules in //', () => {
    assert.deepStrictEqual(
      normalizeRule({
        condition: {
          regexFilter: 'test',
        },
        action: {
          type: 'block',
        },
      }),
      {
        condition: {
          regexFilter: 'test',
        },
        action: {
          type: 'block',
        },
      },
    );
  });

  it('replaces domains with initiatorDomains', () => {
    assert.deepStrictEqual(
      normalizeRule({
        condition: {
          domains: ['test'],
        },
        action: {
          type: 'block',
        },
      }),
      {
        condition: {
          initiatorDomains: ['test'],
        },
        action: {
          type: 'block',
        },
      },
    );
  });

  it('replaces excludedDomains with excludedInitiatorDomains', () => {
    assert.deepStrictEqual(
      normalizeRule({
        condition: {
          excludedDomains: ['test'],
        },
        action: {
          type: 'block',
        },
      }),
      {
        condition: {
          excludedInitiatorDomains: ['test'],
        },
        action: {
          type: 'block',
        },
      },
    );
  });
});
