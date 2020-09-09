import DefaultCache, { CacheItem } from './cache'
import { ref, watch, inject, Ref, App } from 'vue'

/**
 * Determines how a resolved key looks like.
 */
export type SWRResolvedKey = string

/**
 * Determines the type of the SWR keys.
 */
export type SWRKey = SWRResolvedKey | (() => SWRResolvedKey)

/**
 * Determines the type of the fetcher.
 */
export type SWRFetcher<D = any> = (...props: any[]) => Promise<D>

/**
 * Determines the options available for the SWR configuration.
 */
export interface SWROptions<D = any> {
  /**
   * Determines the fetcher function to use.
   */
  fetcher: SWRFetcher<D>

  /**
   * Represents the initial data to use instead of undefined.
   * Keep in mind the component will still attempt to re-validate
   * unless `revalidateOnMount` is set false.
   */
  initialData: D

  /**
   * Determines if the hook should revalidate the component
   * when it mountes.
   */
  revalidateOnMount: boolean

  /**
   * Determines the dedupling interval.
   * This interval represents the time SWR will
   * avoid to perform a request if the last one was
   * made before `dedupingInterval` ago.
   */
  dedupingInterval: number

  /**
   * Revalidates the data when the window re-gains focus.
   */
  revalidateOnFocus: boolean

  /**
   * Interval throttle for the focus event.
   * This will ignore focus re-validation if it
   * happened last time `focusThrottleInterval` ago.
   */
  focusThrottleInterval: number

  /**
   * Revalidates the daata when a network connect change
   * is detected (basically the browser / app comes back online).
   */
  revalidateOnReconnect: boolean
}

/**
 * Stores the default SWR options.
 */
const defaultOptions: SWROptions = {
  fetcher: (url) => fetch(url).then((res) => res.json()),
  initialData: undefined,
  revalidateOnMount: true,
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  focusThrottleInterval: 5000,
  revalidateOnReconnect: true,
}

/**
 * Determines how the SWR response looks like.
 */
export interface SWRResponse<D, E> {
  /**
   * Stores the data of the HTTP response
   * after the fetcher has proceesed it or undefined
   * in case the HTTP request hasn't finished or there
   * was an error.
   */
  data: Ref<D | undefined>

  /**
   * Determines error of the HTTP response in case
   * it happened or undefined if there was no error or
   * the HTTP request is not completed yet.
   */
  error: Ref<E | undefined>

  /**
   * Mutate alias for the global mutate function without the need
   * to append the key to it.
   */
  mutate: <D>(value?: SWRMutateValue<D>, options?: Partial<SWRMutateOptions>) => void

  /**
   * Revalidation alias for the global revalidate function without the
   * need to append the key to it.
   */
  revalidate: <D>(options?: Partial<SWRRevalidateOptions<D>>) => void
}

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
 * Default values for the revalidate options.
 */
const defaultRevalidateOptions: SWRRevalidateOptions = {
  ...defaultOptions,
  force: false,
}

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
 * Default values for the mutate options.
 */
const defaultMutateOptions: SWRMutateOptions = {
  revalidate: true,
  revalidateOptions: { ...defaultRevalidateOptions },
}

/**
 * Cache used for the storage of the responses.
 */
const cache = new DefaultCache()

/**
 * Stores the errors event target to
 * dispatch errors to different SWR components.
 */
const errors = new EventTarget()

/**
 * Resolves the key into a string.
 */
const resolveKey = (key: SWRKey): SWRResolvedKey | undefined => {
  if (typeof key === 'function') {
    try {
      return key()
    } catch {
      return undefined
    }
  }
  return key
}

/**
 * Requests the data from the server given a key and a fetcher.
 */
const requestData = async <D>(key: SWRResolvedKey, fetcher: SWRFetcher<D>): Promise<D | undefined> => {
  return await fetcher(key).catch((detail) => {
    errors.dispatchEvent(new CustomEvent(key, { detail }))
    return undefined
  })
}

/**
 * Symbol used to provide the app with.
 * It is needed in order to inject it's value.
 */
export const vswr = Symbol('vswr')

/**
 * Creates a SWR configuration provider to use with vue.
 */
export const createSWR = <D>(options: Partial<SWROptions<D>>): ((app: App) => void) => {
  return (app) => {
    app.provide(vswr, options)
  }
}

/**
 * Revalidates the key and mutates the cache if needed.
 */
export const revalidate = <D>(key?: SWRResolvedKey, options?: Partial<SWRRevalidateOptions<D>>): void => {
  // Avoid doing anything if the key resolved to undefined.
  if (!key) return

  // Resolves the options given the defaults.
  const { force, fetcher, dedupingInterval }: SWRRevalidateOptions<D> = { ...defaultRevalidateOptions, ...options }

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
    mutate(key, new CacheItem({ data }).expiresIn(dedupingInterval), { revalidate: false })
  }
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
    ...defaultMutateOptions,
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
  if (revalidateAfterMutation) revalidate(key, revalidateOptions)
}

/**
 * Use hook for the data fetching.
 */
export const useSWR = <D = any, E = Error>(key: SWRKey, options?: Partial<SWROptions<D>>): SWRResponse<D, E> => {
  // Configuration variables merged with the defaults.
  const {
    fetcher,
    initialData,
    revalidateOnMount,
    dedupingInterval,
    revalidateOnFocus,
    focusThrottleInterval,
    revalidateOnReconnect,
  }: SWROptions<D> = {
    // Default options
    ...defaultOptions,
    // Provided global options (from the app).
    ...inject(vswr, {}),
    // Current instance options.
    ...options,
  }

  // Stores the values of the SWR.
  const data = ref<D>()
  const error = ref<E>()

  // Mutates the current SWR key.
  const mutateCurrent = <D>(value?: SWRMutateValue<D>, options?: Partial<SWRMutateOptions>) => {
    return mutate(resolveKey(key), value, options)
  }

  // Revalidates the current SWR key.
  const revalidateCurrent = <D>(options?: Partial<SWRRevalidateOptions<D>>) => {
    return revalidate(resolveKey(key), options)
  }

  // Triggers a revalidation with the options of the hook call.
  const revalidateCurrentWithOptions = () => revalidateCurrent({ fetcher, dedupingInterval })

  // Subscribe to cache changes.
  watch(
    () => resolveKey(key),
    (current, old, onInvalidate) => {
      const resolvedKey = resolveKey(key)
      if (resolvedKey) {
        const handler = ({ detail }: CustomEvent<D>) => {
          data.value = detail
        }
        cache.subscribe(resolvedKey, handler)
        onInvalidate(() => cache.unsubscribe(resolvedKey, handler))
      }
    },
    { immediate: true }
  )

  // Subscribe to errors.
  watch(
    () => resolveKey(key),
    (_current, _old, onInvalidate) => {
      const resolvedKey = resolveKey(key)
      if (resolvedKey) {
        const handler = ({ detail }: CustomEvent<E>) => {
          error.value = detail
        }
        errors.addEventListener(resolvedKey, handler as EventListener)
        onInvalidate(() => errors.removeEventListener(resolvedKey, handler as EventListener))
      }
    },
    { immediate: true }
  )

  // Subscribe to visibility changes to re-validate the data.
  if (revalidateOnFocus) {
    let lastFocus: number | null = null
    watch(
      () => resolveKey(key),
      (_current, _old, onInvalidate) => {
        if (typeof window !== 'undefined') {
          const handler = () => {
            const now = Date.now()
            if (lastFocus === null || now - lastFocus > focusThrottleInterval) {
              lastFocus = now
              revalidateCurrentWithOptions()
            }
          }
          window.addEventListener('focus', handler)
          onInvalidate(() => window.removeEventListener('focus', handler))
        }
      },
      { immediate: true }
    )
  }

  // Subscribe to network changes.
  if (revalidateOnReconnect) {
    watch(
      () => resolveKey(key),
      (_current, _old, onInvalidate) => {
        if (typeof window !== 'undefined') {
          const handler = () => revalidateCurrentWithOptions()
          window.addEventListener('online', handler)
          onInvalidate(() => window.removeEventListener('online', handler))
        }
      },
      { immediate: true }
    )
  }

  // Initiate the data and refresh it in case a dependency changes.
  watch(
    () => resolveKey(key),
    () => {
      // Resolve the key
      const resolvedKey = resolveKey(key)
      // Populate the initial data from the cache.
      if (initialData) {
        mutateCurrent(initialData, { revalidate: false })
      } else if (resolvedKey && cache.has(resolvedKey)) {
        const item = cache.get<D>(resolvedKey)
        if (!item.isResolving()) data.value = item.data as D
      }
      // Revalidate the component to fetch new data if needed.
      if (revalidateOnMount) revalidateCurrentWithOptions()
    },
    { immediate: true }
  )

  return { data, error, mutate: mutateCurrent, revalidate: revalidateCurrent }
}
