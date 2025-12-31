interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestLog {
  timestamp: number;
  endpoint: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 50,
  windowMs: 60 * 60 * 1000 // 1 hour
};

export class RateLimiter {
  private static logs: RequestLog[] = [];
  private static config = DEFAULT_CONFIG;

  static canMakeRequest(endpoint: string = 'default'): boolean {
    this.cleanOldLogs();
    return this.logs.length < this.config.maxRequests;
  }

  static recordRequest(endpoint: string = 'default'): void {
    this.logs.push({
      timestamp: Date.now(),
      endpoint
    });
  }

  private static cleanOldLogs(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
  }

  static getRemainingRequests(): number {
    this.cleanOldLogs();
    return Math.max(0, this.config.maxRequests - this.logs.length);
  }

  static getResetTime(): Date {
    if (this.logs.length === 0) return new Date();
    const oldestLog = Math.min(...this.logs.map(l => l.timestamp));
    return new Date(oldestLog + this.config.windowMs);
  }

  static configure(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
