import { mutate, SWRMutateValue, SWRMutateOptions } from './mutate'
import { revalidate, SWRRevalidateOptions } from './revalidate'
import { ref, inject, Ref, WatchStopHandle } from 'vue'
import { defaultOptions } from '../options'
import { watchKeyEffect } from '../hooks'
import { resolveKey } from '../helpers'
import { vswr } from './createSWR'
import { SWRKey } from '../key'
import { clear } from './clear'
import errors from '../errors'
import cache from '../cache'

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

  /**
   * This callback will be called every time there's new data available.
   * Keep in mind this will fire after the initial population and after every
   * revalidation's success.
   */
  onData?: (data: D) => void
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

  /**
   * Clears the current key data from the cache.
   */
  clear: () => void

  /**
   * Stops the execution of the watchers. This means the data
   * will unsubscribe from the cache, and will remove all event
   * listeners that used.
   */
  stop: () => void
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
    onData,
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
  const revalidateCurrentWithOptions = () => {
    return revalidateCurrent({ fetcher, dedupingInterval })
  }

  // Clears the current key from the cache.
  const clearCurrent = () => {
    const resolvedKey = resolveKey(key)
    if (resolvedKey) clear([resolvedKey])
  }

  // Subscribe to cache changes.
  const stopCache = watchKeyEffect(key, ({ onInvalidate }) => {
    const resolvedKey = resolveKey(key)
    if (resolvedKey) {
      const handler = ({ detail }: CustomEvent<D>) => {
        data.value = detail
        if (onData) onData(data.value)
      }
      cache.subscribe(resolvedKey, handler)
      onInvalidate(() => cache.unsubscribe(resolvedKey, handler))
    }
  })

  // Subscribe to errors.
  const stopErrors = watchKeyEffect(key, ({ onInvalidate }) => {
    const resolvedKey = resolveKey(key)
    if (resolvedKey) {
      const handler = ({ detail }: CustomEvent<E>) => {
        error.value = detail
      }
      errors.addEventListener(resolvedKey, handler as EventListener)
      onInvalidate(() => errors.removeEventListener(resolvedKey, handler as EventListener))
    }
  })

  // Subscribe to visibility changes to re-validate the data.
  let lastFocus: number | null = null
  const stopVisibility = watchKeyEffect(key, ({ onInvalidate }) => {
    if (revalidateOnFocus) {
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
    }
  })

  // Subscribe to network changes.
  const stopNetwork = watchKeyEffect(key, ({ onInvalidate }) => {
    if (revalidateOnReconnect) {
      if (typeof window !== 'undefined') {
        const handler = () => revalidateCurrentWithOptions()
        window.addEventListener('online', handler)
        onInvalidate(() => window.removeEventListener('online', handler))
      }
    }
  })

  // Initiate the data and refresh it in case a dependency changes.
  const stopInitial = watchKeyEffect(key, () => {
    // Resolve the key
    const resolvedKey = resolveKey(key)
    // Populate the initial data from the cache.
    if (initialData) {
      mutateCurrent(initialData, { revalidate: false })
    } else if (resolvedKey && cache.has(resolvedKey)) {
      const item = cache.get<D>(resolvedKey)
      if (!item.isResolving()) {
        data.value = item.data as D
        if (onData) onData(data.value)
      }
    }
    // Revalidate the component to fetch new data if needed.
    if (revalidateOnMount) revalidateCurrentWithOptions()
  })

  const stop = () => {
    stopCache()
    stopErrors()
    stopVisibility()
    stopNetwork()
    stopInitial()
  }

  return { data, error, mutate: mutateCurrent, revalidate: revalidateCurrent, clear: clearCurrent, stop }
}
