import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of items in cache
}

// Cache prefixes for different data types
export const CACHE_PREFIXES = {
  // AI Content (longer TTL since it rarely changes)
  AI_CONTENT: 'ai_content',
  TRANSFORMATION: 'transformation',
  AFFIRMATIONS: 'affirmations',
  POSITIVE_BELIEF: 'positive_belief',
  DAILY_BOOST: 'daily_boost',
  
  // User Data (medium TTL)
  USER_PROFILE: 'user_profile',
  USER_ONBOARDING: 'user_onboarding',
  SUBSCRIPTION: 'subscription',
  VOICE_ID: 'voice_id',
  
  // Session Data (shorter TTL since it changes frequently)
  SESSIONS: 'sessions',
  STREAK: 'streak',
  DAILY_REPETITIONS: 'daily_repetitions',
  COMPLETED_DATES: 'completed_dates',
  
  // Belief Data (medium TTL)
  BELIEFS: 'beliefs',
  BELIEF_PROGRESS: 'belief_progress',
  BELIEF_RATINGS: 'belief_ratings',
  CURRENT_BELIEF: 'current_belief',
  
  // Audio Data (longer TTL since it's expensive to generate)
  AUDIO_URLS: 'audio_urls',
  AFFIRMATION_AUDIO: 'affirmation_audio',
  DAILY_BOOST_AUDIO: 'daily_boost_audio',
  TRANSFORMATION_AUDIO: 'transformation_audio',
  
  // UI State (short TTL)
  UI_STATE: 'ui_state',
  SCREEN_STATE: 'screen_state',
  
  // App Settings (long TTL)
  APP_SETTINGS: 'app_settings',
  USER_PREFERENCES: 'user_preferences'
} as const;

class CacheService {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheItem<any>>;

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
    this.memoryCache = new Map();
  }

  // Generate cache key from parameters
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Check if cache item is still valid
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Get item from cache
  async get<T>(prefix: string, params: Record<string, any>): Promise<T | null> {
    const key = this.generateKey(prefix, params);
    
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data as T;
    }

    // Check AsyncStorage
    try {
      const storedItem = await AsyncStorage.getItem(key);
      if (storedItem) {
        const item: CacheItem<T> = JSON.parse(storedItem);
        if (!this.isExpired(item)) {
          // Update memory cache
          this.memoryCache.set(key, item);
          return item.data;
        } else {
          // Remove expired item
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  // Set item in cache
  async set<T>(prefix: string, params: Record<string, any>, data: T, ttl?: number): Promise<void> {
    const key = this.generateKey(prefix, params);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    };

    // Update memory cache
    this.memoryCache.set(key, item);

    // Manage cache size
    if (this.memoryCache.size > this.config.maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    // Update AsyncStorage
    try {
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Invalidate cache by prefix
  async invalidate(prefix: string): Promise<void> {
    const keysToRemove: string[] = [];

    // Remove from memory cache
    for (const [key] of this.memoryCache) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.memoryCache.delete(key));

    // Remove from AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemoveFromStorage = allKeys.filter(key => key.startsWith(prefix));
      if (keysToRemoveFromStorage.length > 0) {
        await AsyncStorage.multiRemove(keysToRemoveFromStorage);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get cache statistics
  getStats(): { memorySize: number; memoryKeys: string[] } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys())
    };
  }

  // Preload critical data for app startup
  async preloadCriticalData(userId: string): Promise<void> {
    try {
      // This will be called on app startup to preload essential data
      console.log('Preloading critical data for user:', userId);
      
      // The actual preloading will be done by individual services
      // This is just a placeholder for the preload mechanism
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }

  // Clear user-specific cache (when user logs out)
  async clearUserCache(userId: string): Promise<void> {
    try {
      // Clear all user-specific cache entries
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes(`userId:${userId}`));
      
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
      }

      // Clear from memory cache
      for (const [key] of this.memoryCache) {
        if (key.includes(`userId:${userId}`)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }
}

// Create specialized cache instances for different data types
export const aiContentCache = new CacheService({ ttl: 60 * 60 * 1000, maxSize: 50 }); // 1 hour
export const userCache = new CacheService({ ttl: 10 * 60 * 1000, maxSize: 50 }); // 10 minutes
export const sessionCache = new CacheService({ ttl: 5 * 60 * 1000, maxSize: 50 }); // 5 minutes
export const beliefCache = new CacheService({ ttl: 15 * 60 * 1000, maxSize: 30 }); // 15 minutes
export const audioCache = new CacheService({ ttl: 30 * 60 * 1000, maxSize: 100 }); // 30 minutes
export const uiCache = new CacheService({ ttl: 2 * 60 * 1000, maxSize: 20 }); // 2 minutes
export const settingsCache = new CacheService({ ttl: 24 * 60 * 60 * 1000, maxSize: 10 }); // 24 hours

// Main cache instance for general use
export const appCache = new CacheService({ ttl: 5 * 60 * 1000, maxSize: 100 });

export default CacheService; 