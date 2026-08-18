/**
 * 食品データベース（1 食あたりの目安値）。
 * 日本食品標準成分表と一般的な外食・コンビニ商品の公表値をもとにした概算値。
 * kcal / p(たんぱく質 g) / f(脂質 g) / c(炭水化物 g)
 * tags はコーチが食べ方のクセを見るために使う。
 */

export const CATEGORIES = [
  '主食',
  '主菜',
  '副菜',
  '汁物',
  '乳製品・卵',
  '果物',
  '飲料',
  '間食',
  '外食・コンビニ',
  '調味料',
];

export const FOODS = [
  // ---- 主食 ----
  { id: 'rice150', name: 'ごはん（茶碗1杯）', cat: '主食', unit: '150g', kcal: 234, p: 3.8, f: 0.5, c: 55.7, tags: ['carb'] },
  { id: 'rice100', name: 'ごはん（少なめ）', cat: '主食', unit: '100g', kcal: 156, p: 2.5, f: 0.3, c: 37.1, tags: ['carb'] },
  { id: 'ricebrown', name: '玄米ごはん（茶碗1杯）', cat: '主食', unit: '150g', kcal: 228, p: 4.2, f: 1.5, c: 53.4, tags: ['carb', 'fiber'] },
  { id: 'bread6', name: '食パン6枚切り 1枚', cat: '主食', unit: '60g', kcal: 149, p: 5.3, f: 2.5, c: 27.8, tags: ['carb'] },
  { id: 'bread8', name: '食パン8枚切り 1枚', cat: '主食', unit: '45g', kcal: 112, p: 4.0, f: 1.9, c: 20.9, tags: ['carb'] },
  { id: 'onigiri', name: 'おにぎり 1個', cat: '主食', unit: '110g', kcal: 180, p: 3.2, f: 0.6, c: 39.0, tags: ['carb'] },
  { id: 'udon', name: 'うどん ゆで 1玉', cat: '主食', unit: '230g', kcal: 242, p: 6.0, f: 0.9, c: 49.9, tags: ['carb'] },
  { id: 'soba', name: 'そば ゆで 1玉', cat: '主食', unit: '180g', kcal: 237, p: 8.6, f: 1.8, c: 43.2, tags: ['carb', 'fiber'] },
  { id: 'ramen_noodle', name: '中華麺 ゆで 1玉', cat: '主食', unit: '230g', kcal: 343, p: 11.5, f: 1.4, c: 64.4, tags: ['carb'] },
  { id: 'pasta', name: 'パスタ 乾麺 100g', cat: '主食', unit: '乾100g', kcal: 347, p: 12.9, f: 1.8, c: 66.9, tags: ['carb'] },
  { id: 'mochi', name: '切り餅 1個', cat: '主食', unit: '50g', kcal: 112, p: 2.0, f: 0.3, c: 25.4, tags: ['carb'] },
  { id: 'cereal', name: 'シリアル（グラノーラ）', cat: '主食', unit: '40g', kcal: 176, p: 3.0, f: 5.8, c: 30.0, tags: ['carb', 'sweet'] },
  { id: 'sweetpotato', name: 'さつまいも（蒸し）', cat: '主食', unit: '150g', kcal: 198, p: 1.8, f: 0.3, c: 47.0, tags: ['carb', 'fiber'] },

  // ---- 主菜 ----
  { id: 'chicken_breast', name: '鶏むね肉 皮なし', cat: '主菜', unit: '100g', kcal: 105, p: 23.3, f: 1.9, c: 0.1, tags: ['protein'] },
  { id: 'chicken_sasami', name: 'ささみ', cat: '主菜', unit: '100g', kcal: 98, p: 23.9, f: 0.8, c: 0.1, tags: ['protein'] },
  { id: 'chicken_thigh_skinless', name: '鶏もも肉 皮なし', cat: '主菜', unit: '100g', kcal: 113, p: 19.0, f: 5.0, c: 0, tags: ['protein'] },
  { id: 'chicken_thigh', name: '鶏もも肉 皮つき', cat: '主菜', unit: '100g', kcal: 190, p: 16.6, f: 14.2, c: 0, tags: ['protein', 'highfat'] },
  { id: 'saladchicken', name: 'サラダチキン 1個', cat: '主菜', unit: '110g', kcal: 114, p: 24.1, f: 1.5, c: 0.3, tags: ['protein'] },
  { id: 'pork_koma', name: '豚こま・肩ロース', cat: '主菜', unit: '100g', kcal: 220, p: 18.5, f: 15.1, c: 0.2, tags: ['protein', 'highfat'] },
  { id: 'pork_bara', name: '豚バラ肉', cat: '主菜', unit: '100g', kcal: 366, p: 14.4, f: 35.4, c: 0.1, tags: ['protein', 'highfat'] },
  { id: 'beef_momo', name: '牛もも肉', cat: '主菜', unit: '100g', kcal: 182, p: 21.2, f: 9.6, c: 0.5, tags: ['protein'] },
  { id: 'ground_meat', name: '合いびき肉', cat: '主菜', unit: '100g', kcal: 250, p: 17.5, f: 19.0, c: 0.3, tags: ['protein', 'highfat'] },
  { id: 'salmon', name: '鮭 1切れ', cat: '主菜', unit: '80g', kcal: 106, p: 17.8, f: 3.3, c: 0.1, tags: ['protein'] },
  { id: 'saba', name: 'さば 1切れ', cat: '主菜', unit: '80g', kcal: 169, p: 16.5, f: 13.4, c: 0.2, tags: ['protein'] },
  { id: 'saba_can', name: 'さば水煮缶（固形）', cat: '主菜', unit: '140g', kcal: 264, p: 29.2, f: 15.2, c: 0.3, tags: ['protein'] },
  { id: 'tuna_water', name: 'ツナ缶（水煮）1缶', cat: '主菜', unit: '70g', kcal: 50, p: 11.2, f: 0.5, c: 0.1, tags: ['protein'] },
  { id: 'tuna_oil', name: 'ツナ缶（油漬）1缶', cat: '主菜', unit: '70g', kcal: 186, p: 12.4, f: 15.0, c: 0.1, tags: ['protein', 'highfat'] },
  { id: 'shrimp', name: 'えび', cat: '主菜', unit: '100g', kcal: 82, p: 18.4, f: 0.3, c: 0.1, tags: ['protein'] },
  { id: 'squid', name: 'いか', cat: '主菜', unit: '100g', kcal: 76, p: 17.9, f: 0.8, c: 0.1, tags: ['protein'] },
  { id: 'natto', name: '納豆 1パック', cat: '主菜', unit: '45g', kcal: 90, p: 7.4, f: 4.5, c: 5.4, tags: ['protein', 'fiber'] },
  { id: 'tofu_momen', name: '木綿豆腐 half丁', cat: '主菜', unit: '150g', kcal: 110, p: 10.5, f: 6.9, c: 2.3, tags: ['protein'] },
  { id: 'tofu_kinu', name: '絹ごし豆腐 half丁', cat: '主菜', unit: '150g', kcal: 84, p: 8.0, f: 5.3, c: 2.7, tags: ['protein'] },

  // ---- 副菜 ----
  { id: 'greensalad', name: '葉物サラダ（ドレなし）', cat: '副菜', unit: '100g', kcal: 14, p: 0.8, f: 0.1, c: 2.3, tags: ['veg', 'fiber'] },
  { id: 'broccoli', name: 'ブロッコリー ゆで', cat: '副菜', unit: '80g', kcal: 30, p: 3.5, f: 0.3, c: 5.2, tags: ['veg', 'fiber'] },
  { id: 'spinach', name: 'ほうれん草のおひたし', cat: '副菜', unit: '70g', kcal: 18, p: 2.0, f: 0.3, c: 2.4, tags: ['veg', 'fiber'] },
  { id: 'cabbage', name: 'キャベツ千切り', cat: '副菜', unit: '80g', kcal: 18, p: 1.0, f: 0.2, c: 4.2, tags: ['veg', 'fiber'] },
  { id: 'mushroom', name: 'きのこソテー', cat: '副菜', unit: '80g', kcal: 45, p: 2.4, f: 3.1, c: 3.4, tags: ['veg', 'fiber'] },
  { id: 'hijiki', name: 'ひじきの煮物', cat: '副菜', unit: '60g', kcal: 60, p: 1.5, f: 2.5, c: 8.0, tags: ['veg', 'fiber', 'salty'] },
  { id: 'kinpira', name: 'きんぴらごぼう', cat: '副菜', unit: '60g', kcal: 85, p: 1.5, f: 4.0, c: 10.5, tags: ['veg', 'fiber', 'salty'] },
  { id: 'wakame_salad', name: 'わかめサラダ', cat: '副菜', unit: '50g', kcal: 12, p: 0.9, f: 0.1, c: 2.0, tags: ['veg', 'fiber'] },
  { id: 'tomato', name: 'トマト 1個', cat: '副菜', unit: '150g', kcal: 30, p: 1.1, f: 0.2, c: 7.0, tags: ['veg', 'fiber'] },
  { id: 'kimchi', name: 'キムチ', cat: '副菜', unit: '50g', kcal: 23, p: 1.2, f: 0.1, c: 3.9, tags: ['veg', 'fiber', 'salty'] },
  { id: 'edamame', name: '枝豆（可食部）', cat: '副菜', unit: '50g', kcal: 63, p: 5.9, f: 3.1, c: 4.2, tags: ['veg', 'fiber', 'protein'] },
  { id: 'potatosalad', name: 'ポテトサラダ', cat: '副菜', unit: '80g', kcal: 133, p: 1.3, f: 9.2, c: 11.4, tags: ['highfat'] },

  // ---- 汁物 ----
  { id: 'miso', name: 'みそ汁 1杯', cat: '汁物', unit: '180ml', kcal: 40, p: 3.0, f: 1.2, c: 4.5, tags: ['salty'] },
  { id: 'wakame_soup', name: 'わかめスープ 1杯', cat: '汁物', unit: '180ml', kcal: 20, p: 1.0, f: 0.6, c: 2.4, tags: ['salty'] },
  { id: 'tonjiru', name: '豚汁 1杯', cat: '汁物', unit: '200ml', kcal: 130, p: 6.0, f: 7.0, c: 10.0, tags: ['salty', 'fiber'] },
  { id: 'consomme', name: 'コンソメスープ 1杯', cat: '汁物', unit: '180ml', kcal: 15, p: 0.6, f: 0.3, c: 2.4, tags: ['salty'] },

  // ---- 乳製品・卵 ----
  { id: 'egg', name: '卵 1個', cat: '乳製品・卵', unit: '50g', kcal: 71, p: 6.1, f: 5.1, c: 0.2, tags: ['protein'] },
  { id: 'milk', name: '牛乳 200ml', cat: '乳製品・卵', unit: '200ml', kcal: 134, p: 6.6, f: 7.6, c: 9.6, tags: ['protein'] },
  { id: 'milk_low', name: '低脂肪乳 200ml', cat: '乳製品・卵', unit: '200ml', kcal: 92, p: 7.6, f: 2.0, c: 11.0, tags: ['protein'] },
  { id: 'soymilk', name: '無調整豆乳 200ml', cat: '乳製品・卵', unit: '200ml', kcal: 92, p: 7.2, f: 4.0, c: 6.2, tags: ['protein'] },
  { id: 'yogurt', name: 'ヨーグルト 無糖', cat: '乳製品・卵', unit: '100g', kcal: 62, p: 3.6, f: 3.0, c: 4.9, tags: ['protein'] },
  { id: 'greek_yogurt', name: 'ギリシャヨーグルト 無糖', cat: '乳製品・卵', unit: '100g', kcal: 59, p: 10.2, f: 0.2, c: 4.2, tags: ['protein'] },
  { id: 'cheese', name: 'プロセスチーズ 1個', cat: '乳製品・卵', unit: '18g', kcal: 61, p: 4.1, f: 4.7, c: 0.2, tags: ['protein', 'highfat'] },
  { id: 'protein_shake', name: 'プロテイン 1杯', cat: '乳製品・卵', unit: '30g', kcal: 118, p: 22.0, f: 1.5, c: 4.0, tags: ['protein'] },

  // ---- 果物 ----
  { id: 'banana', name: 'バナナ 1本', cat: '果物', unit: '90g', kcal: 84, p: 1.0, f: 0.2, c: 20.3, tags: ['fruit', 'fiber'] },
  { id: 'apple', name: 'りんご 1/2個', cat: '果物', unit: '150g', kcal: 80, p: 0.2, f: 0.2, c: 21.3, tags: ['fruit', 'fiber'] },
  { id: 'mikan', name: 'みかん 1個', cat: '果物', unit: '80g', kcal: 37, p: 0.6, f: 0.1, c: 9.6, tags: ['fruit', 'fiber'] },
  { id: 'kiwi', name: 'キウイ 1個', cat: '果物', unit: '85g', kcal: 45, p: 0.9, f: 0.1, c: 11.0, tags: ['fruit', 'fiber'] },
  { id: 'blueberry', name: 'ブルーベリー', cat: '果物', unit: '50g', kcal: 25, p: 0.3, f: 0.1, c: 6.4, tags: ['fruit', 'fiber'] },

  // ---- 飲料 ----
  { id: 'water', name: '水・お茶・ブラックコーヒー', cat: '飲料', unit: '1杯', kcal: 0, p: 0, f: 0, c: 0, tags: [] },
  { id: 'canned_coffee', name: '缶コーヒー（加糖）', cat: '飲料', unit: '185ml', kcal: 70, p: 1.3, f: 1.3, c: 13.0, tags: ['sweet', 'liquidcal'] },
  { id: 'latte', name: 'カフェラテ M', cat: '飲料', unit: '300ml', kcal: 180, p: 8.0, f: 9.0, c: 15.0, tags: ['liquidcal'] },
  { id: 'cola', name: 'コーラ 500ml', cat: '飲料', unit: '500ml', kcal: 225, p: 0, f: 0, c: 56.5, tags: ['sweet', 'liquidcal'] },
  { id: 'sportsdrink', name: 'スポーツドリンク 500ml', cat: '飲料', unit: '500ml', kcal: 100, p: 0, f: 0, c: 25.0, tags: ['sweet', 'liquidcal'] },
  { id: 'orangejuice', name: 'オレンジジュース 200ml', cat: '飲料', unit: '200ml', kcal: 84, p: 1.4, f: 0.2, c: 21.0, tags: ['sweet', 'liquidcal'] },
  { id: 'beer', name: 'ビール 350ml', cat: '飲料', unit: '350ml', kcal: 140, p: 1.1, f: 0, c: 10.9, tags: ['alcohol', 'liquidcal'] },
  { id: 'highball', name: 'ハイボール 350ml', cat: '飲料', unit: '350ml', kcal: 70, p: 0, f: 0, c: 0, tags: ['alcohol'] },
  { id: 'sake', name: '日本酒 1合', cat: '飲料', unit: '180ml', kcal: 196, p: 0.7, f: 0, c: 8.8, tags: ['alcohol', 'liquidcal'] },
  { id: 'shochu', name: '焼酎 水割り', cat: '飲料', unit: '90ml', kcal: 130, p: 0, f: 0, c: 0, tags: ['alcohol'] },
  { id: 'wine', name: 'ワイン グラス', cat: '飲料', unit: '120ml', kcal: 88, p: 0.1, f: 0, c: 1.8, tags: ['alcohol'] },
  { id: 'chuhai', name: 'チューハイ 350ml（7%）', cat: '飲料', unit: '350ml', kcal: 200, p: 0, f: 0, c: 12.0, tags: ['alcohol', 'sweet', 'liquidcal'] },

  // ---- 間食 ----
  { id: 'potatochips', name: 'ポテトチップス 1袋', cat: '間食', unit: '60g', kcal: 336, p: 3.0, f: 21.0, c: 32.8, tags: ['sweet', 'highfat', 'salty', 'snack'] },
  { id: 'chocolate', name: '板チョコ 1/2枚', cat: '間食', unit: '25g', kcal: 139, p: 1.7, f: 8.5, c: 13.0, tags: ['sweet', 'highfat', 'snack'] },
  { id: 'cookie', name: 'クッキー 3枚', cat: '間食', unit: '30g', kcal: 154, p: 1.7, f: 8.1, c: 18.6, tags: ['sweet', 'highfat', 'snack'] },
  { id: 'icecream', name: 'アイス カップ', cat: '間食', unit: '120ml', kcal: 212, p: 3.5, f: 9.0, c: 29.0, tags: ['sweet', 'snack'] },
  { id: 'dorayaki', name: 'どら焼き 1個', cat: '間食', unit: '70g', kcal: 199, p: 4.5, f: 2.2, c: 40.6, tags: ['sweet', 'snack'] },
  { id: 'senbei', name: 'せんべい 2枚', cat: '間食', unit: '20g', kcal: 75, p: 1.5, f: 0.2, c: 16.8, tags: ['snack', 'salty'] },
  { id: 'pudding', name: 'プリン 1個', cat: '間食', unit: '100g', kcal: 116, p: 5.5, f: 5.0, c: 13.8, tags: ['sweet', 'snack'] },
  { id: 'nuts', name: 'ミックスナッツ（素焼き）', cat: '間食', unit: '25g', kcal: 155, p: 5.0, f: 13.5, c: 4.5, tags: ['highfat', 'snack', 'fiber'] },
  { id: 'proteinbar', name: 'プロテインバー 1本', cat: '間食', unit: '1本', kcal: 200, p: 15.0, f: 8.0, c: 20.0, tags: ['protein', 'snack'] },
  { id: 'castella', name: 'カステラ 1切れ', cat: '間食', unit: '50g', kcal: 156, p: 3.3, f: 2.3, c: 31.0, tags: ['sweet', 'snack'] },

  // ---- 外食・コンビニ ----
  { id: 'gyudon', name: '牛丼 並盛', cat: '外食・コンビニ', unit: '1杯', kcal: 635, p: 20.0, f: 20.4, c: 92.8, tags: ['carb', 'salty'] },
  { id: 'katsudon', name: 'カツ丼', cat: '外食・コンビニ', unit: '1杯', kcal: 900, p: 32.0, f: 30.0, c: 120.0, tags: ['carb', 'fried', 'highfat'] },
  { id: 'ramen_shoyu', name: 'ラーメン（醤油）', cat: '外食・コンビニ', unit: '1杯', kcal: 500, p: 20.0, f: 15.0, c: 70.0, tags: ['carb', 'salty'] },
  { id: 'ramen_tonkotsu', name: '豚骨・家系ラーメン', cat: '外食・コンビニ', unit: '1杯', kcal: 700, p: 25.0, f: 30.0, c: 80.0, tags: ['carb', 'salty', 'highfat'] },
  { id: 'chahan', name: 'チャーハン', cat: '外食・コンビニ', unit: '1皿', kcal: 700, p: 16.0, f: 22.0, c: 105.0, tags: ['carb', 'highfat', 'salty'] },
  { id: 'curry', name: 'カレーライス', cat: '外食・コンビニ', unit: '1皿', kcal: 700, p: 15.0, f: 20.0, c: 110.0, tags: ['carb', 'highfat'] },
  { id: 'pasta_pepe', name: 'パスタ（ペペロンチーノ）', cat: '外食・コンビニ', unit: '1皿', kcal: 600, p: 17.0, f: 20.0, c: 85.0, tags: ['carb', 'highfat'] },
  { id: 'burger', name: 'ハンバーガー 1個', cat: '外食・コンビニ', unit: '1個', kcal: 260, p: 13.0, f: 10.0, c: 30.0, tags: ['highfat'] },
  { id: 'fries_m', name: 'フライドポテト M', cat: '外食・コンビニ', unit: 'M', kcal: 410, p: 5.0, f: 20.0, c: 51.0, tags: ['fried', 'highfat', 'salty'] },
  { id: 'karaage', name: '唐揚げ 3個', cat: '外食・コンビニ', unit: '90g', kcal: 260, p: 14.0, f: 17.0, c: 10.0, tags: ['fried', 'highfat', 'protein'] },
  { id: 'gyoza', name: '餃子 5個', cat: '外食・コンビニ', unit: '5個', kcal: 250, p: 9.0, f: 13.0, c: 24.0, tags: ['highfat'] },
  { id: 'sushi', name: '寿司 1人前（10貫）', cat: '外食・コンビニ', unit: '10貫', kcal: 500, p: 25.0, f: 8.0, c: 80.0, tags: ['carb', 'protein'] },
  { id: 'bento_makunouchi', name: '幕の内弁当', cat: '外食・コンビニ', unit: '1個', kcal: 650, p: 22.0, f: 18.0, c: 95.0, tags: ['carb', 'salty'] },
  { id: 'bento_karaage', name: 'から揚げ弁当', cat: '外食・コンビニ', unit: '1個', kcal: 850, p: 26.0, f: 33.0, c: 105.0, tags: ['carb', 'fried', 'highfat'] },
  { id: 'sandwich', name: 'サンドイッチ（ハムたまご）', cat: '外食・コンビニ', unit: '1個', kcal: 350, p: 14.0, f: 19.0, c: 30.0, tags: ['highfat'] },
  { id: 'kake_soba', name: 'かけそば', cat: '外食・コンビニ', unit: '1杯', kcal: 300, p: 12.0, f: 2.0, c: 57.0, tags: ['carb', 'salty'] },
  { id: 'teishoku_fish', name: '焼き魚定食', cat: '外食・コンビニ', unit: '1食', kcal: 600, p: 30.0, f: 15.0, c: 85.0, tags: ['carb', 'protein'] },
  { id: 'pizza', name: 'ピザ 2切れ', cat: '外食・コンビニ', unit: '2切れ', kcal: 480, p: 20.0, f: 22.0, c: 50.0, tags: ['highfat', 'salty'] },

  // ---- 調味料 ----
  { id: 'mayo', name: 'マヨネーズ 大さじ1', cat: '調味料', unit: '12g', kcal: 80, p: 0.2, f: 9.0, c: 0.2, tags: ['highfat'] },
  { id: 'dressing', name: '和風ドレッシング 大さじ1', cat: '調味料', unit: '15g', kcal: 25, p: 0.3, f: 1.7, c: 2.4, tags: ['salty'] },
  { id: 'ketchup', name: 'ケチャップ 大さじ1', cat: '調味料', unit: '15g', kcal: 18, p: 0.3, f: 0, c: 4.1, tags: ['sweet'] },
  { id: 'sugar', name: '砂糖 小さじ1', cat: '調味料', unit: '3g', kcal: 12, p: 0, f: 0, c: 3.0, tags: ['sweet'] },
  { id: 'oil', name: 'サラダ油 大さじ1', cat: '調味料', unit: '12g', kcal: 111, p: 0, f: 12.0, c: 0, tags: ['highfat'] },
  { id: 'butter', name: 'バター 10g', cat: '調味料', unit: '10g', kcal: 70, p: 0.1, f: 8.1, c: 0, tags: ['highfat'] },
  { id: 'soysauce', name: '醤油 大さじ1', cat: '調味料', unit: '18g', kcal: 13, p: 1.4, f: 0, c: 1.8, tags: ['salty'] },
];

/** id から食品を引く */
export function findFood(id, customFoods = []) {
  return [...FOODS, ...customFoods].find((f) => f.id === id) || null;
}

/**
 * 名前の部分一致で検索する（かな・漢字そのまま）。
 * @param {string} query
 * @param {{category?:string, customFoods?:Array}} opts
 */
export function searchFoods(query, { category = '', customFoods = [] } = {}) {
  const all = [...customFoods, ...FOODS];
  const q = (query || '').trim().toLowerCase();
  return all.filter((f) => {
    if (category && f.cat !== category) return false;
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || (f.tags || []).some((t) => t.includes(q));
  });
}

/**
 * 食品 × 量 から記録エントリを作る。
 * @param {object} food
 * @param {number} amount 何人前・何倍か
 * @param {'朝'|'昼'|'夕'|'間食'} meal
 */
export function toEntry(food, amount, meal) {
  const a = Number(amount) || 1;
  const r1 = (n) => Math.round(n * 10) / 10;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    foodId: food.id,
    name: food.name,
    unit: food.unit,
    amount: a,
    meal,
    cat: food.cat,
    tags: food.tags || [],
    kcal: Math.round(food.kcal * a),
    protein: r1(food.p * a),
    fat: r1(food.f * a),
    carbs: r1(food.c * a),
  };
}
