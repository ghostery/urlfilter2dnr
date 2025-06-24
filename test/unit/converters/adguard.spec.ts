import { describe, it } from 'mocha';
import assert from 'node:assert';

import convertWithAdguard from '../../../src/converters/adguard.js';
import { normalize } from '../helpers.js';

describe('adguard converter', () => {
  it('should not crash on unsupported rules', async () => {
    const { rules, errors } = await convertWithAdguard(['/(?>ab)c/']);
    assert.equal(errors.length, 1);
    assert.deepStrictEqual(rules, []);
  });

  it('should not crash with no rules', async () => {
    const { rules, errors } = await convertWithAdguard([]);
    assert.equal(errors.length, 0);
    assert.deepStrictEqual(rules, []);
  });

  it('||fastlane.rubiconproject.com^$removeparam,domain=aternos.org', async () => {
    const { rules, errors } = await convertWithAdguard([
      '||fastlane.rubiconproject.com^$removeparam,domain=aternos.org',
    ]);
    assert.equal(errors.length, 0);
    assert.deepStrictEqual(normalize(rules[0]), {
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
    assert.deepStrictEqual(normalize(rules[0]), {
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
    const { rules, errors } = await convertWithAdguard([String.raw`/baynote(-observer)?([0-9]+)\.js/`]);
    assert.equal(errors.length, 0);
    assert.deepStrictEqual(normalize(rules[0]), {
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
    assert.deepStrictEqual(normalize(rules[0]), {
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
    assert.deepStrictEqual(normalize(rules[0]), {
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
    assert.deepStrictEqual(normalize(rules[0]), {
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
        urlFilter: '*',
        initiatorDomains: ['telequebec.tv'],
        resourceTypes: ['xmlhttprequest'],
      },
    });
  });
});
