import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, FOODS, findFood, searchFoods, toEntry } from '../src/modules/foods.js';

test('id が重複していない', () => {
  const ids = FOODS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('全食品が有効な数値とカテゴリを持つ', () => {
  for (const f of FOODS) {
    assert.ok(CATEGORIES.includes(f.cat), `${f.name} のカテゴリ ${f.cat} が未定義`);
    for (const key of ['kcal', 'p', 'f', 'c']) {
      assert.ok(Number.isFinite(f[key]) && f[key] >= 0, `${f.name} の ${key} が不正`);
    }
    assert.ok(f.name && f.unit, `${f.id} に名前か単位がない`);
    assert.ok(Array.isArray(f.tags), `${f.name} の tags が配列でない`);
  }
});

test('PFC から計算した熱量が表示カロリーとおおむね一致する', () => {
  // 入力ミスを拾うための整合性チェック。
  // アルコールは 1g=7kcal で PFC のどれにも入らないため対象外。
  // 野菜は食物繊維が炭水化物に含まれるぶん高めに出るので 30% まで許容する。
  for (const f of FOODS) {
    if (f.kcal < 30 || f.tags.includes('alcohol')) continue;
    const fromMacros = f.p * 4 + f.f * 9 + f.c * 4;
    const diff = Math.abs(fromMacros - f.kcal) / f.kcal;
    assert.ok(diff < 0.3, `${f.name}: 表示 ${f.kcal}kcal に対し PFC 換算 ${Math.round(fromMacros)}kcal`);
  }
});

test('よく食べるメニューが登録されている', () => {
  for (const id of ['matsuya_oomori', 'naan', 'chicken_curry', 'mabo_light', 'yakiniku_akami', 'ajitama', 'mugi_rice', 'medamayaki']) {
    assert.ok(findFood(id), `${id} が見つからない`);
  }
});

test('名前で検索できる', () => {
  assert.ok(searchFoods('ラーメン').length >= 2);
  assert.ok(searchFoods('麻婆').length >= 2);
  assert.equal(searchFoods('存在しない食品').length, 0);
});

test('カテゴリで絞り込める', () => {
  const results = searchFoods('', { category: '主食' });
  assert.ok(results.length > 0);
  assert.ok(results.every((f) => f.cat === '主食'));
});

test('自分で登録した食品も検索対象になる', () => {
  const custom = [{ id: 'x', name: '母のカレー', cat: '外食・コンビニ', unit: '1皿', kcal: 600, p: 15, f: 20, c: 80, tags: [] }];
  assert.equal(searchFoods('母の', { customFoods: custom }).length, 1);
  assert.ok(findFood('x', custom));
});

test('量を掛けて記録エントリになる', () => {
  const entry = toEntry(findFood('naan'), 2, '昼');
  assert.equal(entry.kcal, 520);
  assert.equal(entry.protein, 16);
  assert.equal(entry.meal, '昼');
  assert.equal(entry.amount, 2);
});
