interface CacheEntry {
  url: string;
  timestamp: number;
  source: 'pexels' | 'unsplash' | 'local';
}

interface CacheKey {
  gender?: string;
  style?: string;
  occasion?: string;
  weather?: string;
  category: 'person' | 'top' | 'bottom' | 'accessory';
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'outfit_cache_';

export class ImageCache {
  private static generateKey(params: CacheKey): string {
    const parts = [
      params.gender || 'any',
      params.style || 'any',
      params.occasion || 'any',
      params.weather || 'any',
      params.category
    ];
    return CACHE_PREFIX + parts.join('_');
  }

  static get(params: CacheKey): string | null {
    const key = this.generateKey(params);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    try {
      const entry: CacheEntry = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;
      
      if (age > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return entry.url;
    } catch {
      return null;
    }
  }

  static set(params: CacheKey, url: string, source: CacheEntry['source']): void {
    const key = this.generateKey(params);
    const entry: CacheEntry = {
      url,
      timestamp: Date.now(),
      source
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // Quota exceeded, clear old entries
      this.clearOldEntries();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {
        console.warn('Cache storage failed');
      }
    }
  }

  private static clearOldEntries(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (!key.startsWith(CACHE_PREFIX)) return;
      
      try {
        const entry: CacheEntry = JSON.parse(localStorage.getItem(key)!);
        if (now - entry.timestamp > CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      } catch {}
    });
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
