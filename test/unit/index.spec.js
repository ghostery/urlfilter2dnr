import { describe, it } from 'mocha';

import { testRule } from './helpers.js';

describe('converters', () => {
  it('generate same rules', async () => {
    await testRule('||domain.com');
    await testRule('@@||domain.com');
    await testRule(String.raw`/.*domain.com/`);
  });
});
