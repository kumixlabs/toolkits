import { describe, expect, it } from "vitest";
import { chunk, randomValue, stableSort } from "../../src/index";

describe("Array", () => {
  it("chunk should split arrays by size", () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7, 8], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8],
    ]);
    expect(chunk(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it("chunk should handle edge sizes", () => {
    const arr = [1, 2, 3];
    expect(chunk(arr, 0).length).toBe(0);
    const negativeChunk = chunk(arr, -1);
    expect(negativeChunk.length).toBe(1);
    expect(negativeChunk[0]).toEqual([1]);
  });

  it("randomValue returns element or undefined", () => {
    const items = ["x", "y", "z"];
    const r = randomValue(items);
    expect(r === undefined || items.includes(r)).toBe(true);
    expect(randomValue([])).toBeUndefined();
  });

  it("stableSort preserves order of equals", () => {
    const input = [
      { v: 1, i: 0 },
      { v: 0, i: 1 },
      { v: 0, i: 2 },
    ];
    const sorted = stableSort(input, (a, b) => a.v - b.v);
    expect(sorted[0].i).toBe(1);
    expect(sorted[1].i).toBe(2);
    expect(sorted[2].i).toBe(0);
  });
});
