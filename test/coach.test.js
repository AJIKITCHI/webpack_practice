import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, sumEntries, calcRemaining } from '../src/modules/calc.js';
import { analyzeDay, suggestAdjustment, suggestFoods, weeklyReview, weightTrend } from '../src/modules/coach.js';

const plan = buildPlan({
  sex: 'male',
  age: 35,
  heightCm: 172,
  weightKg: 75,
  targetWeightKg: 68,
  activity: 'sedentary',
  pace: 'standard',
});

const entry = (over) => ({ kcal: 0, protein: 0, fat: 0, carbs: 0, meal: '昼', tags: [], name: '食品', ...over });

const analyze = (entries, hour = 20) =>
  analyzeDay({ plan, entries, totals: sumEntries(entries), hour });

const titles = (tips) => tips.map((t) => t.title).join(' / ');

test('記録がなければ入力を促す', () => {
  const tips = analyze([], 12);
  assert.match(titles(tips), /まだ記録がありません/);
});

test('オーバーしたら alert を最優先で返す', () => {
  const tips = analyze([entry({ kcal: 2500, protein: 90, fat: 60, carbs: 300, name: 'カツ丼' })]);
  assert.equal(tips[0].level, 'alert');
  assert.match(tips[0].title, /オーバー/);
});

test('たんぱく質不足を指摘する', () => {
  const tips = analyze([entry({ kcal: 900, protein: 10, fat: 20, carbs: 160, name: 'ラーメン' })], 15);
  assert.match(titles(tips), /たんぱく質が不足/);
});

test('たんぱく質を満たせば褒める', () => {
  const tips = analyze([entry({ kcal: 700, protein: 130, fat: 20, carbs: 40, name: '鶏むね' })]);
  assert.match(titles(tips), /たんぱく質は達成/);
});

test('脂質過多を指摘する', () => {
  const tips = analyze([entry({ kcal: 1000, protein: 30, fat: 80, carbs: 40, tags: ['fried'], name: '唐揚げ' })]);
  const fat = tips.find((t) => /脂質が多め/.test(t.title));
  assert.ok(fat);
  assert.match(fat.body, /唐揚げ/);
});

test('間食の比率が高いと削る枠として提示する', () => {
  const tips = analyze([
    entry({ kcal: 400, protein: 4, fat: 25, carbs: 40, tags: ['snack', 'sweet'], name: 'ポテトチップス' }),
    entry({ kcal: 600, protein: 20, fat: 15, carbs: 90, name: 'ごはん' }),
  ]);
  assert.match(titles(tips), /お菓子・甘いもの/);
});

test('液体カロリーとアルコールを別々に見る', () => {
  const tips = analyze([
    entry({ kcal: 420, protein: 3, fat: 0, carbs: 33, tags: ['alcohol', 'liquidcal'], name: 'ビール' }),
    entry({ kcal: 600, protein: 25, fat: 20, carbs: 70, name: '定食' }),
  ]);
  const text = titles(tips);
  assert.match(text, /飲み物だけで/);
  assert.match(text, /アルコール/);
});

test('野菜ゼロを指摘し、入っていれば褒める', () => {
  const meat = [1, 2, 3].map(() => entry({ kcal: 300, protein: 20, fat: 15, carbs: 20, name: '肉' }));
  assert.match(titles(analyze(meat)), /野菜・海藻・きのこがゼロ/);

  const balanced = [1, 2, 3].map(() => entry({ kcal: 200, protein: 15, fat: 5, carbs: 20, tags: ['veg', 'fiber'], name: 'サラダ' }));
  assert.match(titles(analyze(balanced)), /野菜がしっかり/);
});

test('食べなさすぎも警告する', () => {
  const tips = analyze([entry({ kcal: 300, protein: 10, fat: 5, carbs: 50, name: 'おにぎり' })], 21);
  assert.match(titles(tips), /余っています/);
});

test('どのルールにも当てはまらない日でも必ず一言返す', () => {
  const tips = analyze([entry({ kcal: 500, protein: 35, fat: 12, carbs: 55, tags: ['veg'], name: '定食' })], 12);
  assert.equal(tips.length, 1);
  assert.equal(tips[0].level, 'good');
  assert.match(tips[0].title, /順調/);
});

test('残りカロリーに収まる高たんぱくな食品を提案する', () => {
  const totals = sumEntries([entry({ kcal: 1000, protein: 20, fat: 30, carbs: 130 })]);
  const suggestions = suggestFoods(calcRemaining(plan, totals), 5);
  assert.ok(suggestions.length > 0);
  assert.ok(suggestions.every((f) => f.kcal <= plan.targetKcal - 1000));
  assert.ok(suggestions.every((f) => !f.tags.includes('alcohol')), 'お酒は勧めない');
  assert.ok(suggestions[0].p > 5, 'たんぱく質が足りない日は高たんぱくが上位');
});

test('残りがなければ何も勧めない', () => {
  assert.deepEqual(suggestFoods({ kcal: 10, protein: 30, fat: 5, carbs: 20 }), []);
});

test('体重の傾きを最小二乗法で求める', () => {
  const log = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 75 - i * 0.07, // ≒ -0.49kg/週
  }));
  const trend = weightTrend(log);
  assert.equal(trend.kgPerWeek, -0.49);
  assert.equal(trend.points, 13 + 1);
});

test('データが少なければ傾きは出さない', () => {
  assert.equal(weightTrend([]), null);
  assert.equal(weightTrend([{ date: '2026-01-01', weightKg: 75 }]), null);
});

test('落ちが遅ければ目標カロリーを下げる提案をする', () => {
  const log = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 75 - i * 0.01, // ほぼ横ばい
  }));
  const advice = suggestAdjustment(plan, log, 0);
  assert.ok(advice.delta < 0);
  assert.ok(advice.adjustment >= -400);
  assert.match(advice.message, /補正/);
});

test('落ちが速すぎればカロリーを戻す提案をする', () => {
  const log = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 75 - i * 0.2, // -1.4kg/週
  }));
  const advice = suggestAdjustment(plan, log, 0);
  assert.ok(advice.delta > 0);
  assert.match(advice.message, /速すぎ/);
});

test('想定どおりなら補正しない', () => {
  const log = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 75 - i * 0.07,
  }));
  const advice = suggestAdjustment(plan, log, 0);
  assert.equal(advice.delta, 0);
});

test('週次サマリー', () => {
  const days = {};
  for (let i = 1; i <= 7; i += 1) {
    days[`2026-01-0${i}`] = { entries: [{ kcal: 1400, protein: 100, fat: 40, carbs: 150 }] };
  }
  const review = weeklyReview(days, plan);
  assert.equal(review.days, 7);
  assert.equal(review.avgKcal, 1400);
  assert.equal(review.onTarget, 7);
  assert.ok(review.expectedKgPerWeek < 0);
  assert.match(review.verdict, /合格ライン/);
});

test('記録がない週は null', () => {
  assert.equal(weeklyReview({}, plan), null);
});

test('途中までの当日は平均に混ぜない', () => {
  const days = {
    '2026-01-01': { entries: [{ kcal: 1400 }] },
    '2026-01-02': { entries: [{ kcal: 1400 }] },
    '2026-01-03': { entries: [{ kcal: 200 }] }, // 記録途中の当日
  };
  const review = weeklyReview(days, plan, 7, '2026-01-03');
  assert.equal(review.days, 2);
  assert.equal(review.avgKcal, 1400);
});
