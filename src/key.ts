/**
 * Determines how a resolved key looks like.
 */
export type SWRResolvedKey = string

/**
 * Determines the type of the SWR keys.
 */
export type SWRKey = SWRResolvedKey | (() => SWRResolvedKey)

/**
 * Determines the key used in the useSWRInfinite hook.
 */
export type SWRInfiniteKey<D> = SWRResolvedKey | ((page: number, previous: D) => SWRResolvedKey)
