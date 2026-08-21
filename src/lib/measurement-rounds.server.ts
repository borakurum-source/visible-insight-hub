import { createHash } from "node:crypto";

export function promptSetFingerprint(promptIds: string[]): string {
  return createHash("sha256")
    .update([...new Set(promptIds)].sort().join("\n"))
    .digest("hex");
}
