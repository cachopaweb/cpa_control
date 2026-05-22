import type { ThemeMode } from '../data/types';

const THEME_STORAGE_KEY = 'cpa-control:theme-mode:v1';
const legacyThemeStorageKey = 'theme-mode';
const storageCache = new Map<string, string | null>();

function getStorageValue(key: string) {
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key));
  }

  return storageCache.get(key);
}

function setStorageValue(key: string, value: string) {
  localStorage.setItem(key, value);
  storageCache.set(key, value);
}

export function getStoredThemeMode(): ThemeMode {
  const saved = getStorageValue(THEME_STORAGE_KEY) ?? getStorageValue(legacyThemeStorageKey);

  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

export function setStoredThemeMode(mode: ThemeMode) {
  setStorageValue(THEME_STORAGE_KEY, mode);
}
