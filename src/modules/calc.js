/**
 * 体格・目標から「1日の目標カロリーとPFC」を計算するモジュール。
 *
 * 方針（食事制限メイン・運動は最小限）:
 *  - 基礎代謝は Mifflin-St Jeor 式（現在もっとも一般的に使われる推定式）
 *  - 消費カロリー = 基礎代謝 × 活動係数
 *  - 目標カロリー = 消費カロリー - 減量ペースに応じた赤字
 *  - 極端な低カロリーにならないよう下限でクランプする
 */

/** 体脂肪 1kg を落とすのに必要な熱量の目安 (kcal) */
export const KCAL_PER_KG_FAT = 7200;

/** 活動レベル（運動を増やさない前提なので、係数は控えめに置く） */
export const ACTIVITY_LEVELS = {
  sedentary: { label: 'ほぼ座り仕事・運動なし', factor: 1.2 },
  light: { label: '軽い活動（通勤や家事で歩く）', factor: 1.375 },
  moderate: { label: '中程度（週2〜3回の運動）', factor: 1.55 },
  active: { label: '高い（週4回以上の運動）', factor: 1.725 },
};

/** 減量ペース（1日あたりの赤字カロリー） */
export const PACES = {
  gentle: { label: 'ゆっくり（-0.25kg/週）', deficit: 250 },
  standard: { label: '標準（-0.5kg/週）', deficit: 500 },
  fast: { label: '速め（-0.75kg/週）', deficit: 750 },
};

/** 健康を損なわないための摂取カロリー下限 (kcal/日) */
export const MIN_INTAKE = { male: 1500, female: 1200 };

/** 1g あたりの熱量 */
export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 };

const round = (n, digits = 0) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * 基礎代謝量 (BMR) / Mifflin-St Jeor
 * @param {{sex:'male'|'female', age:number, heightCm:number, weightKg:number}} profile
 * @returns {number} kcal/日
 */
export function calcBmr({ sex, age, heightCm, weightKg }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round(sex === 'male' ? base + 5 : base - 161);
}

/**
 * 1日の消費カロリー (TDEE)
 * @param {number} bmr
 * @param {keyof typeof ACTIVITY_LEVELS} activity
 * @returns {number} kcal/日
 */
export function calcTdee(bmr, activity = 'sedentary') {
  const level = ACTIVITY_LEVELS[activity] ?? ACTIVITY_LEVELS.sedentary;
  return round(bmr * level.factor);
}

/**
 * PFC の目標量を求める。
 * 運動が少ないほど筋肉が落ちやすいので、たんぱく質は体重比で厚めに確保する。
 * @param {number} targetKcal 1日の目標カロリー
 * @param {number} weightKg 現体重
 * @returns {{protein:number, fat:number, carbs:number}} g/日
 */
export function calcMacroTargets(targetKcal, weightKg) {
  // たんぱく質: 体重 × 1.6g（減量中の筋肉維持ライン）
  const protein = round(weightKg * 1.6);
  // 脂質: 総カロリーの 25%。ただしホルモン維持のため体重 × 0.6g を下回らない
  const fatByRatio = (targetKcal * 0.25) / KCAL_PER_G.fat;
  const fat = round(Math.max(fatByRatio, weightKg * 0.6));
  // 炭水化物: 残り全部
  const rest = targetKcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  const carbs = round(Math.max(rest, 0) / KCAL_PER_G.carbs);
  return { protein, fat, carbs };
}

/**
 * プロフィールから 1 日の計画をまとめて作る。
 * @param {{
 *   sex:'male'|'female', age:number, heightCm:number, weightKg:number,
 *   targetWeightKg?:number, activity?:keyof typeof ACTIVITY_LEVELS,
 *   pace?:keyof typeof PACES, adjustment?:number
 * }} profile
 */
export function buildPlan(profile) {
  const {
    sex,
    weightKg,
    targetWeightKg,
    activity = 'sedentary',
    pace = 'standard',
    adjustment = 0,
  } = profile;

  const bmr = calcBmr(profile);
  const tdee = calcTdee(bmr, activity);
  const deficit = (PACES[pace] ?? PACES.standard).deficit;

  const floor = Math.max(MIN_INTAKE[sex] ?? MIN_INTAKE.female, round(bmr * 0.9));
  const rawTarget = tdee - deficit + adjustment;
  const targetKcal = round(clamp(rawTarget, floor, tdee));
  // クランプ後の実効赤字（下限に当たった場合は目標より緩やかになる）
  const effectiveDeficit = tdee - targetKcal;

  const macros = calcMacroTargets(targetKcal, weightKg);

  let forecast = null;
  if (targetWeightKg && targetWeightKg < weightKg && effectiveDeficit > 0) {
    const kgToLose = weightKg - targetWeightKg;
    const days = Math.ceil((kgToLose * KCAL_PER_KG_FAT) / effectiveDeficit);
    forecast = {
      kgToLose: round(kgToLose, 1),
      days,
      weeks: round(days / 7, 1),
      kgPerWeek: round((effectiveDeficit * 7) / KCAL_PER_KG_FAT, 2),
    };
  }

  return {
    bmr,
    tdee,
    targetKcal,
    deficit: effectiveDeficit,
    requestedDeficit: deficit,
    // 下限に当たって、狙った赤字にどれだけ届かなかったか
    shortfall: Math.max(deficit - effectiveDeficit, 0),
    clamped: rawTarget < floor,
    floor,
    macros,
    forecast,
  };
}

/**
 * 記録された食事の合計を出す。
 * @param {Array<{kcal:number, protein:number, fat:number, carbs:number}>} entries
 */
export function sumEntries(entries = []) {
  return entries.reduce(
    (acc, e) => ({
      kcal: round(acc.kcal + (e.kcal || 0)),
      protein: round(acc.protein + (e.protein || 0), 1),
      fat: round(acc.fat + (e.fat || 0), 1),
      carbs: round(acc.carbs + (e.carbs || 0), 1),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

/**
 * 目標に対する残量。
 */
export function calcRemaining(plan, totals) {
  return {
    kcal: round(plan.targetKcal - totals.kcal),
    protein: round(plan.macros.protein - totals.protein, 1),
    fat: round(plan.macros.fat - totals.fat, 1),
    carbs: round(plan.macros.carbs - totals.carbs, 1),
  };
}

/**
 * BMI（内臓脂肪そのものは測れないが、目標設定の目安に使う）
 */
export function calcBmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return round(weightKg / (m * m), 1);
}

/** BMI 22 の標準体重 */
export function standardWeight(heightCm) {
  const m = heightCm / 100;
  return round(22 * m * m, 1);
}

export { round, clamp };
