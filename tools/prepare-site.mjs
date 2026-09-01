import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDir = resolve(root, ".astro-public");
const assets = [
  "fertig.css",
  "fertig.min.css",
  "site.css",
  "site.js",
  "favicon.svg",
  "icons.svg",
  "og.png",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
];

await mkdir(publicDir, { recursive: true });
await Promise.all(
  assets.map((asset) => copyFile(resolve(root, asset), resolve(publicDir, asset))),
);
