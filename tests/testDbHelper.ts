import { Page } from '@playwright/test';

/**
 * Resets all IndexedDB tables for clean test isolation.
 * Works with or without dev test hooks (__lexiDb) by falling back to standard browser IndexedDB API.
 */
export async function clearTestDatabase(page: Page) {
  await page.evaluate(async () => {
    const lexiDb = (window as any).__lexiDb;
    if (lexiDb && lexiDb.tables) {
      await Promise.all(lexiDb.tables.map((t: any) => t.clear()));
      return;
    }
    // Safe standard IndexedDB fallback when production build tree-shakes __lexiDb
    await new Promise<void>((resolve) => {
      const req = window.indexedDB.open('LexiDatabase');
      req.onsuccess = () => {
        const db = req.result;
        const names = Array.from(db.objectStoreNames);
        if (names.length === 0) {
          db.close();
          return resolve();
        }
        const tx = db.transaction(names, 'readwrite');
        for (const name of names) {
          tx.objectStore(name).clear();
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      };
      req.onerror = () => resolve();
    });
  });
}

/**
 * Seeds practice preferences into IndexedDB without exposing window hooks in production.
 */
export async function seedPracticePreferences(page: Page, preferences: any) {
  await page.evaluate(async (prefs) => {
    const lexiDb = (window as any).__lexiDb;
    if (lexiDb && lexiDb.practicePreferences) {
      await lexiDb.practicePreferences.put(prefs);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const req = window.indexedDB.open('LexiDatabase');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(['practicePreferences'], 'readwrite');
        tx.objectStore('practicePreferences').put(prefs);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  }, preferences);
}
