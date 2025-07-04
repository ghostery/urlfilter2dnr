import { describe, it } from 'mocha';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import loadTrackerDB from '@ghostery/trackerdb';
import { detectFilterType } from '@ghostery/adblocker';

import { ROOT_PATH } from '../../scripts/page/helpers/paths.js';
import { testRule } from './helpers.js';

const UNSUPPORTED_FILTERS = [
  '/baynote(-observer)?([0-9]+)\\.js/',
  '/facebook\\.com\\/(v2\\.0\\/)?(plugins|widgets)\\/.*\\.php/',
];

describe('TrackerDB filters', () => {
  it('verify filters', async () => {
    const engine = readFileSync(
      path.join(ROOT_PATH, 'node_modules', '@ghostery', 'trackerdb', 'dist', 'trackerdb.engine'),
    );
    const trackerDB = await loadTrackerDB(engine);

    for (const pattern of trackerDB.engine.metadata.getPatterns()) {
      for (const filter of pattern.filters) {
        if (
          UNSUPPORTED_FILTERS.includes(filter) ||
          // not supported - https://gitlab.com/eyeo/adblockplus/abc/webext-ad-filtering-solution/-/issues/572
          filter.includes('.*') ||
          // ignore cosmetic filters
          detectFilterType(filter) === 2
        ) {
          continue;
        }
        await testRule(filter);
      }
    }
  });
});
