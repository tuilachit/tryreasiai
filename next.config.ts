import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function getGitRevision(): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  });
  const stdout = result.stdout?.trim();
  if (result.status === 0 && stdout) {
    return stdout;
  }
  return randomUUID();
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/", revision: getGitRevision() }],
});

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default withSerwist(nextConfig);
