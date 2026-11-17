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

    async function convertRedirects(...filters: string[]) {
      const { rules, errors } = await convertWithAdguard(filters, { resourcesPath });
      return {
        errors,
        resources: rules.map((rule) =>
          rule.action.redirect?.extensionPath?.slice(resourcesPath.length + 1),
        ),
      };
    }

    it('translates a resource AdGuard has', async () => {
      assert.deepEqual(await convertRedirects('||example.com/a.js$redirect=noopjs'), {
        errors: [],
        resources: ['noop.js'],
      });
    });

    it('keeps a resource AdGuard does not have', async () => {
      assert.deepEqual(await convertRedirects('||example.com/a.js$redirect=outbrain-widget.js'), {
        errors: [],
        resources: ['outbrain-widget.js'],
      });
    });

    it('resolves aliases AdGuard does not have', async () => {
      assert.deepEqual(
        await convertRedirects(
          '||example.com/a.js$redirect=widgets.outbrain.com/outbrain.js',
          '||example.com/b.js$redirect=google-analytics.com/ga.js',
          '||example.com/c.js$redirect=google-ima3-dai',
        ),
        {
          errors: [],
          resources: ['outbrain-widget.js', 'google-analytics_ga.js', 'google-ima-dai.js'],
        },
      );
    });

    it('finds the option after a negated one', async () => {
      assert.deepEqual(
        await convertRedirects('||example.com/a.js$~third-party,redirect=outbrain-widget.js'),
        {
          errors: [],
          resources: ['outbrain-widget.js'],
        },
      );
    });

    it('ignores the priority', async () => {
      assert.deepEqual(
        await convertRedirects(
          '||example.com/a.js$redirect=noop.js:5',
          '||example.com/b.js$redirect=outbrain-widget.js:5',
        ),
        {
          errors: [],
          resources: ['noop.js', 'outbrain-widget.js'],
        },
      );
    });

    it('converts the rest of the filter', async () => {
      const { rules, errors } = await convertWithAdguard(
        ['||example.com/a.js$script,3p,redirect=outbrain-widget.js,domain=foo.com'],
        { resourcesPath },
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(normalize(rules[0]), {
        action: {
          type: 'redirect',
          redirect: {
            extensionPath: '/rule_resources/redirects/outbrain-widget.js',
          },
        },
        condition: {
          domainType: 'thirdParty',
          initiatorDomains: ['foo.com'],
          resourceTypes: ['script'],
          urlFilter: '||example.com/a.js',
        },
      });
    });

    it('reports an unknown resource', async () => {
      assert.deepEqual(
        await convertRedirects(
          '||example.com/a.js$redirect=typo.js',
          '||example.com/b.js$script,redirect=typo.js',
        ),
        {
          errors: [
            'Error: Unknown redirect resource "typo.js" in the rule: "||example.com/a.js$redirect=typo.js"',
            'Error: Unknown redirect resource "typo.js" in the rule: "||example.com/b.js$script,redirect=typo.js"',
          ],
          resources: [],
        },
      );
    });

    it('does not take the pattern for an option', async () => {
      const { rules, errors } = await convertWithAdguard(['||example.com/?redirect=typo.js']);
      assert.deepEqual(errors, []);
      assert.equal(rules.length, 1);
      assert.equal(rules[0].action.type, 'block');
    });

    it('converts a list with different resources', async () => {
      const { rules, errors } = await convertWithAdguard(
        [
          '||example.com/a.js$redirect=outbrain-widget.js',
          '||example.com/b.js',
          '||example.com/c.js$redirect=typo.js',
          '||example.com/d.js$redirect=noopjs',
          '||example.com/e.js$redirect=chartbeat.js',
          '||example.com/f.js$redirect=outbrain-widget.js',
        ],
        { resourcesPath },
      );
      assert.equal(errors.length, 1);
      assert.deepEqual(
        Object.fromEntries(
          rules.map((rule) => [
            rule.condition.urlFilter,
            rule.action.redirect?.extensionPath ?? rule.action.type,
          ]),
        ),
        {
          '||example.com/a.js': '/rule_resources/redirects/outbrain-widget.js',
          '||example.com/b.js': 'block',
          '||example.com/d.js': '/rule_resources/redirects/noop.js',
          '||example.com/e.js': '/rule_resources/redirects/chartbeat.js',
          '||example.com/f.js': '/rule_resources/redirects/outbrain-widget.js',
        },
      );
      assert.deepEqual(rules.map((rule) => rule.id).sort(), [1, 2, 3, 4, 5]);
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
      for (const rule of rules) {
        const name = names[Number(rule.condition.urlFilter.split('/')[1])] ?? '';
        const file = rule.action.redirect.extensionPath.slice(resourcesPath.length + 1);
        const { adg, ubo } = mapping[name] ?? {};
        assert.ok(adg ? files.has(file) : file === ubo, `"${name}" redirects to "${file}"`);
      }
    });
  });
});
