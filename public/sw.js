/**
 * Service Worker — 圏外・機内モードでもアプリが起動するようにする。
 *
 * ビルドのたびに JS のファイル名がハッシュで変わるため、資産リストは埋め込まない。
 * 起動に最低限必要なものだけを install 時に取り込み、あとは一度読んだものを
 * そのままキャッシュに載せていく（stale-while-revalidate）。
 *
 * キャッシュがおかしくなったら CACHE の数字を上げれば、次回起動時に全部入れ替わる。
 */

const CACHE = 'calorie-coach-v1';

/** 最低限これだけあればオフラインでも画面が出る */
const SHELL = ['./', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // 1つ失敗しただけで install ごと落ちないように個別に入れる
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 画面遷移・リロードは新しい版を優先し、オフラインならキャッシュしたトップを返す
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((hit) => hit || caches.match(request))),
    );
    return;
  }

  // JS・アイコンなどはキャッシュを即返しつつ、裏で新しい版に差し替えておく
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
