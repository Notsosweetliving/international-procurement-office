import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pngSize = (path: string) => {
  const image = readFileSync(path);
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
    colorType: image[25],
  };
};

test("IPO favicon variants have the required dimensions and transparency", () => {
  for (const [path, size] of [
    ["public/ipo-icon-16.png", 16],
    ["public/ipo-icon-32.png", 32],
    ["app/apple-icon.png", 180],
    ["public/ipo-icon-192.png", 192],
    ["app/icon.png", 512],
    ["public/ipo-icon-512.png", 512],
  ] as const) {
    assert.deepEqual(pngSize(path), {
      width: size,
      height: size,
      colorType: 6,
    });
  }
  const favicon = readFileSync("app/favicon.ico");
  assert.equal(favicon.readUInt16LE(4), 2);
});

test("manifest references only IPO web-app icons", () => {
  const manifest = readFileSync("app/manifest.ts", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(manifest, /ipo-icon-192\.png/);
  assert.match(manifest, /ipo-icon-512\.png/);
  assert.doesNotMatch(`${manifest}\n${layout}`, /vercel\.svg|triangle|favicon-old/i);
});
