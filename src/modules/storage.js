/**
 * localStorage への永続化。データはすべて端末内にとどまり、外部には送信しない。
 */

const KEY = 'calorie-coach:v1';

/** 初回起動時に設定タブへ入れておく値。使う人が変わったらここを書き換える。 */
export const DEFAULT_PROFILE = {
  sex: 'male',
  age: 26,
  heightCm: 179,
  weightKg: 80,
  targetWeightKg: 71, // BMI 22.2。標準体重は 70.5kg
  activity: 'sedentary',
  pace: 'standard',
  adjustment: 0,
};

const emptyState = () => ({
  version: 1,
  profile: { ...DEFAULT_PROFILE },
  profileSet: false,
  days: {}, // 'YYYY-MM-DD' -> { entries: [] }
  weightLog: [], // [{ date, weightKg }]
  customFoods: [],
});

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      ...emptyState(),
      ...parsed,
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('保存に失敗しました', e);
  }
}

export function resetState() {
  localStorage.removeItem(KEY);
  return emptyState();
}

export function getDay(state, dateKey = todayKey()) {
  if (!state.days[dateKey]) state.days[dateKey] = { entries: [] };
  return state.days[dateKey];
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
    throw new Error('このアプリのバックアップファイルではないようです');
  }
  return { ...emptyState(), ...parsed, profile: { ...DEFAULT_PROFILE, ...parsed.profile } };
}

export { emptyState };
