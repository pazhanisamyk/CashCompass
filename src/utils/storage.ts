let cache: Record<string, string> = {};

let saveTimeout: any = null;
const saveToServer = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cache),
    }).catch(err => console.error('Failed to sync to db.json:', err));
  }, 100);
};

export const initStorage = async () => {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      cache = data || {};
    }
  } catch (e) {
    console.error('Failed to load db.json, using empty fallback:', e);
    cache = {};
  }
};

export const storage = {
  getItem(key: string): string | null {
    const val = cache[key];
    return val !== undefined ? val : null;
  },
  setItem(key: string, value: string): void {
    cache[key] = value;
    saveToServer();
  },
  removeItem(key: string): void {
    delete cache[key];
    saveToServer();
  },
  clear(): void {
    cache = {};
    saveToServer();
  }
};
