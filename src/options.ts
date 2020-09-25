import { CacheRemoveOptions, CacheClearOptions } from './cache'
import { SWRInfiniteOptions } from './api/useSWRInfinite'
import { SWRRevalidateOptions } from './api/revalidate'
import { SWRMutateOptions } from './api/mutate'
import { ClearOptions } from './api/clear'
import { SWROptions } from './api/useSWR'
import { SWRResolvedKey } from './key'

/**
 * Default fetcher function. Keep in mind it requires fetch() API.
 */
const fetcher = <D>(url: SWRResolvedKey): Promise<D> => fetch(url).then((res) => res.json())

/**
 * Stores the default SWR options.
 */
export const defaultOptions: SWROptions = {
  fetcher,
  initialData: undefined,
  revalidateOnMount: true,
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  focusThrottleInterval: 5000,
  revalidateOnReconnect: true,
  onData: undefined,
}

/**
 * Default values for the revalidate options.
 */
export const defaultRevalidateOptions: SWRRevalidateOptions = {
  ...defaultOptions,
  force: false,
}

/**
 * Default values for the mutate options.
 */
export const defaultMutateOptions: SWRMutateOptions = {
  revalidate: true,
  revalidateOptions: { ...defaultRevalidateOptions },
}

/**
 * Default options for SWRInfinite hook.
 */
export const defaultInfiniteOptions: SWRInfiniteOptions = {
  initialSize: 1,
  revalidateAll: false,
}

/**
 * Default clear options.
 */
export const defaultClearOptions: ClearOptions = {
  broadcast: false,
}

/**
 * Default cache removal options.
 */
export const defaultCacheRemoveOptions: CacheRemoveOptions = {
  broadcast: false,
}

/**
 * Default cache clear options.
 */
export const defaultCacheClearOptions: CacheClearOptions = {
  broadcast: false,
}
