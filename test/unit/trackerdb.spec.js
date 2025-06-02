import { test } from 'node:test';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import loadTrackerDB from '@ghostery/trackerdb';
import { detectFilterType } from '@cliqz/adblocker';

import { ROOT_PATH } from '../../scripts/helpers/paths.js';
import { testRule } from './helpers.js';

const engine = readFileSync(
  path.join(ROOT_PATH, 'node_modules', '@ghostery', 'trackerdb', 'dist', 'trackerdb.engine'),
);
const trackerDB = await loadTrackerDB(engine);

const UNSUPPORTED_FILTERS = [
  '/baynote(-observer)?([0-9]+)\\.js/',
  '/facebook\\.com\\/(v2\\.0\\/)?(plugins|widgets)\\/.*\\.php/',
];

test('TrackerDB filters', async () => {
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
