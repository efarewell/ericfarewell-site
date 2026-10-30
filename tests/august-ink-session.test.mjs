import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {captureInk, keepInk} from "../augustsignature/ink-session.mjs";
test("August's session comparison preserves genuine strokes and labels memory peeks", () => {
  const strokes = [{size: 3, points: [{x: .2, y: .2}, {x: .6, y: .7}]}];
  const first = captureInk(strokes, {width: 600, height: 240, mode: "trace", guideVisible: true});
  const later = captureInk(strokes, {width: 600, height: 240, mode: "memory", guideVisible: true});
  const comparison = keepInk(keepInk(null, first), later);
  assert.equal(comparison.first, first); assert.equal(comparison.latest, later);
  assert.equal(first.paths[0].d, "M200 80 L600 280");
  assert.match(later.label, /reference shown/);
  assert.equal(captureInk([], {width: 600, height: 240, mode: "trace"}), null);
});
test("practice journal stays out of browser persistence and AI payloads; focus and paper are explicit controls", async () => {
  const js = await readFile(new URL("../augustsignature/studio.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../augustsignature/index.html", import.meta.url), "utf8");
  const saved = js.match(/localStorage\.setItem\(storageKey,JSON\.stringify\(([^;]+)\)\)/)?.[1];
  assert.ok(saved); assert.doesNotMatch(saved, /inkComparisons|strokes|captureInk/);
  assert.match(js, /if\(!freeMode && index<4\)return/);
  assert.match(js, /inkComparisons\.delete\(id\)/);
  assert.match(js, /inkComparisons\.delete\(reviewing\)/);
  assert.match(html, /id="focus-move"/); assert.match(html, /id="print-practice"/);
  assert.match(html, /not uploaded or saved to browser storage/);
  assert.match(js, /event\.type !== 'pointerup'/);
  assert.match(js, /!event\.isPrimary/);
});
