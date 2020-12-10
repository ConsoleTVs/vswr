![Vue SWR - Stale-While-Revalidate (SWR) strategy to fetch data in Vue 3](https://raw.githubusercontent.com/ConsoleTVs/vswr/master/vswr.svg)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Upgrade guide](#upgrade-guide)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration options](#configuration-options)
- [Global configuration options](#global-configuration-options)
- [Dependent fetching](#dependent-fetching)
- [Re-validate on demand](#re-validate-on-demand)
- [Mutate on demand](#mutate-on-demand)
- [Manual subscription](#manual-subscription)
- [Get values from the cache](#get-values-from-the-cache)
- [Error handling](#error-handling)
- [Clear Cache](#clear-cache)
- [FAQ](#faq)

## Introduction

Quote from [vercel's SWR](https://swr.vercel.app/) for react:

> The name “SWR” is derived from stale-while-revalidate, a HTTP cache invalidation strategy popularized by
> [HTTP RFC 5861](https://tools.ietf.org/html/rfc5861). SWR is a strategy to first return the data from cache
> (stale), then send the fetch request (revalidate), and finally come with the up-to-date data.
>
> With SWR, components will get a stream of data updates constantly and automatically.
> And the UI will be always fast and reactive.

## Features

- :tada: &nbsp; Built for **Vue 3**
- :fire: &nbsp; **Extremly small and well packed** at 2.7kB (with polyfills!).
- :fire: &nbsp; **No dependencies**.
- :+1: &nbsp; Built-in **cache** and request deduplication.
- :eyes: &nbsp; **Dependent fetching** of data that depends on other.
- :eyes: &nbsp; **Real time** experience.
- :star: &nbsp; **Typescript** friendly.
- :+1: &nbsp; **Error handling** by using the error variable provided.
- :zap: &nbsp; **Efficient DOM** updates using Vue 3's reactivity.
- :zap: &nbsp; **Efficient HTTP** requests are only done when needed.
- :+1: &nbsp; **Manual revalidation** of the data by using `revalidate()`.
- :+1: &nbsp; **Optimistic UI / Manual mutation** of the data by using `mutate()`.
- :zzz: &nbsp; **Window focus revalidation** of the data.
- :zzz: &nbsp; **Network change revalidation** of the data.
- :+1: &nbsp; **Initial data** support for initial or offline data.
- :+1: &nbsp; **Clear cache** when you need to invalidate all data or the specified keys (eg. a user logout).
- :zzz: &nbsp; **Offline support** to be used without any revalidations with string keys.
- :+1: &nbsp; **Global configuration** available or per hook call.

## Upgrade Guide

If you come from `0.X.X` please read this section.

- Update the way you create global configuration. There's no need to use `createSWR` and pass the result
  to the vue app as a plugin, you can now use `createDefaultSWR` function instead and avoid registering the vue plugin.
  See more at [Global configuration options](#global-configuration-options)
- `revalidateOnMount` option has been renamed to `revalidateOnStart`.
- The `clear` function does now accept a single string, and an additional options parameter.
- The default fetcher now throws an error when the server response is not `2XX`. Meaning that there will be
  an error propagation and the error variables will be populated when the server response is not `2XX`.

## Installation

You can use npm or yarn to install it.

```
npm i vswr
```

```
yarn add vswr
```

## Getting Started

```vue
<template>
  <div v-if="posts">
    <div v-for="post of posts" :key="post.id">
      {{ post.title }}
    </div>
  </div>
</template>

<script>
import { useSWR } from 'vswr'

export default {
  setup() {
    // Call the `useSWR` and pass the key you want to use. It will be pased
    // to the fetcher function. The fetcher function can be configured globally
    // or passed as one of the options to this function.
    const { data: posts } = useSWR('https://jsonplaceholder.typicode.com/posts')

    // Pass the data to the component.
    return { posts }
  },
}
</script>
```

This is a simple example that will use SWR as the strategy to fetch the data. In this particular case,
all the default options are used (or the ones specified in the global config) and it will fetch the data
using the default or global fetcher and update the DOM when the request is done.

## Configuration options

All hook calls can have their respective configuration options applied to it. Nevertheless you can also
configure global options to avoid passing them to each hook call.

### Signature

```js
function useSWR(key, options): SWRResponse
// Can be destructured to get the response as such:
const { data, error, mutate, revalidate, clear, stop, isLoading, isValid, loading } = useSWR(key, options)
```

#### Parameters

- `key`: A resolved or non-resolved key. Can either be a string, or a function. A function can be used for dependent fetching as seen below.
- `options`: An optional object with optional properties such as:
  - `fetcher: (key) => Promise<any> = (url) => fetch(url).then((res) => res.json())`: Determines the fetcher function to use.
    This will be called to get the data.
  - `initialData: D = undefined`: Represents the initial data to use instead of undefined. Keep in mind the component will still attempt to re-validate unless `revalidateOnMount` is set false.
  - `loadInitialCache: boolean = true`: Determines if we should attempt to load the initial data from the cache in case initialData is undefined.
  - `revalidateOnStart: boolean = true`: Determines if SWR should perform a revalidation when it's called.
  - `dedupingInterval: number = 2000`: Determines the deduping interval. This interval represents the time SWR will avoid to perform a request if
    the last one was made before `dedupingInterval` ago.
  - `revalidateOnFocus: boolean = true`: Revalidates the data when the window re-gains focus.
  - `focusThrottleInterval: number = 5000`: Interval throttle for the focus event. This will ignore focus re-validation if it
    happened last time `focusThrottleInterval` ago.
  - `revalidateOnReconnect: boolean = true`: Revalidates the data when a network connect change is detected (basically the browser / app comes back online).

#### Return Values

- `data: Ref<D | undefined>`: Stores the data of the HTTP response after the fetcher has proceesed it or undefined in case the HTTP request hasn't finished or there was an error.
- `error: Ref<E | undefined>`: Determines error of the HTTP response in case it happened or undefined if there was no error or the HTTP request is not completed yet.
- `mutate: (value, options) => void`: Mutate alias for the global mutate function without the need to append the key to it.
- `revalidate: (options) => void`: Revalidation alias for the global revalidate function without the need to append the key to it.
- `clear: (options) => void`: Clears the current key data from the cache.
- `stop: () => void`: Stops the execution of the watcher. This means the data will unsubscribe from the cache and error changes as well as all the event listeners.
- `isLoading: ComputedRef<boolean>`: Determines if the request is still on its way and therefore, it's still loading.
- `isValid: ComputedRef<boolean>`: Determines if the data is valid. This means that there is no error associated with the data. This exists because errors do not wipe the data value and can still be used.
- `loading: () => Promise<D>`: It's a promise that resolves to the data if the request is successful, and rejects the promise if an error is thrown. Keep in mind only the first case of those two cases will be registered, no further changes will be watched.

## Global configuration options

You can configure the options globally by creating a SWR instance and using it in your vue
application. This step is not mandatory but it's recommened for most apps.

You can either choose to manually create a SWR instance and import it when needed or replace
the default SWR instance used by all exported APIs. The second is recommended if only one instance
will be needed for your application.

### Signature

```ts
function createSWR(options): VSWR
function createDefaultSWR(options): VSWR
```

#### Parameters

- `options: SWROptions`: Parameters of the options that will be passed to all components. They are the same as the ones on each `useSWR` function call.

#### Return value

A SWR instance that can be used to access all the API.

### Example

```js
import { createApp } from 'vue'
import { createDefaultSWR } from 'vswr'
import App from './App.vue'
import axios from 'axios'

// Set the defaut SWR instance that will
// be used by all the exported APIs.
createDefaultSWR({
  // Configure a global fetcher for all SWR hooks. This
  // can be replaced with anything that returns a promise
  // with the data inside, for example: axios.
  fetcher: (key) => axios.get(key).then((res) => res.data),
})

createApp(App).mount('#app')
```

## Dependent fetching

```vue
<template>
  <div>
    <div v-if="post">{{ post.title }}</div>
    <div v-if="user">{{ user.name }}</div>
  </div>
</template>

<script>
import { useSWR } from 'vswr'

export default {
  setup() {
    const { data: post } = useSWR('https://jsonplaceholder.typicode.com/posts/1')
    // We need to pass a function as the key. Function will throw an error when post is undefined
    // but we catch that and wait till it re-validates into a valid key to populate the user variable.
    const { data: user } = useSWR(() => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`)

    return { post, user }
  },
}
</script>
```

## Re-validate on demand

### Global revalidate function with given key

You can re-validate specific keys by importing the `revalidate` function.

```js
import { revalidate } from 'vswr'
```

You can call this method anywhere in your application by giving it the key, and the options.

#### Signature

```ts
function revalidate(key, options): void
```

##### Parameters

- `key`: Determines the key that is going to be re-validated. This must be a resolved key, meaning it must be a string or undefined.
  If undefined, the function will do nothing.
- `options`: A partial object (meaning all props can be optional / undefined) that accepts the following options:
  - `force: boolean = false`: Determines if the re-validation should be forced. When a re-validation is forced, the dedupingInterval will be ignored and a fetch will be performed.
  - `dedupingInterval: number = 2000`: Determines the dedupling interval. This interval represents the time SWR will avoid to perform a request if the last one was made before dedupingInterval ago.
  - `fetcher: SWRFetcher<D>`: Determines the fetcher function to use.

### On specific hooks with keys

You can re-validate specific keys by grabing the `revalidate` function of the `useSWR` call.
This function will allow you to perform a re-validation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the options.

#### Signature

```ts
function revalidate(options): void
```

##### Parameters

- `options`: Same as global revalidate (check above).

#### Example

```vue
<template>
  <div v-if="post">
    <div>{{ post.title }}</div>
    <button @click="() => revalidate()">Revalidate</button>
  </div>
</template>

<script>
import { useSWR } from 'vswr'

export default {
  setup() {
    const { data: post, revalidate } = useSWR('https://jsonplaceholder.typicode.com/posts/1')

    return { post, revalidate }
  },
}
</script>
```

## Mutate on demand

### Global mutate function with given key

You can mutate specific keys by importing the `mutate` function.

```js
import { mutate } from 'vswr'
```

You can call this method anywhere in your application by giving it the key, the value and the options.

#### Signature

```ts
function mutate(key, value, options): void
```

##### Parameters

- `key`: Determines the key that is going to be mutated. This must be a resolved key, meaning it must be a string or undefined.
  If undefined, the function will do nothing.
- `value: D | ((D) => D)`: Determines the new value to set. This can either be the value itself or a function that receives the current state and returns the new one.
- `options`: A partial object (meaning all props can be optional / undefined) that accepts the following options:
  - `revalidate: boolean = true`: Determines if the mutation should attempt to revalidate the data afterwards.
  - `revalidateOptions: Partial<SWRRevalidateOptions> = { ...defaultRevalidateOptions }`: Determines the revalidation options passed to revalidate in case the parameter `revalidate` is set to true.

### On specific hooks with keys

You can mutate specific keys by grabing the `mutate` function of the `useSWR` call.
This function will allow you to perform a mutation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the value and the options.

#### Signature

```ts
function mutate(value, options): void
```

##### Parameters

- `value`: Same as global mutate (check above).
- `options`: Same as global mutate (check above).

#### Example

Keep in mind we set revalidate to false to avoid it performing a HTTP request for this example, since this would just
over-write the static data with the server data again.

```vue
<template>
  <div v-if="post">
    <div>{{ post.title }}</div>
    <button @click="() => mutate((state) => ({ ...state, title: 'Sample' }), { revalidate: false })">
      Mutate only title
    </button>
    <button @click="() => mutate({ title: 'Sample' }, { revalidate: false })">Leave only title</button>
  </div>
</template>

<script>
import { useSWR } from 'vswr'

export default {
  setup() {
    const { data: post, mutate } = useSWR('https://jsonplaceholder.typicode.com/posts/1')

    return { post, mutate }
  },
}
</script>
```

## Manual subscription

You can manually subscribe to data or error changes by using the `subscribe` and `subscribeErrors` functions.

### Example

```js
import { subscribe, subscribeErrors } from 'vswr'

const key = 'example/key'

subscribe(key, (data) => {
  console.log(`${key} changed to ${data}`)
})

subscribeErrors(key, (error) => {
  console.log(`${key} error: ${error}`)
})
```

## Get values from the cache

You can also manually get values from the cache without the need to subscribe for changes or
use the built-in hook (that does more things under the hood like subscribing as well). You can use
the `get` and `getOrWait` functions to get the current values from the cache.

## Example

```js
import { get, getOrWait } from 'vswr'

const key = 'example/key'

// Gets the current cached data of the given key.
// This does not trigger any revalidation nor mutation of the data.
// - If the data has never been validated (there is no cache) it will return undefined.
// - If the item is pending to resolve (there is a request pending to resolve) it will return undefined.
const currentValue = get(key)

// Gets an element from the cache. The difference with the get is that
// this method returns a promise that will resolve the the value.
// If there's no item in the cache, it will wait for it before resolving.
const awaitCurrentValue = await getOrWait(key)

// Note: This example uses top-level await just to ilustrate this use-case.
```

## Error handling

You can handle request errors by using the `error` return value on a hook call. This will return the specific error that happened to the hook.
For example, a failed request.

### Example

```vue
<template>
  <div>
    <div v-if="error">There was an error</div>
    <div v-else-if="posts">
      <div v-for="post of posts" :key="post.id">
        {{ post.title }}
      </div>
    </div>
  </div>
</template>

<script>
import { useSWR } from 'vswr'

export default {
  setup() {
    const { data: posts, error } = useSWR('https://jsonplaceholder.typicode.com/posts')

    return { posts, error }
  },
}
</script>
```

## Clear Cache

You can clear all the cached keys or the specified ones when you need to invalidate some keys.

To do this, you can use the `clear` global function.

```js
import { clear } from 'vswr'
```

### Signature

```ts
function clear(keys, options): void
```

#### Parameters

- `keys`: A list with the keys to delete or a single string key. If keys is undefined, all keys will be cleared from the cache.
- `options`: A list of optional options.
  - `broadcast: boolean = false`: Determines if the cache should broadcast the cache change to subscribed handlers. That means telling them the value now resolves to undefined.

## FAQ

### Differences with `swr`

SWR was my first impressions on this kind of aproach towards data fetching. I've come to realize it
is a strategy that I enjoy and fits well into modern front-end frameworks like React or Vue. However
SWR is only compatible with react and I often use Vue for work related tasks. This lead me to consider
a Vue alternative that I could use to achieve the same results.

### Differences with `swrv`

I built this library when `swrv` was already established. However, at that time, it was mostly
used with vue 2 and had a small feature set and some important issues that I needed to avoid for
a work project I was working on. This lead me into tinkering with Vue's 3 reactivity system to
implement SWR from the ground up without looking at any code from `swr` or `swrv`. Those two projects
are both great and lead a strong foundation to what I was able to achieve. In fact, I used both project
documentations to decide the initial feature set I wanted to have. Nevertheless, due the lack of a few
features I needed (like network change revalidation or request deduping) it made me start building this lib.
