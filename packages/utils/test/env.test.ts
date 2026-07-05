import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEnv } from "../src/env";

describe("getEnv", () => {
  const original = process.env.KUMIX_TEST_ENV_VAR;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.KUMIX_TEST_ENV_VAR;
    } else {
      process.env.KUMIX_TEST_ENV_VAR = original;
    }
  });

  it("reads from process.env", () => {
    process.env.KUMIX_TEST_ENV_VAR = "value1";
    expect(getEnv("KUMIX_TEST_ENV_VAR")).toBe("value1");
  });

  it("returns fallback when unset", () => {
    delete process.env.KUMIX_TEST_ENV_VAR;
    expect(getEnv("KUMIX_TEST_ENV_VAR", "fallback")).toBe("fallback");
  });

  it("returns undefined when unset and no fallback", () => {
    delete process.env.KUMIX_TEST_ENV_VAR;
    expect(getEnv("KUMIX_TEST_ENV_VAR")).toBeUndefined();
  });

  it("uses fallback for empty string values", () => {
    process.env.KUMIX_TEST_ENV_VAR = "";
    expect(getEnv("KUMIX_TEST_ENV_VAR", "fb")).toBe("fb");
  });
});
