export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const dataSaver = !!(navigator.connection && navigator.connection.saveData);
export const hoverCapable = window.matchMedia('(hover: hover)').matches;
