import './styles.css';
import {
  ACTIVITY_LEVELS,
  PACES,
  buildPlan,
  calcBmi,
  calcRemaining,
  standardWeight,
  sumEntries,
} from './modules/calc.js';
import { CATEGORIES, findFood, searchFoods, toEntry } from './modules/foods.js';
import { analyzeDay, suggestAdjustment, suggestFoods, weeklyReview, weightTrend } from './modules/coach.js';
import { weightChartSvg } from './modules/chart.js';
import {
  exportJson,
  getDay,
  importJson,
  loadState,
  resetState,
  saveState,
  todayKey,
} from './modules/storage.js';

const MEALS = ['朝', '昼', '夕', '間食'];
const TABS = [
  { id: 'today', label: '今日' },
  { id: 'add', label: '記録' },
  { id: 'weight', label: '体重' },
  { id: 'settings', label: '設定' },
];

let state = loadState();
const ui = {
  tab: state.profileSet ? 'today' : 'settings',
  search: '',
  category: '',
  meal: MEALS[mealByHour(new Date().getHours())],
  focus: null,
};

function mealByHour(h) {
  if (h < 10) return 0;
  if (h < 15) return 1;
  if (h < 21) return 2;
  return 3;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const persist = () => saveState(state);

function currentPlan() {
  return buildPlan(state.profile);
}

/* ------------------------------------------------------------------ 今日 */

function renderToday(plan) {
  const day = getDay(state, todayKey());
  const totals = sumEntries(day.entries);
  const remaining = calcRemaining(plan, totals);
  const pct = Math.min((totals.kcal / plan.targetKcal) * 100, 100);
  const over = remaining.kcal < 0;

  const tips = analyzeDay({ plan, entries: day.entries, totals });
  const suggestions = suggestFoods(remaining, 4);
  const review = weeklyReview(state.days, plan, 7, todayKey());

  const macroCard = (label, used, target, unit = 'g') => {
    const p = Math.min((used / Math.max(target, 1)) * 100, 100);
    return `<div class="macro">
      <b>${label}</b>
      <div class="val">${used}<small> / ${target}${unit}</small></div>
      <div class="bar ${used > target * 1.15 ? 'over' : ''}"><i style="width:${p}%"></i></div>
    </div>`;
  };

  const mealsHtml = MEALS.map((meal) => {
    const list = day.entries.filter((e) => e.meal === meal);
    const kcal = list.reduce((n, e) => n + e.kcal, 0);
    const rows = list.length
      ? list
          .map(
            (e) => `<div class="entry">
              <span class="name">${esc(e.name)}</span>
              <span class="amt">×${e.amount}</span>
              <span class="kcal">${e.kcal}kcal</span>
              <button data-action="remove-entry" data-id="${e.id}" aria-label="削除">×</button>
            </div>`,
          )
          .join('')
      : '<div class="empty">まだ記録なし</div>';
    return `<div class="meal-block">
      <div class="head"><span>${meal}</span><span>${kcal}kcal</span></div>
      ${rows}
    </div>`;
  }).join('');

  return `
    <div class="card">
      <h2>残りカロリー</h2>
      <div class="big-number ${over ? 'over' : ''}">
        <strong>${over ? `+${Math.abs(remaining.kcal)}` : remaining.kcal}</strong>
        <span>${over ? 'kcal オーバー' : `kcal / 目標 ${plan.targetKcal}kcal`}</span>
      </div>
      <div class="bar ${over ? 'over' : ''}"><i style="width:${pct}%"></i></div>
      <div class="stat-row">
        <span>摂取 <b>${totals.kcal}</b>kcal</span>
        <span>消費目安 <b>${plan.tdee}</b>kcal</span>
        <span>赤字 <b>${plan.tdee - totals.kcal}</b>kcal</span>
      </div>
      <div class="macro-grid">
        ${macroCard('たんぱく質', totals.protein, plan.macros.protein)}
        ${macroCard('脂質', totals.fat, plan.macros.fat)}
        ${macroCard('炭水化物', totals.carbs, plan.macros.carbs)}
      </div>
    </div>

    <div class="card">
      <h2>AIコーチ</h2>
      ${tips
        .map(
          (t) => `<div class="tip ${t.level}"><div class="t">${esc(t.title)}</div><div class="b">${esc(t.body)}</div></div>`,
        )
        .join('')}
      ${
        suggestions.length
          ? `<div class="note" style="margin-top:12px">残り ${remaining.kcal}kcal ならこの辺りが正解</div>
             <div class="chip-row">${suggestions
               .map((f) => `<button class="chip" data-action="quick-add" data-food="${f.id}">${esc(f.name)} ${f.kcal}kcal</button>`)
               .join('')}</div>`
          : ''
      }
    </div>

    <div class="card">
      <h2>今日の記録</h2>
      ${mealsHtml}
      <button class="btn primary" data-action="goto" data-tab="add">＋ 食事を記録する</button>
    </div>

    ${
      review
        ? `<div class="card">
            <h2>直近7日（今日を除く）</h2>
            <div class="stat-row">
              <span>平均 <b>${review.avgKcal}</b>kcal</span>
              <span>目標内 <b>${review.onTarget}</b>/${review.days}日</span>
              <span>平均たんぱく質 <b>${review.avgProtein}</b>g</span>
              <span>想定ペース <b>${review.expectedKgPerWeek}</b>kg/週</span>
            </div>
            <p class="note" style="margin-bottom:0">${esc(review.verdict)}</p>
          </div>`
        : ''
    }`;
}

/* ------------------------------------------------------------------ 記録 */

function renderAdd(plan) {
  const results = searchFoods(ui.search, { category: ui.category, customFoods: state.customFoods }).slice(0, 60);
  const day = getDay(state, todayKey());
  const totals = sumEntries(day.entries);
  const remaining = calcRemaining(plan, totals);
  const recent = day.entries.slice(-3).reverse();

  return `
    <div class="card">
      <h2>今日の残り</h2>
      <div class="stat-row">
        <span>残り <b>${remaining.kcal < 0 ? `+${Math.abs(remaining.kcal)} オーバー` : `${remaining.kcal}kcal`}</b></span>
        <span>摂取 <b>${totals.kcal}</b>kcal</span>
        <span>たんぱく質 <b>${totals.protein}</b>/${plan.macros.protein}g</span>
      </div>
      ${
        recent.length
          ? `<div style="margin-top:8px">${recent
              .map(
                (e) => `<div class="entry"><span class="name">${esc(e.meal)}・${esc(e.name)}</span><span class="kcal">${e.kcal}kcal</span>
                  <button data-action="remove-entry" data-id="${e.id}" aria-label="削除">×</button></div>`,
              )
              .join('')}</div>`
          : '<p class="note" style="margin-bottom:0">下から食品を選ぶとここに積み上がります。</p>'
      }
    </div>

    <div class="card">
      <h2>食事を記録</h2>
      <div class="chip-row" style="margin-bottom:12px">
        ${MEALS.map((m) => `<button class="chip ${ui.meal === m ? 'active' : ''}" data-action="set-meal" data-meal="${m}">${m}</button>`).join('')}
      </div>
      <div class="field">
        <input id="food-search" type="search" placeholder="食品名で検索（例: 納豆、ラーメン）" value="${esc(ui.search)}" data-action="search" />
      </div>
      <div class="chip-row">
        <button class="chip ${ui.category === '' ? 'active' : ''}" data-action="set-cat" data-cat="">すべて</button>
        ${CATEGORIES.map(
          (c) => `<button class="chip ${ui.category === c ? 'active' : ''}" data-action="set-cat" data-cat="${esc(c)}">${esc(c)}</button>`,
        ).join('')}
      </div>
      <div class="food-list">
        ${
          results.length
            ? results
                .map(
                  (f) => `<div class="food-item" data-action="add-food" data-food="${esc(f.id)}">
                    <span class="name">${esc(f.name)}<small>${esc(f.cat)} / ${esc(f.unit)} ・ P${f.p} F${f.f} C${f.c}</small></span>
                    <span class="kcal">${f.kcal}kcal</span>
                  </div>`,
                )
                .join('')
            : '<div class="empty">見つかりません。下の「自分の食品を登録」から追加できます。</div>'
        }
      </div>
      <p class="note">タップすると「${ui.meal}」に1人前で追加されます。量を変えたいときは追加後に個数ぶんタップするか、下で登録してください。</p>
    </div>

    <div class="card">
      <h2>自分の食品を登録</h2>
      <div class="field"><label for="cf-name">名前</label><input id="cf-name" placeholder="例: 母のカレー" /></div>
      <div class="grid-2">
        <div class="field"><label for="cf-kcal">kcal</label><input id="cf-kcal" type="number" inputmode="numeric" placeholder="500" /></div>
        <div class="field"><label for="cf-unit">1回の量</label><input id="cf-unit" placeholder="1皿" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label for="cf-p">P (g)</label><input id="cf-p" type="number" step="0.1" placeholder="15" /></div>
        <div class="field"><label for="cf-f">F (g)</label><input id="cf-f" type="number" step="0.1" placeholder="20" /></div>
      </div>
      <div class="field"><label for="cf-c">C (g)</label><input id="cf-c" type="number" step="0.1" placeholder="70" /></div>
      <button class="btn primary" data-action="add-custom">登録する</button>
      <p class="note">PFC が分からないときは kcal だけでも大丈夫です（0 のままで登録できます）。</p>
    </div>`;
}

/* ------------------------------------------------------------------ 体重 */

function renderWeight(plan) {
  const log = [...state.weightLog].sort((a, b) => (a.date < b.date ? 1 : -1));
  const trend = weightTrend(state.weightLog);
  const advice = suggestAdjustment(plan, state.weightLog, state.profile.adjustment);
  const latest = log[0];
  const bmi = latest ? calcBmi(latest.weightKg, state.profile.heightCm) : null;

  return `
    <div class="card">
      <h2>体重を記録</h2>
      <div class="grid-2">
        <div class="field"><label for="w-date">日付</label><input id="w-date" type="date" value="${todayKey()}" /></div>
        <div class="field"><label for="w-value">体重 (kg)</label><input id="w-value" type="number" step="0.1" inputmode="decimal" value="${latest ? latest.weightKg : state.profile.weightKg}" /></div>
      </div>
      <button class="btn primary" data-action="add-weight">記録する</button>
      <p class="note">日ごとの上下は水分です。毎朝トイレ後・同じ服装で測って、線の傾きだけを見てください。</p>
    </div>

    <div class="card">
      <h2>推移</h2>
      ${weightChartSvg(state.weightLog, { targetWeightKg: state.profile.targetWeightKg })}
      <div class="stat-row" style="margin-top:10px">
        ${latest ? `<span>最新 <b>${latest.weightKg}</b>kg</span>` : ''}
        ${bmi ? `<span>BMI <b>${bmi}</b></span>` : ''}
        ${trend ? `<span>実測ペース <b>${trend.kgPerWeek}</b>kg/週</span>` : ''}
        <span>標準体重 <b>${standardWeight(state.profile.heightCm)}</b>kg</span>
      </div>
    </div>

    <div class="card">
      <h2>AIコーチ / 目標カロリーの補正</h2>
      <div class="tip ${advice.delta === 0 ? 'info' : 'warn'}">
        <div class="b">${esc(advice.message)}</div>
      </div>
      ${
        advice.delta !== 0
          ? `<button class="btn primary" data-action="apply-adjustment" data-value="${advice.adjustment}">補正を適用（目標 ${plan.targetKcal} → ${buildPlan({ ...state.profile, adjustment: advice.adjustment }).targetKcal}kcal）</button>`
          : ''
      }
      <p class="note">計算式は誰にでも当てはまる平均値です。2〜3週間の実測が集まったら、そちらを正としてカロリーを調整します。</p>
    </div>

    <div class="card">
      <h2>記録一覧</h2>
      ${
        log.length
          ? `<table class="log"><thead><tr><th>日付</th><th class="num">体重</th><th></th></tr></thead><tbody>
              ${log
                .slice(0, 30)
                .map(
                  (r) => `<tr><td>${r.date}</td><td class="num">${r.weightKg}kg</td>
                    <td class="num"><button class="btn ghost" style="width:auto;padding:2px 8px" data-action="remove-weight" data-date="${r.date}">×</button></td></tr>`,
                )
                .join('')}
            </tbody></table>`
          : '<div class="empty">まだ記録がありません</div>'
      }
    </div>`;
}

/* ------------------------------------------------------------------ 設定 */

function renderSettings(plan) {
  const p = state.profile;
  const opt = (map, selected) =>
    Object.entries(map)
      .map(([key, v]) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${esc(v.label)}</option>`)
      .join('');

  return `
    ${state.profileSet ? '' : '<div class="card"><div class="tip info"><div class="t">まずはここから</div><div class="b">身長・体重・年齢を入れると、あなた専用の目標カロリーが決まります。</div></div></div>'}

    <div class="card">
      <h2>あなたのデータ</h2>
      <div class="grid-2">
        <div class="field"><label for="p-sex">性別</label>
          <select id="p-sex"><option value="male" ${p.sex === 'male' ? 'selected' : ''}>男性</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>女性</option></select>
        </div>
        <div class="field"><label for="p-age">年齢</label><input id="p-age" type="number" inputmode="numeric" value="${p.age}" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label for="p-height">身長 (cm)</label><input id="p-height" type="number" step="0.1" inputmode="decimal" value="${p.heightCm}" /></div>
        <div class="field"><label for="p-weight">現在の体重 (kg)</label><input id="p-weight" type="number" step="0.1" inputmode="decimal" value="${p.weightKg}" /></div>
      </div>
      <div class="field"><label for="p-target">目標体重 (kg)</label><input id="p-target" type="number" step="0.1" inputmode="decimal" value="${p.targetWeightKg}" /></div>
      <div class="field"><label for="p-activity">生活の活動量</label><select id="p-activity">${opt(ACTIVITY_LEVELS, p.activity)}</select></div>
      <div class="field"><label for="p-pace">減量ペース</label><select id="p-pace">${opt(PACES, p.pace)}</select></div>
      <div class="field"><label for="p-adjust">手動補正 (kcal)</label><input id="p-adjust" type="number" step="50" value="${p.adjustment}" /></div>
      <button class="btn primary" data-action="save-profile">保存して計算する</button>
    </div>

    <div class="card">
      <h2>いまの計算結果</h2>
      <div class="stat-row">
        <span>基礎代謝 <b>${plan.bmr}</b>kcal</span>
        <span>消費目安 <b>${plan.tdee}</b>kcal</span>
        <span>目標 <b>${plan.targetKcal}</b>kcal</span>
        <span>1日の赤字 <b>${plan.deficit}</b>kcal</span>
      </div>
      <div class="macro-grid">
        <div class="macro"><b>たんぱく質</b><div class="val">${plan.macros.protein}<small>g</small></div></div>
        <div class="macro"><b>脂質</b><div class="val">${plan.macros.fat}<small>g</small></div></div>
        <div class="macro"><b>炭水化物</b><div class="val">${plan.macros.carbs}<small>g</small></div></div>
      </div>
      ${
        plan.forecast
          ? `<p class="note" style="margin-bottom:0">このペースなら <b>${plan.forecast.kgPerWeek}kg/週</b>、目標の ${state.profile.targetWeightKg}kg まで約 <b>${plan.forecast.weeks}週間</b>（${plan.forecast.days}日）。</p>`
          : '<p class="note" style="margin-bottom:0">目標体重を現在の体重より軽く設定すると、達成までの見込みが出ます。</p>'
      }
      ${plan.shortfall >= 50 ? `<div class="tip warn" style="margin-top:10px"><div class="t">下限で止めました</div><div class="b">指定のペースだと ${plan.floor}kcal を下回るため、安全側に丸めています。これ以上速く落とすのは筋肉と代謝を削るだけです。</div></div>` : ''}
    </div>

    <div class="card">
      <h2>データ</h2>
      <div class="btn-row">
        <button class="btn" data-action="export">バックアップを保存</button>
        <button class="btn" data-action="import">読み込み</button>
      </div>
      <p class="note">記録はこの端末のブラウザ内だけに保存されます。外部に送信されません。</p>
      <button class="btn ghost" data-action="reset" style="color:var(--alert)">すべて消去</button>
      <input type="file" id="import-file" accept="application/json" class="hidden" />
    </div>

    <div class="card">
      <h2>注意</h2>
      <p class="note" style="margin:0">このアプリの数値は一般的な推定式にもとづく目安です。持病・服薬がある場合や、BMI 18.5 を下回る減量は医師に相談してください。</p>
    </div>`;
}

/* --------------------------------------------------------------- レンダリング */

function render() {
  const plan = currentPlan();
  const app = document.getElementById('app');
  const body =
    ui.tab === 'today' ? renderToday(plan) : ui.tab === 'add' ? renderAdd(plan) : ui.tab === 'weight' ? renderWeight(plan) : renderSettings(plan);

  app.innerHTML = `
    <header class="app-header">
      <h1>カロリーコーチ</h1>
      <span class="date">${todayKey()}</span>
    </header>
    <nav class="tabs">
      ${TABS.map((t) => `<button class="${ui.tab === t.id ? 'active' : ''}" data-action="goto" data-tab="${t.id}">${t.label}</button>`).join('')}
    </nav>
    ${body}`;

  if (ui.focus) {
    const el = document.getElementById(ui.focus);
    if (el) {
      el.focus();
      if (el.setSelectionRange && el.type !== 'number') {
        const n = el.value.length;
        try {
          el.setSelectionRange(n, n);
        } catch {
          /* type によっては非対応 */
        }
      }
    }
    ui.focus = null;
  }
}

/* ------------------------------------------------------------------ 操作 */

function addFood(foodId, meal = ui.meal) {
  const food = findFood(foodId, state.customFoods);
  if (!food) return;
  const entry = toEntry(food, 1, meal);
  entry.hour = new Date().getHours();
  getDay(state, todayKey()).entries.push(entry);
  persist();
}

function num(id, fallback = 0) {
  const el = document.getElementById(id);
  const v = Number(el?.value);
  return Number.isFinite(v) ? v : fallback;
}

function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;

  switch (action) {
    case 'goto':
      ui.tab = el.dataset.tab;
      render();
      break;

    case 'set-meal':
      ui.meal = el.dataset.meal;
      render();
      break;

    case 'set-cat':
      ui.category = el.dataset.cat;
      render();
      break;

    case 'add-food':
    case 'quick-add':
      addFood(el.dataset.food);
      if (action === 'quick-add') ui.tab = 'today';
      render();
      break;

    case 'remove-entry': {
      const day = getDay(state, todayKey());
      day.entries = day.entries.filter((x) => x.id !== el.dataset.id);
      persist();
      render();
      break;
    }

    case 'add-custom': {
      const name = document.getElementById('cf-name')?.value.trim();
      if (!name) return;
      const food = {
        id: `custom-${Date.now()}`,
        name,
        cat: '外食・コンビニ',
        unit: document.getElementById('cf-unit')?.value.trim() || '1人前',
        kcal: num('cf-kcal'),
        p: num('cf-p'),
        f: num('cf-f'),
        c: num('cf-c'),
        tags: ['custom'],
      };
      state.customFoods.unshift(food);
      persist();
      addFood(food.id);
      ui.tab = 'today';
      render();
      break;
    }

    case 'add-weight': {
      const date = document.getElementById('w-date')?.value || todayKey();
      const weightKg = num('w-value');
      if (!weightKg) return;
      state.weightLog = state.weightLog.filter((r) => r.date !== date);
      state.weightLog.push({ date, weightKg });
      state.profile.weightKg = weightKg; // 最新体重を計算にも反映
      persist();
      render();
      break;
    }

    case 'remove-weight':
      state.weightLog = state.weightLog.filter((r) => r.date !== el.dataset.date);
      persist();
      render();
      break;

    case 'apply-adjustment':
      state.profile.adjustment = Number(el.dataset.value);
      persist();
      render();
      break;

    case 'save-profile': {
      state.profile = {
        sex: document.getElementById('p-sex').value,
        age: num('p-age', 35),
        heightCm: num('p-height', 170),
        weightKg: num('p-weight', 70),
        targetWeightKg: num('p-target', 65),
        activity: document.getElementById('p-activity').value,
        pace: document.getElementById('p-pace').value,
        adjustment: num('p-adjust', 0),
      };
      state.profileSet = true;
      persist();
      ui.tab = 'today';
      render();
      break;
    }

    case 'export': {
      const blob = new Blob([exportJson(state)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `calorie-coach-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      break;
    }

    case 'import':
      document.getElementById('import-file')?.click();
      break;

    case 'reset':
      if (confirm('すべての記録を消します。よろしいですか？')) {
        state = resetState();
        ui.tab = 'settings';
        render();
      }
      break;

    default:
      break;
  }
}

function handleInput(e) {
  if (e.target.dataset.action === 'search') {
    ui.search = e.target.value;
    ui.focus = 'food-search';
    render();
  }
}

async function handleFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    state = importJson(await file.text());
    persist();
    ui.tab = 'today';
    render();
  } catch (err) {
    alert(`読み込めませんでした: ${err.message}`);
  }
}

const app = document.getElementById('app');
app.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
app.addEventListener('change', (e) => {
  if (e.target.id === 'import-file') handleFile(e);
});

render();

// 圏外・機内モードでも起動できるようにする。
// ローカル開発（http）では登録しない — 古いキャッシュを掴んだまま開発する事故を防ぐため。
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 登録できなくてもアプリ自体は動くので黙って続行する */
    });
  });
}
