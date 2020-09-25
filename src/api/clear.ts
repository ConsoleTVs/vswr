import { defaultClearOptions } from '../options'
import { SWRResolvedKey } from '../key'
import cache from '../cache'

/**
 * Determines the clear options.
 */
export interface ClearOptions {
  /**
   * Determines if the cache should broadcast
   * the change across the active hooks. This will
   * cause the current instances to resolve to undefined.
   * If set to false, the cache will be cleared, meaning further
   * calls will require a fetch, but current instances will remain
   * with the same data till revalidated.
   */
  broadcast: boolean
}

/**
 * Clear the specified keys from the cache. If no keys
 * are specified, it clears all the cache keys.
 */
export const clear = (keys?: SWRResolvedKey[] | null, options?: Partial<ClearOptions>) => {
  const { broadcast }: ClearOptions = { ...defaultClearOptions, ...options }
  if (keys === undefined || keys === null) return cache.clear({ broadcast })
  for (const key of keys) cache.remove(key, { broadcast })
}
