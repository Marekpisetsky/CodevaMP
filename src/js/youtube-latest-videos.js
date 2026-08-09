// Latest videos: pulls the channel's most recent uploads automatically
// via the YouTube API, so nobody has to paste links by hand. If it
// fails for any reason, the grid just stays empty (see the
// .more-videos:empty CSS rule) and the hand-picked featured video
// above keeps working exactly as before.
export function init() {
  const YOUTUBE_API_KEY = 'AIzaSyC41og2LykuoewS4CnbRCqT3l73O4ksRuw';
  const CHANNEL_ID = 'UCPGRMPnG2ktwn2Tt21zUR4w';
  if (!YOUTUBE_API_KEY) return;

  const container = document.getElementById('more-videos');
  if (!container || typeof fetch !== 'function') return;

  fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`)
    .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status + ' (paso 1: channels)'))
    .then(data => {
      const uploadsId = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsId) return Promise.reject('sin playlist de uploads (paso 1 respondió pero sin datos)');
      return fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=5&key=${YOUTUBE_API_KEY}`);
    })
    .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status + ' (paso 2: playlistItems)'))
    .then(data => {
      const items = (data?.items || [])
        .filter(it => it?.snippet?.resourceId?.videoId)
        .slice(0, 4); // skip the newest one if it matches the featured video, keep up to 4
      items.forEach((it, i) => {
        const vid = it.snippet.resourceId.videoId;
        const title = it.snippet.title;

        const a = document.createElement('a');
        a.className = 'mini-video';
        a.href = 'https://youtu.be/' + vid;
        a.target = '_blank';
        a.rel = 'noopener';
        a.style.animationDelay = (i * 0.09).toFixed(2) + 's';

        const glare = document.createElement('div');
        glare.className = 'glare';

        const ratio = document.createElement('div');
        ratio.className = 'ratio';
        const img = document.createElement('img');
        img.src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
        img.alt = title;
        img.loading = 'lazy';
        const indexTag = document.createElement('span');
        indexTag.className = 'mini-index';
        indexTag.textContent = String(i + 2).padStart(2, '0');
        const playMini = document.createElement('div');
        playMini.className = 'play-mini';
        playMini.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4L20 12L6 20V4Z" fill="var(--white)"/></svg>';
        ratio.appendChild(img);
        ratio.appendChild(indexTag);
        ratio.appendChild(playMini);

        const titleEl = document.createElement('div');
        titleEl.className = 'mini-title';
        titleEl.textContent = title.length > 90 ? title.slice(0, 90).trim() + '…' : title;

        a.appendChild(glare);
        a.appendChild(ratio);
        a.appendChild(titleEl);
        container.appendChild(a);

        a.addEventListener('mousemove', (e) => {
          const rect = a.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          a.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          a.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
      });
    })
    .catch(() => { /* grid stays empty, featured video above is unaffected */ });
}
