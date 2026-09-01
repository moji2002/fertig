import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import packageJson from "../../package.json";

const hash = (file: string) =>
  createHash("sha256")
    .update(readFileSync(resolve(process.cwd(), file)))
    .digest("hex")
    .slice(0, 8);

export const site = {
  version: packageJson.version,
  hashes: {
    fertig: hash("fertig.css"),
    site: hash("site.css"),
    script: hash("site.js"),
  },
} as const;
