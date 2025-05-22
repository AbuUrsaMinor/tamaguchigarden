/**
 * Tests if OffscreenCanvas is supported in this browser
 * @returns true if OffscreenCanvas is supported
 */
export function isOffscreenCanvasSupported(): boolean {
  return typeof window !== 'undefined' && 'OffscreenCanvas' in window;
}

/**
 * Tests if structured clone is supported for transferring complex objects to workers
 * @returns true if structured clone is supported
 */
export function isStructuredCloneSupported(): boolean {
  try {
    window.structuredClone({ test: true });
    return true;
  } catch (e) {
    return false;
  }
}
