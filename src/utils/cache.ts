import { CacheToken, Permissions } from "@/constants/cacheKey";
import { ICacheOptions } from "@/types/interface";
import { isNullOrUndefined } from "./utils";

const fix = "v1@";

/**
 * 存储介质适配器
 * @param isSessionStorage
 * @returns
 */
const cacheAdapter = (isSessionStorage?: boolean) => {
  return isSessionStorage ? sessionStorage : localStorage;
};

/**
 * 取缓存值
 * @param {*} key key值
 * @param {*?} options { isSessionStorage:boolean } 是否使用sessionStorage { isParse:boolean } 是否解析 { isDelete:boolean } 是否删除
 * @param {*?} defaultValue 默认值
 *
 * 例 ： import { getCache } from 'cache';
 *       const username = getCache('username')
 */
export const getCache = (key: string, options?: ICacheOptions, defaultValue?: unknown): any => {
  key = fix + key;
  options = { isParse: true, isDelete: false, ...options };
  try {
    const value = cacheAdapter(options.isSessionStorage).getItem(key);
    if (options.isDelete) {
      cacheAdapter(options.isSessionStorage).removeItem(key);
    }
    return isNullOrUndefined(value)
      ? defaultValue
      : options.isParse
        ? value
          ? JSON.parse(value)
          : defaultValue
        : value;
  } catch (error) {
    console.error("getCache", error);
    return defaultValue;
  }
};

/**
 * 设置缓存值
 * @param { String } key 取值时需要
 * @param { Object | string } value 传入对象或字符串类型
 * @param { Boolean? } isSessionStorage 是否设置为sessionStorage
 *
 * 例 ：import { setCache } from 'cache'
 *      setCache('username', { username: '张三' }, false)
 */
export const setCache = (
  key: string,
  value: string | Record<string, unknown> | Array<any>[],
  isSessionStorage?: boolean
): void => {
  key = fix + key;
  cacheAdapter(isSessionStorage).setItem(
    key,
    typeof value === "object" ? JSON.stringify(value) : value
  );
};

/**
 * 清除缓存
 * @param { string } key 要删除缓存的key值
 * @param { boolean }isSessionStorage 是否为sessionStorage
 *
 * 例 ： import { removeCache } from 'cache';
 *       removeCache('username', false)
 */
export const removeCache = (key: string, isSessionStorage?: boolean): void => {
  key = fix + key;
  cacheAdapter(isSessionStorage).removeItem(key);
};

export const getPermissions = (): string => {
  return getCache(Permissions, { isSessionStorage: true }, {});
};

export const getToken = (): string => {
  return getCache(CacheToken, { isSessionStorage: true }, {})["token"];
};
