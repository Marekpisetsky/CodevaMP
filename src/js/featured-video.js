// Featured video: loads as a fast static thumbnail, and only becomes
// a real YouTube embed once the person actually clicks play — so it
// stays fast by default, but plays right on the page instead of
// sending people away to YouTube.
export function init() {
  const frame = document.getElementById('video-frame');
  const ratio = document.getElementById('video-ratio');
  if (!frame || !ratio) return;
  const VIDEO_ID = 'Ch9qbFszYt8';

  function playInline() {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?autoplay=1&rel=0';
    iframe.title = 'CodevaMP · video destacado';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    ratio.innerHTML = '';
    ratio.appendChild(iframe);
    frame.removeAttribute('role');
    frame.removeAttribute('tabindex');
    frame.removeAttribute('aria-label');
    frame.style.cursor = 'default';
  }

  frame.addEventListener('click', playInline);
  frame.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playInline();
    }
  });
}
