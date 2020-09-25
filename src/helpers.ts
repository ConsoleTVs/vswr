import { SWRInfiniteKey, SWRKey, SWRResolvedKey } from './key'
import { SWRFetcher } from './api/useSWR'
import errors from './errors'

/**
 * Resolves the key into a string.
 */
export const resolveKey = (key: SWRKey): SWRResolvedKey | undefined => {
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
 * Resolves the infinite key at the given page with
 * the given previous data.
 */
export const resolveInfiniteKey = <D>(
  key: SWRInfiniteKey<D>,
  page: number,
  previous: D | null
): SWRResolvedKey | undefined => {
  if (typeof key === 'function') {
    try {
      return key(page, (previous as unknown) as D)
    } catch {
      return undefined
    }
  }
  return key
}

/**
 * Requests the data from the server given a key and a fetcher.
 */
export const requestData = async <D>(key: SWRResolvedKey, fetcher: SWRFetcher<D>): Promise<D | undefined> => {
  return await fetcher(key).catch((detail) => {
    errors.dispatchEvent(new CustomEvent(key, { detail }))
    return undefined
  })
}
