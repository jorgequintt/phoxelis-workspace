export const lastDocKey = 'last_doc';
export const splashShownKey = 'phoebis_splash_shown';

export function getLastDocument(): string | null {
  return localStorage.getItem(lastDocKey);
}

export function setLastDocument(name: string) {
  localStorage.setItem(lastDocKey, name);
}

export function isSessionActive(): boolean {
  return sessionStorage.getItem(splashShownKey) === '1';
}

export function markSessionActive() {
  sessionStorage.setItem(splashShownKey, '1');
}