import { resolveKey, resolveInfiniteKey } from './helpers'
import { watch, WatchStopHandle } from 'vue'
import { SWRInfiniteKey, SWRKey, SWRResolvedKey } from './key'

interface WatchKeyCallbackOptions {
  resolvedKey?: SWRResolvedKey
  onInvalidate: (cb: () => void) => void
}

/**
 * Watches the key and executes the callback when it changes.
 */
export const watchKeyEffect = (
  key: SWRKey,
  callback: (parameters: WatchKeyCallbackOptions) => void
): WatchStopHandle => {
  return watch(
    () => resolveKey(key),
    (resolvedKey, _old, onInvalidate) => callback({ resolvedKey, onInvalidate }),
    { immediate: true }
  )
}

/**
 * Watches the infinite key at the given page with the given previous data.
 */
export const watchInfiniteKeyEffect = <D>(
  key: SWRInfiniteKey<D>,
  page: number,
  previous: D | null,
  callback: (parameters: WatchKeyCallbackOptions) => void
): WatchStopHandle => {
  return watch(
    () => resolveInfiniteKey(key, page, previous),
    (resolvedKey, _old, onInvalidate) => callback({ resolvedKey, onInvalidate }),
    { immediate: true }
  )
}
