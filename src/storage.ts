import type { OrderParams, Settings } from './state';
import { DEFAULT_PARAMS, DEFAULT_SETTINGS } from './state';

const KEY = 'mirror-calc:settings';
const PARAMS_KEY = 'mirror-calc:params';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function loadParams(): OrderParams {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    if (!raw) return { ...DEFAULT_PARAMS };
    const parsed = JSON.parse(raw) as Partial<OrderParams>;
    return { ...DEFAULT_PARAMS, ...parsed };
  } catch {
    return { ...DEFAULT_PARAMS };
  }
}

export function saveParams(params: OrderParams): void {
  try {
    localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}
