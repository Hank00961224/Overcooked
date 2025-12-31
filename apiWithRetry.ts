interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000
};

export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error: any) {
      lastError = error;
      
      const status = error?.response?.status || error?.status;
      
      // Don't retry on client errors except rate limiting
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}
