/**
 * 体重推移の折れ線グラフ（依存ライブラリなしの SVG 生成）。
 */

const W = 640;
const H = 160;
const PAD = { top: 12, right: 12, bottom: 20, left: 38 };

/**
 * @param {Array<{date:string, weightKg:number}>} log
 * @param {{targetWeightKg?:number}} [opts]
 * @returns {string} SVG マークアップ
 */
export function weightChartSvg(log = [], { targetWeightKg } = {}) {
  const points = [...log]
    .filter((r) => r && Number.isFinite(Number(r.weightKg)))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-60);

  if (points.length < 2) {
    return `<p class="note">体重を2回以上記録するとグラフが出ます。毎朝トイレ後・同じ服装で測ると比較しやすくなります。</p>`;
  }

  const ys = points.map((p) => Number(p.weightKg));
  const candidates = targetWeightKg ? [...ys, targetWeightKg] : ys;
  let min = Math.min(...candidates);
  let max = Math.max(...candidates);
  if (max - min < 1) {
    min -= 0.5;
    max += 0.5;
  }
  const padY = (max - min) * 0.15;
  min -= padY;
  max += padY;

  const t0 = new Date(points[0].date).getTime();
  const t1 = new Date(points[points.length - 1].date).getTime();
  const spanMs = Math.max(t1 - t0, 1);

  const x = (d) => PAD.left + ((new Date(d).getTime() - t0) / spanMs) * (W - PAD.left - PAD.right);
  const y = (v) => PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(' ');
  const dots = points.map((p) => `<circle class="dot" cx="${x(p.date).toFixed(1)}" cy="${y(p.weightKg).toFixed(1)}" r="2.5" />`).join('');

  const gridVals = [max, (max + min) / 2, min];
  const grid = gridVals
    .map((v) => {
      const yy = y(v).toFixed(1);
      return `<line class="axis" x1="${PAD.left}" y1="${yy}" x2="${W - PAD.right}" y2="${yy}" /><text x="2" y="${Number(yy) + 3}">${v.toFixed(1)}</text>`;
    })
    .join('');

  const targetLine =
    targetWeightKg && targetWeightKg >= min && targetWeightKg <= max
      ? `<line class="trend" x1="${PAD.left}" y1="${y(targetWeightKg).toFixed(1)}" x2="${W - PAD.right}" y2="${y(targetWeightKg).toFixed(1)}" /><text x="${W - PAD.right - 46}" y="${y(targetWeightKg) - 4}">目標 ${targetWeightKg}kg</text>`
      : '';

  const labels = `
    <text x="${PAD.left}" y="${H - 4}">${points[0].date.slice(5)}</text>
    <text x="${W - PAD.right - 30}" y="${H - 4}">${points[points.length - 1].date.slice(5)}</text>`;

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="体重推移">
    ${grid}${targetLine}<path class="line" d="${path}" />${dots}${labels}
  </svg>`;
}
