import { SWR, SWRKey, SWROptions, SWRMutateOptions, SWRRevalidateOptions, CacheClearOptions } from 'swrev'
import { ref, getCurrentInstance, onUnmounted, watch, computed } from 'vue'

export class VSWR extends SWR {
  /**
   * Use the SWR with a vue application.
   */
  useSWR<D = any, E = Error>(key: SWRKey | undefined | (() => SWRKey | undefined), options?: Partial<SWROptions<D>>) {
    // Contains the data and errors references.
    const data = ref<D | undefined>()
    const error = ref<E | undefined>()

    // Handlers that will be executed when data changes.
    const onData = (d: D) => {
      // Set the last error to undefined
      // since we just got a correct data.
      error.value = undefined
      // Set the data's value to the new value.
      data.value = d
    }
    const onError = (e: E) => (error.value = e)

    // Subscribe and use the SWR fetch using the given key.
    const stop = watch(
      () => this.resolveKey(key),
      (_values, _oldValues, onInvalidate) => {
        // Subscribe to the new key.
        const unsubscribe = this.use<D, E>(key, onData, onError, {
          loadInitialCache: true,
          ...options,
        }).unsubscribe
        // Side effect invalidation to clear the subscription.
        onInvalidate(() => unsubscribe())
      },
      { immediate: true }
    )

    // Check if there's an active component
    // to automatically clean up when the component
    // goes out of scope.
    const currentInstance = getCurrentInstance()
    if (currentInstance) onUnmounted(() => stop())

    // Mutates the current key.
    const mutate = (value: D, options: Partial<SWRMutateOptions<D>>) => {
      return this.mutate(this.resolveKey(key), value, options)
    }

    // Revalidates the current key.
    const revalidate = (options: Partial<SWRRevalidateOptions<D>>) => {
      return this.revalidate(this.resolveKey(key), options)
    }

    // Clears the current key from cache.
    const clear = (options: Partial<CacheClearOptions>) => {
      return this.clear(this.resolveKey(key), options)
    }

    // Determines if the request is still on its way
    // and therefore, it's still loading.
    const isLoading = computed(() => data.value === undefined && error.value === undefined)

    // Determines if the data is valid. This means that
    // there is no error associated with the data.
    // This exists because errors do not wipe the data value
    // and can still be used.
    const isValid = computed(() => data.value !== undefined && error.value === undefined)

    // Return the data.
    return { data, error, mutate, revalidate, clear, stop, isLoading, isValid }
  }
}

/**
 * Creates a mew SWR instance and exports basic methods to
 * work with without the need for method calling.
 */
export const createSWR = <D = any>(options?: Partial<SWROptions<D>>) => new VSWR(options)

/**
 * Default SWR instance. Can be replaced
 * with the `createDefaultSWR` function.
 */
export let swr = createSWR()

/**
 * Creates and sets a default SWR instance given
 * the options.
 */
export const createDefaultSWR = <D = any>(options?: Partial<SWROptions<D>>) => {
  swr = createSWR<D>(options)
  return swr
}

/**
 * Gets the data of the given key. Keep in mind
 * this data will be stale and revalidate in the background
 * unless specified otherwise.
 */
export const subscribe = <D>(key: SWRKey | undefined, onData: (value: D) => any) => {
  return swr.subscribe<D>(key, onData)
}

/**
 * Subscribes to errors on the given key.
 */
export const subscribeErrors = <E>(key: SWRKey | undefined, onError: (error: E) => any) => {
  return swr.subscribeErrors<E>(key, onError)
}

/**
 * Gets the current cached data of the given key.
 * This does not trigger any revalidation nor mutation
 * of the data.
 * - If the data has never been validated
 * (there is no cache) it will return undefined.
 * - If the item is pending to resolve (there is a request
 * pending to resolve) it will return undefined.
 */
export const get = <D = any>(key?: SWRKey): D | undefined => {
  return swr.get<D>(key)
}

/**
 * Gets an element from the cache. The difference
 * with the get is that this method returns a promise
 * that will resolve the the value. If there's no item
 * in the cache, it will wait for it before resolving.
 */
export const getOrWait = <D = any>(key: SWRKey): Promise<D> => {
  return swr.getOrWait<D>(key)
}

/**
 * Use a SWR value given the key and
 * subscribe to future changes.
 */
export const use = <D = any, E = Error>(
  key: SWRKey | undefined | (() => SWRKey | undefined),
  onData: (value: D) => void,
  onError: (error: E) => void,
  options?: Partial<SWROptions<D>>
) => {
  return swr.use<D, E>(key, onData, onError, options)
}

/**
 * Use the SWR with a vue application.
 */
export const useSWR = <D = any, E = Error>(key: SWRKey | (() => SWRKey), options?: Partial<SWROptions<D>>) => {
  return swr.useSWR<D, E>(key, options)
}

/**
 * Mutates the data of a given key with a new value.
 * This is used to replace the cache contents of the
 * given key manually.
 */
export const mutate = <D = any>(key: SWRKey, value: D, options?: Partial<SWRMutateOptions<D>>) => {
  return swr.mutate<D>(key, value, options)
}

/**
 * Revalidates the key and mutates the cache if needed.
 */
export const revalidate = <D>(key: SWRKey, options?: Partial<SWRRevalidateOptions<D>>) => {
  return swr.revalidate(key, options)
}

/**
 * Clear the specified keys from the cache. If no keys
 * are specified, it clears all the cache keys.
 */
export const clear = (keys?: string | string[], options?: Partial<CacheClearOptions>) => {
  return swr.clear(keys, options)
}
