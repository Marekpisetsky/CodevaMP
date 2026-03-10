export type UiLanguageCode = "es" | "en";

export type UiCopyMap<Key extends string> = Record<Key, { es: string; en: string }>;

export function resolveUiCopy<Key extends string>(
  copy: UiCopyMap<Key>,
  language: UiLanguageCode,
  key: Key
): string {
  return copy[key][language];
}

export function createUiCopyResolver<Key extends string>(
  copy: UiCopyMap<Key>,
  language: UiLanguageCode
) {
  return (key: Key) => resolveUiCopy(copy, language, key);
}
