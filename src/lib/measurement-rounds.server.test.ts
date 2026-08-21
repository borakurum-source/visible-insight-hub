import { describe, expect, it } from "vitest";
import { promptSetFingerprint } from "./measurement-rounds.server";

describe("promptSetFingerprint", () => {
  it("is stable across ordering and duplicate ids", () => {
    expect(promptSetFingerprint(["b", "a", "a"])).toBe(promptSetFingerprint(["a", "b"]));
  });

  it("changes when the measured prompt set changes", () => {
    expect(promptSetFingerprint(["a", "b"])).not.toBe(promptSetFingerprint(["a", "c"]));
  });
});
