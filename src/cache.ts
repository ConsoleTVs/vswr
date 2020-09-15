import type {SWRResolvedKey} from './swr'

/**
 * Determines how a cache item data looks like.
 */
export interface CacheItemData<D> {
  /**
   * Determines the data that's stored in the cache.
   */
  data: D | Promise<D>

  /**
   * Determines the expiration date for the given set of data.
   */
  expiresAt?: Date | null
}

/**
 * Determines the type of the cache items.
 */
export class CacheItem<D = unknown> {
  /**
   * Determines the data that's stored in the cache.
   */
  data: D | Promise<D>

  /**
   * Determines the expiration date for the given set of data.
   */
  expiresAt: Date | null

  /**
   * Creates the cache item given the data and expiration at.
   */
  constructor({ data, expiresAt = null }: CacheItemData<D>) {
    this.data = data
    this.expiresAt = expiresAt
  }

  /**
   * Determines if the current cache item is still being resolved.
   * This returns true if data is a promise, or false if type `D`.
   */
  isResolving(): boolean {
    return this.data instanceof Promise
  }

  /**
   * Determines if the given cache item has expired.
   */
  hasExpired(): boolean {
    return this.expiresAt === null || this.expiresAt < new Date()
  }

  /**
   * Set the expiration time of the given cache item relative to now.
   */
  expiresIn(milliseconds: number): this {
    this.expiresAt = new Date()
    this.expiresAt.setMilliseconds(this.expiresAt.getMilliseconds() + milliseconds)
    return this
  }
}

/**
 * Represents the methods a cache should implement
 * in order to be usable by vue-swr.
 */
export interface SWRCache {
  /**
   * Gets an item from the cache.
   */
  get<D>(key: SWRResolvedKey): CacheItem<D>

  /**
   * Sets an item to the cache.
   */
  set<D>(key: SWRResolvedKey, value: CacheItem<D>): void

  /**
   * Removes a key-value pair from the cache.
   */
  remove(key: SWRResolvedKey): void

  /**
   * Removes all the key-value pairs from the cache.
   */
  clear(): void

  /**
   * Determines if the cache has a given key.
   */
  has(key: SWRResolvedKey): boolean

  /**
   * Subscribes to the given key for changes.
   */
  subscribe<D>(key: SWRResolvedKey, callback: (event: CustomEvent<D>) => void): void

  /**
   * Unsubscribes to the given key events.
   */
  unsubscribe<D>(key: SWRResolvedKey, callback: (event: CustomEvent<D>) => void): void
}

/**
 * Default cache implementation for vue-cache.
 */
export default class DefaultCache implements SWRCache {
  /**
   * Stores the elements of the cache in a key-value pair.
   */
  private elements: Map<string, CacheItem> = new Map()

  /**
   * Stores the event target instance to dispatch and receive events.
   */
  private event: EventTarget = new EventTarget()

  /**
   *
   * @param value
   */
  private resolve<D>(key: SWRResolvedKey, value: CacheItem<D>) {
    Promise.resolve(value.data).then((detail) => {
      if (detail === undefined || detail === null) {
        // The value resolved to undefined, and we delete
        // it from the cache and don't broadcast any event.
        this.remove(key)
        return
      }
      // Update the value with the resolved one.
      value.data = detail
      // Broadcast the update to all other cache subscriptions.
      this.event.dispatchEvent(new CustomEvent(key, { detail }))
    })
  }

  /**
   * Gets an element from the cache.
   *
   * It is assumed the item always exist when
   * you get it. Use the has method to check
   * for the existence of it.
   */
  get<D>(key: string): CacheItem<D> {
    return this.elements.get(key) as CacheItem<D>
  }

  /**
   * Sets an element to the cache.
   */
  set<D>(key: SWRResolvedKey, value: CacheItem<D>): void {
    this.elements.set(key, value)
    this.resolve(key, value)
  }

  /**
   * Removes an key-value pair from the cache.
   */
  remove(key: SWRResolvedKey): void {
    this.elements.delete(key)
  }

  /**
   * Removes all the key-value pairs from the cache.
   */
  clear(): void {
    this.elements.clear()
  }

  /**
   * Determines if the given key exists
   * in the cache.
   */
  has(key: SWRResolvedKey): boolean {
    return this.elements.has(key)
  }

  /**
   * Subscribes the callback to the given key.
   */
  subscribe<D>(key: SWRResolvedKey, callback: (event: CustomEvent<D>) => void): void {
    this.event.addEventListener(key, callback as EventListener)
  }

  /**
   * Unsubscribes to the given key events.
   */
  unsubscribe<D>(key: SWRResolvedKey, callback: (event: CustomEvent<D>) => void): void {
    this.event.removeEventListener(key, callback as EventListener)
  }
}
