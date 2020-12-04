import { defaultRevalidateOptions } from '../options'
import cache, { CacheItem } from '../cache'
import { requestData } from '../helpers'
import { SWRResolvedKey } from '../key'
import { SWROptions } from './useSWR'
import { mutate } from './mutate'
import { vswr } from './createSWR'

/**
 * Determines how the revalidation options look like.
 */
export interface SWRRevalidateOptions<D = any> extends Pick<SWROptions<D>, 'fetcher' | 'dedupingInterval'> {
  /**
   * Determines if the re-validation should be forced.
   * When a re-validation is forced, the dedupingInterval
   * will be ignored and a fetch will be performed.
   */
  force: boolean
}

/**
 * Revalidates the key and mutates the cache if needed.
 */
export const revalidate = <D>(key?: SWRResolvedKey, options?: Partial<SWRRevalidateOptions<D>>): void => {
  // Avoid doing anything if the key resolved to undefined.
  if (!key) return

  // Resolves the options given the defaults.
  const { force, fetcher, dedupingInterval }: SWRRevalidateOptions<D> = {
    // Default options
    ...defaultRevalidateOptions,
    // Provided global options (from the app).
    ...inject(vswr, {}),
    // Current instance options.
    ...options,
  }

  // Stores the data to mutate (if any).
  let data: undefined | Promise<D | undefined> = undefined

  // Check the cache for the expiration.
  if (force || !cache.has(key) || (cache.has(key) && cache.get(key).hasExpired())) {
    // We have a forced fetch or there's an item in the
    // cache and it has expired, thus we need to refetch the data.
    data = requestData(key, fetcher)
  }
  // Don't mutate if the data is undefined. Keep in mind
  // this would still mutate values when Promise<undefined>
  // meaning the request has failed and the cache takes care of it.
  if (data !== undefined) {
    //! CIRCULAR DEPENDENCY; PLEASE TAKE CARE IF YOU ARE WILLING TO MODIFY
    //! THE FOLLOWING LINE. THE MUTATE METHOD MUST NEVER BE CALLED WITH
    //! THE REVALIDATE = TRUE PARAMETER.
    mutate(key, new CacheItem({ data }).expiresIn(dedupingInterval), { revalidate: false })
  }
}
