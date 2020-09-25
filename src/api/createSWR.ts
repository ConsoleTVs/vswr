import { SWROptions } from './useSWR'
import { Plugin } from 'vue'

/**
 * Symbol used to provide the app with.
 * It is needed in order to inject it's value.
 */
export const vswr = Symbol('vswr')

/**
 * Creates a SWR configuration provider to use with vue.
 */
export const createSWR = <D>(options: Partial<SWROptions<D>>): Plugin => {
  return (app) => {
    app.provide(vswr, options)
  }
}
