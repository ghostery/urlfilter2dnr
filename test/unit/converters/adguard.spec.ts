import { describe, it } from 'mocha';
import assert from 'node:assert/strict';

import convertWithAdguard from '../../../src/converters/adguard.js';
import { mockChromeApi } from '../../../src/converters/helpers.js';
import resourceMapping from '../../../src/mappings.js';

import { normalize } from '../helpers.js';

describe('adguard converter', () => {
  before(mockChromeApi);

  it('should not crash on unsupported rules', async () => {
    const { rules, errors } = await convertWithAdguard(['/(?>ab)c/']);
    assert.equal(errors.length, 1);
    assert.deepEqual(rules, []);
  });

  it('should not crash with no rules', async () => {
    const { rules, errors } = await convertWithAdguard([]);
    assert.equal(errors.length, 0);
    assert.deepEqual(rules, []);
  });

  it('||fastlane.rubiconproject.com^$removeparam,domain=aternos.org', async () => {
    const { rules, errors } = await convertWithAdguard([
      '||fastlane.rubiconproject.com^$removeparam,domain=aternos.org',
    ]);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
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
    });
  });

  it('||t.a3cloud.net/AM-141112/tag.js', async () => {
    const { rules, errors } = await convertWithAdguard(['||t.a3cloud.net/AM-141112/tag.js']);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
      action: {
        type: 'block',
      },
      condition: {
        urlFilter: '||t.a3cloud.net/am-141112/tag.js',
      },
    });
  });

  // to be fixed with https://github.com/AdguardTeam/tsurlfilter/pull/109
  it('/baynote(-observer)?([0-9]+).js/', async () => {
    const { rules, errors } = await convertWithAdguard([
      String.raw`/baynote(-observer)?([0-9]+)\.js/`,
    ]);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: String.raw`baynote(-observer)?([0-9]+)\.js`,
      },
    });
  });

  it('handles regexp with ?', async () => {
    const { rules, errors } = await convertWithAdguard(['/a?/']);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: 'a?',
      },
    });
  });

  it('handles regexp escaping', async () => {
    const { rules, errors } = await convertWithAdguard([String.raw`/\\d/$doc`]);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: String.raw`\\d`,
        resourceTypes: ['main_frame'],
      },
    });
  });

  it('always populates urlFilter', async () => {
    const { rules, errors } = await convertWithAdguard([
      `*$xhr,removeparam=ad_config_id,domain=telequebec.tv`,
    ]);
    assert.equal(errors.length, 0);
    assert.deepEqual(normalize(rules[0]), {
      action: {
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              removeParams: ['ad_config_id'],
            },
          },
        },
      },
      condition: {
        initiatorDomains: ['telequebec.tv'],
        resourceTypes: ['xmlhttprequest'],
        urlFilter: '**^ad_config_id=',
      },
    });
  });

  describe('with redirect param', () => {
    const resourcesPath = '/rule_resources/redirects';

    it('redirects to resources only uBO has', async () => {
      const { rules, errors } = await convertWithAdguard(
        [
          '||example.com/a.js$redirect=outbrain-widget.js',
          '||example.com/b.js$script,redirect=chartbeat.js:5,domain=foo.com',
          '||example.com/c.js?d,redirect=noop.js$redirect=hd-main.js',
        ],
        { resourcesPath },
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(
        rules.map((rule) => rule.action.redirect.extensionPath),
        [
          '/rule_resources/redirects/outbrain-widget.js',
          '/rule_resources/redirects/chartbeat.js',
          '/rule_resources/redirects/hd-main.js',
        ],
      );
    });

    it('reports an unknown resource', async () => {
      const { rules, errors } = await convertWithAdguard([
        '||example.com/a.js$redirect=typo.js',
        '||example.com/b.js',
      ]);
      assert.deepEqual(errors, [
        'Error: Unknown redirect resource "typo.js" in the rule: "||example.com/a.js$redirect=typo.js"',
      ]);
      assert.deepEqual(
        rules.map((rule) => rule.condition.urlFilter),
        ['||example.com/b.js'],
      );
    });

    it('redirects every known resource to a file uBO has', async () => {
      const mapping: Record<string, { adg?: string; ubo?: string }> = resourceMapping;
      const names = Object.keys(mapping);
      const files = new Set(Object.values(mapping).map(({ ubo }) => ubo));

      const { rules, errors } = await convertWithAdguard(
        names.map((name, index) => `||example.com/${index}$redirect=${name}`),
        { resourcesPath },
      );

      assert.deepEqual(errors, []);
      assert.equal(rules.length, names.length);
      for (const [index, name] of names.entries()) {
        const file = rules[index].action.redirect.extensionPath.slice(resourcesPath.length + 1);
        const { adg, ubo } = mapping[name] ?? {};
        assert.ok(adg ? files.has(file) : file === ubo, `"${name}" redirects to "${file}"`);
      }
    });
  });
});
