import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlan,
  calcBmi,
  calcBmr,
  calcMacroTargets,
  calcRemaining,
  calcTdee,
  standardWeight,
  sumEntries,
} from '../src/modules/calc.js';

const profile = {
  sex: 'male',
  age: 35,
  heightCm: 172,
  weightKg: 75,
  targetWeightKg: 68,
  activity: 'sedentary',
  pace: 'standard',
};

test('Mifflin-St Jeor の基礎代謝', () => {
  // 10*75 + 6.25*172 - 5*35 + 5 = 1655
  assert.equal(calcBmr(profile), 1655);
  assert.equal(calcBmr({ ...profile, sex: 'female' }), 1489);
});

test('活動係数を掛けて消費カロリーを出す', () => {
  assert.equal(calcTdee(1655, 'sedentary'), 1986);
  assert.equal(calcTdee(1655, 'moderate'), 2565);
  // 未知の値は座り仕事扱いにフォールバックする
  assert.equal(calcTdee(1655, 'unknown'), 1986);
});

test('目標カロリーは消費 - 赤字', () => {
  const plan = buildPlan(profile);
  assert.equal(plan.tdee, 1986);
  // 1986 - 500 = 1486 だが、男性の摂取下限 1500kcal に丸められる
  assert.equal(plan.targetKcal, 1500);
  assert.equal(plan.deficit, 486);
  assert.equal(plan.shortfall, 14);
});

test('下限を割り込むペースは安全側にクランプされる', () => {
  const small = { sex: 'female', age: 30, heightCm: 150, weightKg: 48, activity: 'sedentary', pace: 'fast' };
  const plan = buildPlan(small);
  assert.equal(plan.clamped, true);
  assert.ok(plan.targetKcal >= plan.floor, '下限を下回らない');
  assert.ok(plan.deficit < 750, '赤字は指定より緩くなる');
  assert.ok(plan.shortfall > 50, '下限で削られた分が分かる');
});

test('目標カロリーが消費カロリーを超えることはない', () => {
  const plan = buildPlan({ ...profile, adjustment: 5000 });
  assert.equal(plan.targetKcal, plan.tdee);
  assert.equal(plan.deficit, 0);
});

test('ゆっくりペースなら下限に当たらない', () => {
  const plan = buildPlan({ ...profile, weightKg: 85, pace: 'gentle' });
  assert.equal(plan.clamped, false);
  assert.equal(plan.shortfall, 0);
  assert.equal(plan.deficit, 250);
});

test('PFC は目標カロリーの内訳になっている', () => {
  const macros = calcMacroTargets(1500, 75);
  assert.equal(macros.protein, 120); // 75 * 1.6
  const kcal = macros.protein * 4 + macros.fat * 9 + macros.carbs * 4;
  assert.ok(Math.abs(kcal - 1500) <= 5, `合計 ${kcal}kcal が目標付近に収まる`);
});

test('低カロリーでも脂質は体重×0.6g を下回らない', () => {
  const macros = calcMacroTargets(1200, 80);
  assert.equal(macros.fat, 48);
});

test('炭水化物は負にならない', () => {
  const macros = calcMacroTargets(800, 100);
  assert.ok(macros.carbs >= 0);
});

test('達成までの見込みを出す', () => {
  const plan = buildPlan(profile);
  assert.equal(plan.forecast.kgToLose, 7);
  assert.equal(plan.forecast.kgPerWeek, 0.47);
  assert.equal(plan.forecast.days, Math.ceil((7 * 7200) / plan.deficit));
});

test('目標体重が現体重以上なら見込みは出さない', () => {
  assert.equal(buildPlan({ ...profile, targetWeightKg: 80 }).forecast, null);
});

test('食事の合計と残量', () => {
  const entries = [
    { kcal: 500, protein: 20, fat: 15, carbs: 60 },
    { kcal: 300, protein: 25, fat: 5, carbs: 30 },
  ];
  const totals = sumEntries(entries);
  assert.deepEqual(totals, { kcal: 800, protein: 45, fat: 20, carbs: 90 });

  const plan = buildPlan(profile);
  const remaining = calcRemaining(plan, totals);
  assert.equal(remaining.kcal, plan.targetKcal - 800);
  assert.equal(remaining.protein, plan.macros.protein - 45);
});

test('空の記録でも落ちない', () => {
  assert.deepEqual(sumEntries(), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
});

test('BMI と標準体重', () => {
  assert.equal(calcBmi(75, 172), 25.4);
  assert.equal(standardWeight(172), 65.1);
});
