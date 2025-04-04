import { describe, it, expect } from 'bun:test';

import { normalizeFilter, normalizeRule } from '../../../src/converters/helpers.js';

describe('normalizeFilter', () => {
  it('format params', () => {
    expect(
      normalizeFilter('||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch'),
    ).toEqual('||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch');

    expect(normalizeFilter('||test$param1$params2$param3')).toEqual(
      '||test$param1,params2,param3',
    );
  });

  it('replaces 3p with third-party', () => {
    expect(normalizeFilter('||tinypass.com^$3p,domain=~foreignpolicy.com')).toEqual(
      '||tinypass.com^$third-party,domain=~foreignpolicy.com',
    );
  });

  it('removes duplicate params', () => {
    expect(normalizeFilter('||tealiumiq.com^$3p$third-party')).toEqual(
      '||tealiumiq.com^$third-party',
    );
  });

  describe('with case-sesitive filters', () => {
    it('is casesensitive by default', () => {
      expect(normalizeFilter('TEST')).toEqual('test');
    });

    it('keeps the case with match-case param', () => {
      expect(normalizeFilter('TEST$match-case')).toEqual('TEST$match-case');
    });
  });

  describe('with redirect param', () => {
    it('replaces values with slashes', () => {
      expect(normalizeFilter('test$redirect=scorecardresearch_beacon.js')).toEqual(
        'test$redirect=scorecardresearch-beacon',
      );
      expect(normalizeFilter('test$redirect-rule=3x2.png')).toEqual(
        'test$redirect-rule=3x2-transparent.png',
      );
    });

    it('replaces resulting extension path', () => {
      expect(
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
              'isUrlFilterCaseSensitive': false,
            },
            'priority': 1001,
          },
          { resourcesPath: '/rule_resources/redirects' },
        ),
      ).toEqual({
        'id': 1,
        'action': {
          'type': 'redirect',
          'redirect': {
            'extensionPath': '/rule_resources/redirects/empty',
          },
        },
        'condition': {
          'urlFilter': '||foo.com/files^',
          'isUrlFilterCaseSensitive': false,
        },
        'priority': 1001,
      });
    });
  });
});

describe('normalizeRule', () => {
  it('does nothing for empty rules', () => {
    expect(normalizeRule(undefined)).toEqual(undefined);
  });

  describe('with urlFilter', () => {
    it('sets isUrlFilterCaseSensitive default value', () => {
      expect(
        normalizeRule({
          condition: {},
        }),
      ).toEqual({
        condition: {},
      });
      expect(
        normalizeRule({
          condition: {
            urlFilter: 'test',
          },
        }),
      ).toEqual({
        condition: {
          urlFilter: 'test',
          isUrlFilterCaseSensitive: false,
        },
      });
    });

    it('removes trailing *', () => {
      expect(
        normalizeRule({
          condition: {
            urlFilter: 'test*',
          },
        }),
      ).toEqual({
        condition: {
          isUrlFilterCaseSensitive: false,
          urlFilter: 'test',
        },
      });
    });
  });

  it('does not wraps regex rules in //', () => {
    expect(
      normalizeRule({
        condition: {
          regexFilter: 'test',
        },
      }),
    ).toEqual({
      condition: {
        regexFilter: 'test',
      },
    });
  });

  it('replaces domains with initiatorDomains', () => {
    expect(
      normalizeRule({
        condition: {
          domains: ['test'],
        },
      }),
    ).toEqual({
      condition: {
        initiatorDomains: ['test'],
      },
    });
  });

  it('replaces excludedDomains with excludedInitiatorDomains', () => {
    expect(
      normalizeRule({
        condition: {
          excludedDomains: ['test'],
        },
      }),
    ).toEqual({
      condition: {
        excludedInitiatorDomains: ['test'],
      },
    });
  });
});
