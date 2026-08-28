import { ref, shallowRef } from "vue";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

interface CacheOptions {
  expiry?: number; // 缓存过期时间（毫秒）
  maxSize?: number; // 最大缓存大小
}

export function useDataCache<T = any>(options: CacheOptions = {}) {
  const { expiry = 5 * 60 * 1000, maxSize = 50 } = options; // 默认5分钟过期，最大50个缓存

  const cache = shallowRef<Map<string, CacheItem<T>>>(new Map());
  const cacheStats = ref({
    hits: 0,
    misses: 0,
    size: 0
  });

  const generateKey = (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  };

  const isExpired = (item: CacheItem<T>): boolean => {
    if (!item.expiry) return false;
    return Date.now() > item.timestamp + item.expiry;
  };

  const cleanExpiredItems = () => {
    const now = Date.now();
    const newCache = new Map<string, CacheItem<T>>();

    cache.value.forEach((item, key) => {
      if (!isExpired(item)) {
        newCache.set(key, item);
      }
    });

    cache.value = newCache;
    cacheStats.value.size = cache.value.size;
  };

  const enforceMaxSize = () => {
    if (cache.value.size <= maxSize) return;

    // 删除最旧的缓存项
    const entries = Array.from(cache.value.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, cache.value.size - maxSize);
    toDelete.forEach(([key]) => cache.value.delete(key));

    cacheStats.value.size = cache.value.size;
  };

  const set = (key: string, data: T, customExpiry?: number): void => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: customExpiry || expiry
    };

    cache.value.set(key, item);
    cacheStats.value.size = cache.value.size;

    // 清理过期项和控制缓存大小
    cleanExpiredItems();
    enforceMaxSize();
  };

  const get = (key: string): T | null => {
    const item = cache.value.get(key);

    if (!item) {
      cacheStats.value.misses++;
      return null;
    }

    if (isExpired(item)) {
      cache.value.delete(key);
      cacheStats.value.misses++;
      cacheStats.value.size = cache.value.size;
      return null;
    }

    cacheStats.value.hits++;
    return item.data;
  };

  const has = (key: string): boolean => {
    const item = cache.value.get(key);
    if (!item || isExpired(item)) {
      if (item && isExpired(item)) {
        cache.value.delete(key);
        cacheStats.value.size = cache.value.size;
      }
      return false;
    }
    return true;
  };

  const invalidate = (keyPattern?: string): void => {
    if (!keyPattern) {
      cache.value.clear();
      cacheStats.value.size = 0;
      return;
    }

    const regex = new RegExp(keyPattern);
    const keysToDelete: string[] = [];

    cache.value.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => cache.value.delete(key));
    cacheStats.value.size = cache.value.size;
  };

  const cachedFetch = async <R = T>(
    key: string,
    fetchFunction: () => Promise<R>,
    customExpiry?: number
  ): Promise<R> => {
    // 检查缓存
    const cached = get(key) as R;
    if (cached !== null) {
      return cached;
    }

    // 获取新数据
    const data = await fetchFunction();
    set(key, data as any, customExpiry);

    return data;
  };

  const getHitRate = (): number => {
    const total = cacheStats.value.hits + cacheStats.value.misses;
    return total === 0 ? 0 : (cacheStats.value.hits / total) * 100;
  };

  return {
    cache: cache.value,
    cacheStats,
    generateKey,
    set,
    get,
    has,
    invalidate,
    cachedFetch,
    getHitRate,
    cleanExpiredItems
  };
}
