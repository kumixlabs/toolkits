import { describe, expect, it } from "vitest";
import { cuid, customeId, nanoid, uid } from "../../src/index";

describe("Crypto", () => {
  it("cuid should generate unique id", () => {
    const a = cuid();
    const b = cuid();
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
    expect(a).not.toBe(b);
  });

  it("customeId should honor prefix and length", () => {
    const id = customeId("user_", 10);
    expect(id.startsWith("user_")).toBe(true);
    expect(id.length).toBe("user_".length + 10);
  });

  it("nanoid should generate requested length", () => {
    const a = nanoid();
    const b = nanoid(12);
    expect(a.length).toBe(7);
    expect(b.length).toBe(12);
    expect(/^[0-9A-Za-z]+$/.test(b)).toBe(true);
  });

  it("uid should return numeric string", () => {
    const u = uid();
    expect(/^[0-9]+$/.test(u)).toBe(true);
  });
});
