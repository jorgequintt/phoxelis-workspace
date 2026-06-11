const IMAGE_KEY = 'refImageBase64';
const PANZOOM_KEY = 'refImagePanzoomConfig';

/**
 * Save a reference image (as base64) to localStorage.
 * Returns true on success, false if the image is too large.
 */
export function saveRefImageToStorage(base64: string): boolean {
  try {
    localStorage.setItem(IMAGE_KEY, base64);
    return true;
  } catch {
    console.warn('Failed to save reference image — storage may be full');
    return false;
  }
}

/**
 * Load the saved reference image base64 string.
 * Returns null if no image is stored.
 */
export function loadRefImageFromStorage(): string | null {
  try {
    return localStorage.getItem(IMAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the refImage panzoom config (scale, x, y) to localStorage.
 */
export function saveRefImagePanzoomConfig(
  scale: number,
  x: number,
  y: number,
): void {
  try {
    localStorage.setItem(
      PANZOOM_KEY,
      JSON.stringify({ scale, x, y }),
    );
  } catch {
    console.warn('Failed to save refImage panzoom config');
  }
}

/**
 * Load the saved panzoom config.
 * Returns null if no config is stored.
 */
export function loadRefImagePanzoomConfig(): { scale: number; x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(PANZOOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.scale === 'number' &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the saved reference image and panzoom config from storage.
 */
export function clearRefImageStorage(): void {
  try {
    localStorage.removeItem(IMAGE_KEY);
    localStorage.removeItem(PANZOOM_KEY);
  } catch {
    // ignore
  }
}

/**
 * Convert a file to a base64 data URL.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
