import type { ThemeMode } from '../../data/types';

export type ResolvedTheme = 'light' | 'dark';

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

export function subscribeToSystemTheme(onChange: (theme: ResolvedTheme) => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => onChange(media.matches ? 'dark' : 'light');

  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
