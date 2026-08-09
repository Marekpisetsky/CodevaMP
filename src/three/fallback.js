export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch (e) {
    return false;
  }
}

export function showStaticFallback(container, logoUrl) {
  container.classList.add('hero-voxel-fallback');
  const img = document.createElement('img');
  img.src = logoUrl;
  img.alt = 'CodevaMP';
  container.appendChild(img);
}
