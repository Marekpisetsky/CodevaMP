// Live subscriber count: fetches the real number from the YouTube Data
// API and updates the counter's data-value before it animates into
// view. If the key is missing or the request fails for any reason,
// it silently keeps the hardcoded fallback already in the HTML —
// the page never shows a broken or blank number.
export function init() {
  const YOUTUBE_API_KEY = 'AIzaSyC41og2LykuoewS4CnbRCqT3l73O4ksRuw';
  const CHANNEL_ID = 'UCPGRMPnG2ktwn2Tt21zUR4w';
  if (!YOUTUBE_API_KEY) return;

  const el = document.querySelector('.proof-number.counter[data-format="k1"]');
  if (!el || typeof fetch !== 'function') return;

  fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`)
    .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
    .then(data => {
      const count = data?.items?.[0]?.statistics?.subscriberCount;
      if (count) el.dataset.value = count;
    })
    .catch(() => { /* keeps the static fallback already in the HTML */ });
}
