import { describe, it } from 'mocha';
import assert from 'node:assert/strict';

import { normalizeFilter, normalizeRule } from '../../../src/converters/helpers.js';

describe('normalizeFilter', () => {
  it('format params', () => {
    assert.equal(
      normalizeFilter('||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch'),
      '||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch',
    );
  });

  context('rewrites modifier options', () => {
    it('replaces 3p with third-party', () => {
      assert.equal(
        normalizeFilter('||tinypass.com^$3p,domain=~foreignpolicy.com'),
        '||tinypass.com^$third-party,domain=~foreignpolicy.com',
      );
    });

    it('replaces xhr with xmlhttprequest', () => {
      assert.equal(
        normalizeFilter('||bar.com^$xhr'),
        '||bar.com^$xmlhttprequest',
      );
    });

    it('replaces frame with subdocument', () => {
      assert.equal(
        normalizeFilter('||bar.com^$frame'),
        '||bar.com^$subdocument',
      );
    });

    it('replaces from with domains', () => {
      assert.equal(
        normalizeFilter('||bar.com^$from=foo.com'),
        '||bar.com^$domain=foo.com',
      );
    });

    it('replaces from with domains', () => {
      assert.equal(
        normalizeFilter('||bar.com^$from=foo.com'),
        '||bar.com^$domain=foo.com',
      );
    });
  });

  it('removes duplicate params', () => {
    assert.equal(
      normalizeFilter('||tealiumiq.com^$3p,third-party'),
      '||tealiumiq.com^$third-party',
    );
  });

  it('finds modifier start index', () => {
    assert.equal(
      normalizeFilter(
        String.raw`/\.[a-z]{2,6}\/[0-9a-zA-Z]{5,7}\.js$/$script,3p,match-case,from=analdin.com|bestjavporn.com|ero-anime.website|hdpornflix.com|javdock.com|javtiful.com|onscreens.me|supjav.com`,
      ),
      String.raw`/\.[a-z]{2,6}\/[0-9a-zA-Z]{5,7}\.js$/$script,third-party,match-case,domain=analdin.com|bestjavporn.com|ero-anime.website|hdpornflix.com|javdock.com|javtiful.com|onscreens.me|supjav.com`,
    );
  })

  describe('with redirect param', () => {
    it('replaces values with slashes', () => {
      assert.equal(
        normalizeFilter('test$redirect=scorecardresearch_beacon.js'),
        'test$redirect=scorecardresearch-beacon',
      );
      assert.equal(
        normalizeFilter('test$redirect-rule=3x2.png'),
        'test$redirect-rule=3x2-transparent.png',
      );
    });

    it('replaces resulting extension path', () => {
      assert.deepEqual(
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

    assert.deepEqual(normalizedRule, rule);
  });

  it('does nothing for empty rules', () => {
    assert.equal(normalizeRule(undefined), undefined);
  });

  describe('with urlFilter', () => {
    it('sets isUrlFilterCaseSensitive default value', () => {
      assert.deepEqual(
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
      assert.deepEqual(
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
      assert.deepEqual(
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
    assert.deepEqual(
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
    assert.deepEqual(
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
    assert.deepEqual(
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
