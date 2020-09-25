import { defaultInfiniteOptions, defaultOptions } from '../options'
import { SWRInfiniteKey, SWRResolvedKey } from '../key'
import { watchInfiniteKeyEffect } from '../hooks'
import { resolveInfiniteKey } from '../helpers'
import { watch, shallowReactive, WatchStopHandle } from 'vue'
import { revalidate } from './revalidate'
import { SWROptions, useSWR } from './useSWR'
import { vswr } from './createSWR'
import cache from '../cache'

/**
 * SWR Infinite options.
 */
export interface SWRInfiniteOptions {
  /**
   * Determines the fetcher function to use.
   */
  initialSize: number

  /**
   * Tries to revalidate all pages when we perform a resize.
   */
  revalidateAll: boolean
}

export interface SWRInfiniteResponse<D> {
  /**
   * Contains the data of the pages.
   */
  data: D[]

  /**
   * Resizes the data to the given number of pages.
   */
  resize: (pages: number) => void
}

/**
 * Hook to fetch multiple pages of data.
 * Usefull to implement things like infinite
 * scrolling in an application.
 */
export const useSWRInfinite = <D = any, E = Error>(
  key: SWRInfiniteKey<D>,
  options?: Partial<SWRInfiniteOptions>
): SWRInfiniteResponse<D> => {
  // Infinite SWR options.
  const { initialSize, revalidateAll }: SWRInfiniteOptions = { ...defaultInfiniteOptions, ...options }
  // Individual SWR options
  // Stores each page's data.
  const data = shallowReactive<D[]>([])
  const stoppers: WatchStopHandle[][] = []
  // Resizes the data to the given number of pages.
  const resize = (pages: number) => {
    if (pages < 0) return
    // Resize the array of data. It's important
    // to note that if the new size is lower than the previous
    // then some watchers need to be stoped to avoid a memory leak.
    while (data.length > pages) {
      // Stop the watchers for the particular data.
      for (const stopWatching of stoppers.pop() ?? []) stopWatching()
      // Remove the element from the data.
      data.pop()
    }
    // Iterate with all pages and call SWR on it.
    for (let page = 1; page < pages + 1; page++) {
      const previous = page - 1 > 0 ? data[page - 2] : null
      // Subscribe for cache changes.
      const stopCache = watchInfiniteKeyEffect(key, page, previous, ({ resolvedKey, onInvalidate }) => {
        if (resolvedKey) {
          const handler = ({ detail }: CustomEvent<D>) => {
            data[page - 1] = detail
          }
          cache.subscribe(resolvedKey, handler)
          onInvalidate(() => cache.unsubscribe(resolvedKey, handler))
        }
      })
      // Initial data load and revalidation.
      const stopInitial = watchInfiniteKeyEffect(key, page, previous, ({ resolvedKey }) => {
        if (resolvedKey && cache.has(resolvedKey)) {
          const item = cache.get<D>(resolvedKey)
          if (!item.isResolving()) data[page - 1] = item.data as D
        }
        revalidate(resolvedKey)
      })
      stoppers.push([stopCache, stopInitial])
    }
  }
  // Load the initial data.
  resize(initialSize)
  // Return the results.
  return { data, resize }
}
