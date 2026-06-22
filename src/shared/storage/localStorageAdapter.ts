/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function safeLoad<T>(key: string, defaultValue: T): T {
  try {
    const local = localStorage.getItem(key);
    if (local && local !== "undefined" && local !== "null") {
      const parsed = JSON.parse(local);
      if (parsed !== null && parsed !== undefined) {
        if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          console.warn(`Localstorage mismatch for key "${key}": expected array, got difference.`);
          return defaultValue;
        }
        if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.warn(`Localstorage mismatch for key "${key}": expected object, got difference.`);
            return defaultValue;
          }
        }
        return parsed as T;
      }
    }
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}":`, err);
  }
  return defaultValue;
}

export function safeSave(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`[QuotaExceededError] La clave "${key}" excedió la cuota de localStorage (5MB). Optimizando espacio...`);
      
      if (Array.isArray(value)) {
        const reduced = value.map(item => {
          if (item && typeof item === 'object') {
            return { ...item, raw_base64: undefined };
          }
          return item;
        });
        try {
          localStorage.setItem(key, JSON.stringify(reduced));
          console.warn(`[QuotaExceededError Fix] Guardada copia optimizada (sin base64) para "${key}" exitosamente.`);
          return;
        } catch (innerErr) {
          console.error(`[QuotaExceededError Fatal] Incluso sin base64 falló el guardado para "${key}":`, innerErr);
        }
      }
    } else {
      console.error(`Error guardando en localStorage key "${key}":`, err);
    }
  }
}
