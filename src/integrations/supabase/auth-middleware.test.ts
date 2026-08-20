import { describe, expect, it } from "vitest";
import { createAuthClientOptions } from "./auth-middleware";

describe("Supabase auth middleware client", () => {
  it("uses the onecite schema for authenticated server queries", () => {
    const options = createAuthClientOptions("publishable-key", "jwt-token");

    expect(options.db).toEqual({ schema: "onecite" });
    expect(options.global?.headers).toEqual({ Authorization: "Bearer jwt-token" });
  });
});
