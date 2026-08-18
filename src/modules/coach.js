/**
 * AI コーチ（ルールベース推論エンジン）。
 *
 * 外部 API を呼ばずブラウザ内で完結する。入力（その日の記録・体重推移・目標）から
 * 「今なにをすべきか」を優先度つきで組み立てて返す。
 * 判断ロジックが全部ここに書いてあるので、納得できない助言はルールごと直せる。
 */

import { FOODS } from './foods.js';
import { round } from './calc.js';

/** 助言の重み。数値が大きいほど先に表示する */
const LEVEL_WEIGHT = { alert: 4, warn: 3, info: 2, good: 1 };

/** 時刻ごとの「ここまでに食べていて自然な割合」 */
const PACE_CURVE = [
  { hour: 10, ratio: 0.25 },
  { hour: 15, ratio: 0.6 },
  { hour: 20, ratio: 0.9 },
  { hour: 24, ratio: 1.0 },
];

function expectedRatio(hour) {
  if (hour < 6) return 0.05;
  for (const point of PACE_CURVE) {
    if (hour <= point.hour) return point.ratio;
  }
  return 1;
}

function sumBy(entries, predicate) {
  return entries.filter(predicate).reduce((n, e) => n + e.kcal, 0);
}

function hasTag(entry, tag) {
  return (entry.tags || []).includes(tag);
}

function topNames(entries, predicate, limit = 2) {
  return entries
    .filter(predicate)
    .sort((a, b) => b.kcal - a.kcal)
    .slice(0, limit)
    .map((e) => e.name)
    .join('・');
}

/**
 * その日の記録を診断する。
 * @param {object} params
 * @param {object} params.plan buildPlan() の戻り値
 * @param {Array} params.entries その日の食事エントリ
 * @param {object} params.totals sumEntries() の戻り値
 * @param {number} [params.hour] 現在時刻（0-23）。テスト用に差し替え可能
 * @returns {Array<{level:string, title:string, body:string}>}
 */
export function analyzeDay({ plan, entries = [], totals, hour = new Date().getHours() }) {
  const tips = [];
  const push = (level, title, body) => tips.push({ level, title, body });

  const target = plan.targetKcal;
  const remaining = target - totals.kcal;
  const ratio = totals.kcal / target;
  const expected = expectedRatio(hour);

  // --- 1. カロリーの着地見込み ---
  if (entries.length === 0) {
    push('info', 'まだ記録がありません', `今日の目標は ${target}kcal。食べる前に記録すると、食べすぎる前にブレーキがかかります。`);
  } else if (remaining < -200) {
    push(
      'alert',
      `目標を ${Math.abs(remaining)}kcal オーバー`,
      `明日 ${Math.min(Math.abs(remaining), 300)}kcal 減らせば帳消しになります。1日単位ではなく週の合計で見れば十分取り返せる範囲です。`,
    );
  } else if (remaining < 0) {
    push('warn', 'ほぼ使い切りました', `残り ${remaining}kcal。ここから食べるなら、水・お茶・無糖の炭酸で乗り切るのが安全です。`);
  } else if (hour >= 20 && remaining > target * 0.25) {
    push(
      'warn',
      `${remaining}kcal 余っています`,
      '減らしすぎは代謝の低下と反動の食べすぎを招きます。たんぱく質中心（豆腐・ヨーグルト・サラダチキン）で埋めておきましょう。',
    );
  } else if (ratio > expected + 0.2) {
    const projected = Math.round(totals.kcal / Math.max(expected, 0.05));
    push('warn', 'ペースが速めです', `この調子だと今日は ${projected}kcal 前後の着地。残り ${remaining}kcal で夜まで持たせる配分を意識してください。`);
  } else if (hour >= 20) {
    push('good', '今日は目標内で着地しそう', `摂取 ${totals.kcal}kcal / 目標 ${target}kcal。この日を week に何日作れるかがすべてです。`);
  }

  // --- 2. たんぱく質（運動が少ないほど重要）---
  const pTarget = plan.macros.protein;
  const pRatio = totals.protein / pTarget;
  if (hour >= 14 && pRatio < 0.5) {
    push(
      'warn',
      `たんぱく質が不足（${totals.protein}g / ${pTarget}g）`,
      '運動を増やさない減量では、たんぱく質が足りないと落ちるのが脂肪ではなく筋肉になります。卵・納豆・ギリシャヨーグルト・サラダチキンで1品足してください。',
    );
  } else if (pRatio >= 1) {
    push('good', 'たんぱく質は達成', `${totals.protein}g 摂取。筋肉を守れているので、落ちた体重の中身が脂肪寄りになります。`);
  }

  // --- 3. 脂質 ---
  const fTarget = plan.macros.fat;
  if (totals.fat > fTarget * 1.2) {
    const source = topNames(entries, (e) => hasTag(e, 'highfat') || hasTag(e, 'fried'));
    push(
      'warn',
      `脂質が多め（${totals.fat}g / ${fTarget}g）`,
      source
        ? `${source} が効いています。脂質は 1g=9kcal で、同じ満腹感でもカロリーが倍近く違います。`
        : '脂質は 1g=9kcal。揚げる・炒めるを「焼く・蒸す・茹でる」に変えるだけで100kcal単位で下がります。',
    );
  }

  // --- 4. 間食・甘いもの ---
  const snackKcal = sumBy(entries, (e) => hasTag(e, 'snack') || hasTag(e, 'sweet'));
  if (snackKcal > 0 && snackKcal >= target * 0.15) {
    push(
      'warn',
      `お菓子・甘いもので ${snackKcal}kcal`,
      `${topNames(entries, (e) => hasTag(e, 'snack') || hasTag(e, 'sweet'))} が中心。ここは食事より削りやすい枠です。半分にするだけで週 ${Math.round((snackKcal / 2) * 7)}kcal（約 ${round((snackKcal / 2 * 7) / 7200, 2)}kg 分）浮きます。`,
    );
  }

  // --- 5. 飲み物のカロリー ---
  const liquidKcal = sumBy(entries, (e) => hasTag(e, 'liquidcal'));
  if (liquidKcal >= 150) {
    push(
      'info',
      `飲み物だけで ${liquidKcal}kcal`,
      '液体のカロリーは満腹感がほとんど残りません。ここを水・お茶に置き換えるのが、我慢の少ない最短ルートです。',
    );
  }

  // --- 6. アルコール（内臓脂肪と相性が悪い）---
  const alcoholKcal = sumBy(entries, (e) => hasTag(e, 'alcohol'));
  if (alcoholKcal > 0) {
    push(
      alcoholKcal >= 300 ? 'warn' : 'info',
      `アルコール ${alcoholKcal}kcal`,
      'アルコールを飲むと体は先にその処理に回り、脂肪の分解が一時的に止まります。おつまみで食べすぎるぶんも含めて、ぽっこりお腹には効きにくい枠です。減らせない日はハイボール・焼酎の水割りに寄せてください。',
    );
  }

  // --- 7. 食物繊維・野菜 ---
  const vegCount = entries.filter((e) => hasTag(e, 'veg') || hasTag(e, 'fiber')).length;
  if (entries.length >= 3 && vegCount === 0) {
    push(
      'warn',
      '野菜・海藻・きのこがゼロ',
      '食物繊維は満腹感を長持ちさせ、お腹の張りも軽くします。1食に副菜1品（サラダ・味噌汁の具・きのこ）を足すのが一番安いカロリー対策です。',
    );
  } else if (entries.length >= 3 && vegCount >= 3) {
    push('good', '野菜がしっかり入っています', '同じカロリーでも満腹感が続き、間食が減ります。');
  }

  // --- 8. 塩分（見た目のぽっこりに直結）---
  const saltyCount = entries.filter((e) => hasTag(e, 'salty')).length;
  if (saltyCount >= 4) {
    push(
      'info',
      '塩分が多い構成です',
      '塩分が多いと水分を抱え込み、体重も見た目のお腹も一時的に膨らみます。汁物を1杯減らす・麺のスープを残すだけで翌朝が変わります。',
    );
  }

  // --- 9. 夜遅い食事 ---
  const lateKcal = entries
    .filter((e) => typeof e.hour === 'number' && e.hour >= 21)
    .reduce((n, e) => n + e.kcal, 0);
  if (lateKcal >= 300) {
    push(
      'info',
      `21時以降に ${lateKcal}kcal`,
      '同じカロリーでも、寝る直前だと睡眠の質が落ちて翌日の食欲が上がります。夕食を早められない日は、量を前倒しして夜を軽くするのが現実的です。',
    );
  }

  // --- 10. 朝食抜き ---
  const meals = new Set(entries.map((e) => e.meal));
  if (hour >= 14 && !meals.has('朝') && entries.length > 0) {
    push(
      'info',
      '朝食を抜いています',
      '朝を抜くこと自体は悪くありませんが、その反動で昼夕がドカ食いになりやすいのが実際のところ。合計が守れているなら問題なしです。',
    );
  }

  // どのルールにも引っかからない = いまのところ順調、という情報自体が助言になる
  if (tips.length === 0) {
    push(
      'good',
      `残り ${remaining}kcal で順調です`,
      `摂取 ${totals.kcal}kcal / たんぱく質 ${totals.protein}g（目標 ${pTarget}g）/ 脂質 ${totals.fat}g（目標 ${fTarget}g）。この配分のまま夜まで持たせれば今日は成功です。`,
    );
  }

  return tips.sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]);
}

/**
 * 残りカロリー・残りPFCに収まる食べ方を提案する。
 * たんぱく質が不足しているときは高たんぱくを優先して選ぶ。
 * @param {object} remaining calcRemaining() の戻り値
 * @param {number} [limit]
 */
export function suggestFoods(remaining, limit = 5) {
  if (remaining.kcal <= 30) return [];

  const needProtein = remaining.protein > 15;
  const budget = remaining.kcal;

  return FOODS.filter((f) => f.kcal > 0 && f.kcal <= budget)
    .filter((f) => !(f.tags || []).includes('alcohol'))
    .map((f) => {
      // たんぱく質1kcalあたりの効率と、繊維・低脂質を加点したスコア
      const proteinScore = (f.p * 4) / Math.max(f.kcal, 1);
      const fiberScore = (f.tags || []).includes('fiber') ? 0.15 : 0;
      const vegScore = (f.tags || []).includes('veg') ? 0.1 : 0;
      const junkPenalty = (f.tags || []).some((t) => ['sweet', 'fried', 'snack'].includes(t)) ? 0.3 : 0;
      const score = (needProtein ? proteinScore * 1.5 : proteinScore) + fiberScore + vegScore - junkPenalty;
      return { ...f, score: round(score, 3) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 体重の推移から実際の減量ペースを最小二乗法で求める。
 * @param {Array<{date:string, weightKg:number}>} log 日付昇順でなくてもよい
 * @param {number} [days] 直近何日ぶんを見るか
 * @returns {{kgPerWeek:number, points:number, spanDays:number}|null}
 */
export function weightTrend(log = [], days = 21) {
  const sorted = [...log]
    .filter((r) => r && r.date && Number.isFinite(Number(r.weightKg)))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length < 4) return null;

  const last = sorted.slice(-days);
  const t0 = new Date(last[0].date).getTime();
  const xs = last.map((r) => (new Date(r.date).getTime() - t0) / 86400000);
  const ys = last.map((r) => Number(r.weightKg));
  const spanDays = xs[xs.length - 1];
  if (spanDays < 5) return null;

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
  if (den === 0) return null;

  const slopePerDay = num / den;
  return { kgPerWeek: round(slopePerDay * 7, 2), points: n, spanDays: round(spanDays, 0) };
}

/**
 * 実測ペースと目標ペースを比べ、目標カロリーの補正値を提案する（アダプティブTDEE）。
 * 推定式は誤差が大きいので、2週間以上の実測で上書きするのがこのアプリの肝。
 * @param {object} plan
 * @param {Array} weightLog
 * @param {number} [currentAdjustment] 現在の補正値
 */
export function suggestAdjustment(plan, weightLog, currentAdjustment = 0) {
  const trend = weightTrend(weightLog);
  if (!trend) {
    return { adjustment: currentAdjustment, delta: 0, trend: null, message: '体重の記録が5日ぶん以上たまると、実測ペースから目標カロリーを自動で補正できます。' };
  }

  const goal = plan.forecast ? -plan.forecast.kgPerWeek : -(plan.deficit * 7) / 7200;
  const diff = trend.kgPerWeek - goal; // プラス = 想定より落ちていない
  let delta = 0;

  if (diff > 0.15) {
    delta = -Math.min(300, Math.round((diff * 7200) / 7 / 50) * 50);
  } else if (diff < -0.25) {
    delta = Math.min(300, Math.round((Math.abs(diff) * 7200) / 7 / 50) * 50);
  }

  const adjustment = Math.max(-400, Math.min(400, currentAdjustment + delta));
  const paceText = `直近${trend.spanDays}日の実測ペースは ${trend.kgPerWeek > 0 ? '+' : ''}${trend.kgPerWeek}kg/週（目標 ${round(goal, 2)}kg/週）。`;

  let message;
  if (delta < 0) {
    message = `${paceText}推定式より代謝が低めに出ているので、目標カロリーを ${delta}kcal 補正することをおすすめします。`;
  } else if (delta > 0) {
    message = `${paceText}落ちるのが速すぎます。筋肉が減りやすいので目標を +${delta}kcal 戻しましょう。`;
  } else {
    message = `${paceText}想定どおりのペースです。目標カロリーはこのままで大丈夫です。`;
  }

  return { adjustment, delta, trend, message };
}

/**
 * 直近の記録から週次サマリーを作る。
 * 途中までしか記録していない当日を混ぜると平均が実態より低く出るので、除外できるようにしてある。
 * @param {Object<string, {entries:Array}>} days 日付キーの記録
 * @param {object} plan
 * @param {number} [span] 何日ぶん見るか
 * @param {string|null} [excludeDate] 集計から外す日付（通常は今日）
 */
export function weeklyReview(days = {}, plan, span = 7, excludeDate = null) {
  const dates = Object.keys(days)
    .filter((d) => d !== excludeDate)
    .sort()
    .slice(-span);
  const daily = dates.map((date) => ({
    date,
    kcal: (days[date].entries || []).reduce((n, e) => n + (e.kcal || 0), 0),
    protein: round((days[date].entries || []).reduce((n, e) => n + (e.protein || 0), 0), 1),
  }));
  const logged = daily.filter((d) => d.kcal > 0);
  if (logged.length === 0) return null;

  const avg = Math.round(logged.reduce((n, d) => n + d.kcal, 0) / logged.length);
  const onTarget = logged.filter((d) => d.kcal <= plan.targetKcal).length;
  const avgProtein = round(logged.reduce((n, d) => n + d.protein, 0) / logged.length, 1);
  const weeklyDeficit = (plan.tdee - avg) * logged.length;

  return {
    days: logged.length,
    avgKcal: avg,
    avgProtein,
    onTarget,
    expectedKgPerWeek: round(-((plan.tdee - avg) * 7) / 7200, 2),
    weeklyDeficit: Math.round(weeklyDeficit),
    verdict:
      onTarget >= logged.length * 0.7
        ? '合格ライン。週の7割で目標内なら、体重は必ず後からついてきます。'
        : '目標内に収まった日が少なめ。完璧を狙わず「週5日は守る」を最低ラインにしましょう。',
  };
}
