import { revalidate, SWRRevalidateOptions } from './revalidate'
import { defaultMutateOptions } from '../options'
import cache, { CacheItem } from '../cache'
import { SWRResolvedKey } from '../key'
import { vswr } from './createSWR'
import { inject } from 'vue'

/**
 * Mutation options.
 */
export interface SWRMutateOptions {
  /**
   * Determines if the mutation should attempt to revalidate the data afterwards.
   */
  revalidate: boolean

  /**
   * Determines the revalidation options passed to revalidate in case
   * the parameter `revalidate` is set to true.
   */
  revalidateOptions: Partial<SWRRevalidateOptions>
}

/**
 * Determines how a function state value looks like.
 */
export type SWRFunctionStateValue<D> = (state: D | null) => D

/**
 * Determines how a SWR mutate value looks like.
 */
export type SWRMutateValue<D> = null | D | CacheItem<D | undefined> | SWRFunctionStateValue<D>

/**
 * Mutates the data of a given key with a new value.
 * This is used to replace the cache contents of the
 * given key manually.
 */
export const mutate = <D>(
  key?: SWRResolvedKey,
  value?: SWRMutateValue<D>,
  options?: Partial<SWRMutateOptions>
): void => {
  // Avoid doing anything if the key resolved to undefined.
  if (!key) return

  // Get the configuration option of the mutate.
  const { revalidate: revalidateAfterMutation, revalidateOptions }: SWRMutateOptions = {
    // Default options
    ...defaultMutateOptions,
    // Provided global options (from the app).
    ...inject(vswr, {}),
    // Current instance options.
    ...options,
  }

  // Define the mutation data, this also resolves the previous
  // state if needed by the value (in case it's a function).
  let data: D | CacheItem<D | undefined> | null | undefined
  if (typeof value === 'function') {
    let state: D | null = null
    if (cache.has(key)) {
      const item = cache.get<D>(key)
      if (!item.isResolving()) state = item.data as D
    }
    data = (value as SWRFunctionStateValue<D>)(state)
  } else {
    data = value
  }

  // To mutate, we only need to change the value
  // of the cache, since all hooks are already subscribed
  // to cache changes on the respective key. Please note the
  // expiration time of this cache item is set to null, meaning
  // it will be expired by default and replaced by fresh data when possible.
  cache.set(key, data instanceof CacheItem ? data : new CacheItem({ data }))

  // Check if there's the need to re-validate the data.
  //! CIRCULAR DEPENDENCY; PLEASE TAKE CARE IF YOU ARE WILLING TO MODIFY
  //! THE FOLLOWING LINE. THE REVALIDATE METHOD MUST NEVER CALL MUTATE AGAIN
  //! WITH THE REVALIDATE = TRUE PARAMETER.
  if (revalidateAfterMutation) revalidate(key, revalidateOptions)
}
