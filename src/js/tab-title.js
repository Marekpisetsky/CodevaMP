// Tab-title easter egg: the title changes when you look away, and
// reverts the moment you come back.
export function init() {
  const originalTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'No te vayas... 🔥' : originalTitle;
  });
}
