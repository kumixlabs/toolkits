import { describe, expect, it } from "vitest";

import { getSizeAvatar, getUserName } from "../../src/functions/string/auth";

describe("getSizeAvatar", () => {
  it("returns size-6 for sm", () => {
    expect(getSizeAvatar("sm")).toBe("size-6");
  });

  it("returns size-10 for lg", () => {
    expect(getSizeAvatar("lg")).toBe("size-10");
  });

  it("returns size-8 as default", () => {
    expect(getSizeAvatar(null)).toBe("size-8");
    expect(getSizeAvatar(undefined)).toBe("size-8");
    expect(getSizeAvatar("md")).toBe("size-8");
  });
});

describe("getUserName", () => {
  it("prefers name", () => {
    expect(getUserName({ name: "Alice", username: "a" })).toBe("Alice");
  });

  it("falls back to displayUsername", () => {
    expect(getUserName({ displayUsername: "disp", username: "u" })).toBe("disp");
  });

  it("falls back to username", () => {
    expect(getUserName({ username: "user1" })).toBe("user1");
  });

  it("falls back to email", () => {
    expect(getUserName({ email: "u@x.com" })).toBe("u@x.com");
  });

  it("returns undefined for null user", () => {
    expect(getUserName(null)).toBeUndefined();
    expect(getUserName(undefined)).toBeUndefined();
  });
});
