import { describe, it, expect } from "bun:test";

import convertWithAdguard from '../../../src/converters/adguard.js';

describe('adguard converter', () => {
  it("||t.a3cloud.net/AM-141112/tag.js", async () => {
    const [rule1] = await convertWithAdguard(['||t.a3cloud.net/AM-141112/tag.js']);
    expect(rule1).toEqual({
      action: {
        type: "block"
      },
      id: 1,
      priority: 1,
      condition: {
        isUrlFilterCaseSensitive: false,
        urlFilter: "||t.a3cloud.net/am-141112/tag.js"
      }
    });
  });

  // to be fixed with https://github.com/AdguardTeam/tsurlfilter/pull/109
  it.skip("/baynote(-observer)?([0-9]+)\.js/", async () => {
    const [rule1] = await convertWithAdguard(['/baynote(-observer)?([0-9]+)\.js/']);
    expect(rule1).toEqual({
      action: {
        type: "block"
      },
      condition: {
        isUrlFilterCaseSensitive: false,
        regexFilter: "/baynote(-observer)?([0-9]+)\.js/"
      },
      id: 1,
      priority: 1
    });
  });

  it.skip("handles regexp with ?", async () => {
    const [rule1] = await convertWithAdguard(['/a?/']);
    expect(rule1).toEqual({
      action: {
        type: "block"
      },
      condition: {
        isUrlFilterCaseSensitive: false,
        regexFilter: "/a?/"
      },
      id: 1,
      priority: 1
    });
  });
});
