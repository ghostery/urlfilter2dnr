import { describe, it, expect } from "bun:test";

import { normalizeFilter } from "../../../src/converters/helpers.js";

describe("normalizeFilter", () => {
  it("format params", () => {
    expect(
      normalizeFilter(
        "||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch"
      )
    ).toEqual(
      "||tags.tiqcdn.com^$script,domain=firstdirect.com|santander.pl|swisscom.ch"
    );

    expect(
      normalizeFilter(
        "||test$param1$params2$param3"
      )
    ).toEqual(
      "||test$param1,params2,param3"
    );
  });

  it("replaces 3p with third-party", () => {
    expect(
      normalizeFilter("||tinypass.com^$3p,domain=~foreignpolicy.com")
    ).toEqual("||tinypass.com^$third-party,domain=~foreignpolicy.com")
  });

  it("removes duplicate params", () => {
    expect(
      normalizeFilter("||tealiumiq.com^$3p$third-party")
    ).toEqual("||tealiumiq.com^$third-party")
  });

  describe("with case-sesitive filters", () => {
    it("is casesensitive by default", () => {
      expect(
        normalizeFilter("TEST")
      ).toEqual("test");
    });

    it("keeps the case with match-case param", () => {
      expect(
        normalizeFilter("TEST$match-case")
      ).toEqual("TEST$match-case");
    });
  });
});
