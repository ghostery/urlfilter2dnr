import { describe, it } from 'node:test';
import assert from 'node:assert';

import convertWithAdguard from '../../../src/converters/adguard.js';

global.chrome = {
  runtime: {
    lastError: null,
  },
  declarativeNetRequest: {
    isRegexSupported: (_, callback) => callback({ isSupported: true }),
  },
};

describe('adguard converter', () => {
  it('||t.a3cloud.net/AM-141112/tag.js', async () => {
    const { rules } = await convertWithAdguard(['||t.a3cloud.net/AM-141112/tag.js']);
    assert.deepStrictEqual(rules[0], {
      action: {
        type: 'block',
      },
      id: 1,
      priority: 1,
      condition: {
        urlFilter: '||t.a3cloud.net/am-141112/tag.js',
      },
    });
  });

  // to be fixed with https://github.com/AdguardTeam/tsurlfilter/pull/109
  it('/baynote(-observer)?([0-9]+).js/', async () => {
    const { rules } = await convertWithAdguard([String.raw`/baynote(-observer)?([0-9]+)\.js/`]);
    assert.deepStrictEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: String.raw`baynote(-observer)?([0-9]+)\.js`,
      },
      id: 1,
      priority: 1,
    });
  });

  it('handles regexp with ?', async () => {
    const { rules } = await convertWithAdguard(['/a?/']);
    assert.deepStrictEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: 'a?',
      },
      id: 1,
      priority: 1,
    });
  });

  it('handles regexp escaping', async () => {
    const { rules } = await convertWithAdguard([String.raw`/\\d/$doc`]);
    assert.deepStrictEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: String.raw`\\d`,
        resourceTypes: ['main_frame'],
      },
      id: 1,
      priority: 101,
    });
  });
});
