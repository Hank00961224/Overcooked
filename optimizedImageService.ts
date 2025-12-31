import { ImageCache } from './imageCache';
import { RateLimiter } from './rateLimiter';
import { getLocalFallback } from './localImageLibrary';
import { fetchWithRetry } from './apiWithRetry';

interface ImageRequest {
  gender?: string;
  style?: string;
  occasion?: string;
  weather?: string;
  category: 'person' | 'top' | 'bottom' | 'accessory';
  query: string;
}

interface ImageResult {
  url: string;
  source: 'cache' | 'pexels' | 'unsplash' | 'local';
  fromCache: boolean;
  quotaWarning?: boolean;
}

export class OptimizedImageService {
  private imageReuse: Map<string, string> = new Map();

  async fetchImage(request: ImageRequest): Promise<ImageResult> {
    // Check cache first
    const cached = ImageCache.get({
      gender: request.gender,
      style: request.style,
      occasion: request.occasion,
      weather: request.weather,
      category: request.category
    });

    if (cached) {
      return {
        url: cached,
        source: 'cache',
        fromCache: true
      };
    }

    // Check if we can reuse existing image
    const reuseKey = `${request.category}_${request.style}`;
    if (this.imageReuse.has(reuseKey)) {
      return {
        url: this.imageReuse.get(reuseKey)!,
        source: 'cache',
        fromCache: true
      };
    }

    // Check rate limit
    if (!RateLimiter.canMakeRequest('image')) {
      const localUrl = getLocalFallback(request.category, request.style);
      return {
        url: localUrl,
        source: 'local',
        fromCache: false,
        quotaWarning: true
      };
    }

    // Try external APIs with retry
    try {
      const url = await this.fetchFromExternalAPI(request.query);
      
      // Cache the result
      ImageCache.set({
        gender: request.gender,
        style: request.style,
        occasion: request.occasion,
        weather: request.weather,
        category: request.category
      }, url, 'pexels');

      // Store for reuse
      this.imageReuse.set(reuseKey, url);
      
      RateLimiter.recordRequest('image');
      
      return {
        url,
        source: 'pexels',
        fromCache: false
      };
    } catch (error) {
      console.warn('External API failed, using local fallback', error);
      const localUrl = getLocalFallback(request.category, request.style);
      return {
        url: localUrl,
        source: 'local',
        fromCache: false
      };
    }
  }

  private async fetchFromExternalAPI(query: string): Promise<string> {
    return fetchWithRetry(async () => {
      // Your existing Pexels/Unsplash API call
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
        headers: { Authorization: 'YOUR_API_KEY' }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium;
      }

      throw new Error('No images found');
    });
  }

  getRemainingQuota(): number {
    return RateLimiter.getRemainingRequests();
  }

  clearCache(): void {
    ImageCache.clear();
    this.imageReuse.clear();
  }
}
