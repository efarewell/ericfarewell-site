// Session-only handwriting. Never persist or send these snapshots to an API.
// The same helper is used in August's standalone studio.
export const attemptLabels = Object.freeze({trace: "Trace exercise", copy: "Copy exercise", memory: "Memory exercise", open: "Open practice"});
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n * 100) / 100;

export function captureInk(strokes, {width = 0, height = 0, mode = "", guideVisible = false} = {}) {
  if (!Array.isArray(strokes) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || height / width > 4 || !attemptLabels[mode]) return null;
  const h = round(height / width * 1000);
  const paths = strokes.slice(0, 48).flatMap((stroke) => {
    const source = Array.isArray(stroke?.points) ? stroke.points.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)) : [];
    if (source.length < 2) return [];
    // Bounded detail, including the exact first and last points.
    const pointCount = Math.min(240, source.length);
    const points = Array.from({length: pointCount}, (_, i) => source[Math.round(i * (source.length - 1) / (pointCount - 1))]);
    const xy = points.map((p) => [round(clamp(p.x, 0, 1) * 1000), round(clamp(p.y, 0, 1) * h)]);
    const distance = xy.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]), 0);
    if (distance < 3) return [];
    const size = Number.isFinite(stroke.size) ? clamp(stroke.size, 1, 8) : 3;
    return [{d: xy.map((p, i) => `${i ? "L" : "M"}${p.join(" ")}`).join(" "), width: round(clamp(size / width * 1000, 1, 24))}];
  });
  if (!paths.length) return null;
  return {height: h, paths, mode, guideVisible: !!guideVisible, label: attemptLabels[mode] + (mode !== "open" ? guideVisible ? " · reference shown" : " · reference hidden" : "")};
}

export function keepInk(previous, snapshot) {
  if (!snapshot) return previous;
  return {first: previous?.first || snapshot, latest: snapshot, count: (previous?.count || 0) + 1};
}

export const reflectionChoices = Object.freeze([
  {id: "opening", label: "The start", cue: "Keep the rest simple. Give the opening shape one slow try, then use it in the whole mark."},
  {id: "spacing", label: "The spacing", cue: "Look at the gap between the main shapes. Try once with a little more room, then once with less."},
  {id: "finish", label: "The finish", cue: "Try a shorter exit. A comfortable finishing line is enough; extra flourishes can wait."},
  {id: "comfortable", label: "It feels comfortable", cue: "Keep that version. Try it three times on paper at the size you would use on a form. Small differences are normal."},
]);

export function drawSnapshot(ctx, snapshot, x, y, width, height) {
  const scale = Math.min(width / 1000, height / snapshot.height);
  ctx.save();
  ctx.translate(x + (width - 1000 * scale) / 2, y + (height - snapshot.height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#000000"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const path of snapshot.paths) { ctx.lineWidth = path.width; ctx.stroke(new Path2D(path.d)); }
  ctx.restore();
}

export function downloadComparison(comparison, title = "My signature practice") {
  if (!comparison?.first || !comparison?.latest) return;
  const canvas = document.createElement("canvas"); canvas.width = 1600; canvas.height = 1000;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 1600, 1000);
  ctx.fillStyle = "#000000"; ctx.font = "bold 40px Arial"; ctx.fillText(title.slice(0, 55), 70, 80, 1460);
  for (const [i, [label, snapshot]] of [["First whole-mark try this session", comparison.first], ["Latest whole-mark try this session", comparison.latest]].entries()) {
    const top = 130 + i * 390;
    ctx.font = "bold 25px Arial"; ctx.fillText(label, 70, top);
    ctx.font = "20px Arial"; ctx.fillText(snapshot.label, 70, top + 34);
    drawSnapshot(ctx, snapshot, 70, top + 55, 1460, 270);
  }
  ctx.font = "20px Arial"; ctx.fillText("Practice, not a grade. Different guidance levels are labeled. Keep the parts that feel like you.", 70, 950, 1460);
  const link = document.createElement("a"); link.download = "my-signature-practice.png"; link.href = canvas.toDataURL("image/png"); link.click();
}
