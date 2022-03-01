![Vue SWR - Stale-While-Revalidate (SWR) strategy to fetch data in Vue 3](https://raw.githubusercontent.com/ConsoleTVs/vswr/master/vswr-white.png#gh-dark-mode-only)
![Vue SWR - Stale-While-Revalidate (SWR) strategy to fetch data in Vue 3](https://raw.githubusercontent.com/ConsoleTVs/vswr/master/vswr-dark.png#gh-light-mode-only)

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
- [More Examples](#more-examples)

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
- Built-in **cache** and **request deduplication**.
- **Dependent fetching** of data that depends on other fetched data.
- **Typescript** friendly.
- **Error handling** by using the error variable provided.
- :fire: &nbsp; **Efficient HTTP** requests are only done when needed.
- **Manual revalidation** of the data by using `revalidate()`.
- **Optimistic UI / Manual mutation** of the data by using `mutate()`.
- **Window focus revalidation** of the data.
- **Network change revalidation** of the data.
- :fire: &nbsp; **SSR / Initial data** support for initial, offline data or SSR.
- **Cache Invalidation** when you need to invalidate all data or the specified keys (eg. a user logout).
- **Offline support** to be used without any revalidations with string keys.
- **Global configuration** available or per hook call.
- :fire: &nbsp; _New in 2.0_: **Suspense Support** to use with vue's `<Suspense>` component.

## New in 2.X.X

- `<Suspense>` support with `querySuspense`
- `Error Boundaries`: `querySuspense` throws errors instead of using an error variable. You can use vue's `onErrorCapture` to create an error boundary.
- Custom logic for network reconnect and app focus using the options `focusWhen` and `reconnectWhen`. Usefull for environments outwise of the web (eg. Mobile or Desktop.

## Upgrade Guide (1.X.X => 2.X.X)

### Instance methods:

- `subscribe` renamed to `subscribeData`
- `use` renamed to `subscribe`
- `getOrWait` renamed to `getWait`
- `useSWR` renamed to `query`
- `query` return property `stop` renamed to `unsubscribe`

## Installation

```
npm i vswr
```

## Getting Started

### Without Suspense

```vue
<script setup>
import { query } from 'vswr'

// Call the `query` and pass the key you want to use. It will be pased
// to the fetcher function. The fetcher function can be configured globally
// or passed as one of the options to this function.
const { data: posts } = query('https://jsonplaceholder.typicode.com/posts')
</script>

<template>
  <div v-if="posts">
    <div v-for="post of posts" :key="post.id">
      {{ post.title }}
    </div>
  </div>
</template>
```

### With Suspense

```vue
<script setup>
import { querySuspense } from 'vswr'

// Call the `querySuspense` and pass the key you want to use. It will be pased
// to the fetcher function. The fetcher function can be configured globally
// or passed as one of the options to this function.
const { data: posts } = await querySuspense('https://jsonplaceholder.typicode.com/posts')
</script>

<template>
  <div v-for="post of posts" :key="post.id">
    {{ post.title }}
  </div>
</template>
```

This is a simple example that will use SWR as the strategy to fetch the data. In this particular case,
all the default options are used (or the ones specified in the global config) and it will fetch the data
using the default or global fetcher and update the DOM when the request is done.

## Configuration options

All hook calls can have their respective configuration options applied to it. Nevertheless you can also
configure global options to avoid passing them to each hook call.

### Signature

```js
function query(key, options): SWRResponse
// Can be destructured to get the response as such:
const { data, error, mutate, revalidate, clear, unsubscribe, isLoading, isValid, loading } = query(key, options)
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
  - `focusWhen: (notify: () => void, options: VisibilityOptions) => void | (() => void)`: You can use this function to manually call the notify callback when the application has gained focus. You can also return a function that will be called as a cleanup.
  - `reconnectWhen: (notify: () => void, options: NetworkOptions) => void | (() => void)`: You can use this function to manually call the notify callback when the application has reconnected. You can also return a function that will be called as a cleanup.

#### Return Values (Without suspense)

- `data: Ref<D | undefined>`: Stores the data of the HTTP response after the fetcher has proceesed it or undefined in case the HTTP request hasn't finished or there was an error.
- `error: Ref<E | undefined>`: Determines error of the HTTP response in case it happened or undefined if there was no error or the HTTP request is not completed yet.
- `mutate: (value, options) => void`: Mutate alias for the global mutate function without the need to append the key to it.
- `revalidate: (options) => void`: Revalidation alias for the global revalidate function without the need to append the key to it.
- `clear: (options) => void`: Clears the current key data from the cache.
- `unsubscribe: () => void`: Stops the execution of the watcher. This means the data will unsubscribe from the cache and error changes as well as all the event listeners.
- `isLoading: ComputedRef<boolean>`: Determines if the request is still on its way and therefore, it's still loading.
- `isValid: ComputedRef<boolean>`: Determines if the data is valid. This means that there is no error associated with the data. This exists because errors do not wipe the data value and can still be used.
- `loading: () => Promise<D>`: It's a function that returns a promise that resolves to the data if the request is successful, and rejects the promise if an error is thrown. Keep in mind only the first case of those two cases will be registered, no further changes will be watched.

#### Return Values (With suspense)

- `data: Ref<D | undefined>`: Stores the data of the HTTP response after the fetcher has proceesed it or undefined in case the HTTP request hasn't finished or there was an error.
- `mutate: (value, options) => void`: Mutate alias for the global mutate function without the need to append the key to it.
- `revalidate: (options) => void`: Revalidation alias for the global revalidate function without the need to append the key to it.
- `clear: (options) => void`: Clears the current key data from the cache.
- `unsubscribe: () => void`: Stops the execution of the watcher. This means the data will unsubscribe from the cache and error changes as well as all the event listeners.

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

- `options: SWROptions`: Parameters of the options that will be passed to all components. They are the same as the ones on each `query` function call.

#### Return value

A SWR instance that can be used to access all the API.

### Example (with axios)

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

### Without suspense

```vue
<script setup>
import { query } from 'vswr'

const { data: post } = query('https://jsonplaceholder.typicode.com/posts/1')
// We need to pass a function as the key. Function will re-evaluate when data changes and capture errors if needed.
const { data: user } = query(() => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`)
</script>

<template>
  <div>
    <div v-if="post">{{ post.title }}</div>
    <div v-if="user">{{ user.name }}</div>
  </div>
</template>
```

### With suspense

```vue
<script setup>
import { querySuspense } from './vswr'

const { data: post } = await querySuspense(() => 'https://jsonplaceholder.typicode.com/posts/1')
// We need to pass a function as the key. Function will re-evaluate when data changes and capture errors if needed.
const { data: user } = await querySuspense(() => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`)
</script>

<template>
  <div>
    <div>{{ post.title }}</div>
    <div>{{ user.name }}</div>
  </div>
</template>
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

You can re-validate specific keys by grabing the `revalidate` function of the `query` call.
This function will allow you to perform a re-validation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the options.

#### Signature

```ts
function revalidate(options): void
```

##### Parameters

- `options`: Same as global revalidate (check above).

#### Example (Without suspense)

```vue
<script>
import { query } from 'vswr'

const { data: post, revalidate } = query('https://jsonplaceholder.typicode.com/posts/1')
</script>

<template>
  <div v-if="post">
    <div>{{ post.title }}</div>
    <button @click="() => revalidate()">Revalidate</button>
  </div>
</template>
```

#### Example (With suspense)

```vue
<script>
import { querySuspense } from 'vswr'

const { data: post, revalidate } = querySuspense('https://jsonplaceholder.typicode.com/posts/1')
</script>

<template>
  <div>{{ post.title }}</div>
  <button @click="() => revalidate()">Revalidate</button>
</template>
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

You can mutate specific keys by grabing the `mutate` function of the `query` or `querySuspense` calls.
This function will allow you to perform a mutation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the value and the options.

#### Signature

```ts
function mutate(value, options): void
```

##### Parameters

- `value`: Same as global mutate (check above).
- `options`: Same as global mutate (check above).

#### Example (Without Suspense)

Keep in mind we set revalidate to false to avoid it performing a HTTP request for this example, since this would just
over-write the static data with the server data again.

```vue
<script setup>
import { query } from 'vswr'

const { data: post, mutate } = query('https://jsonplaceholder.typicode.com/posts/1')
</script>

<template>
  <div v-if="post">
    <div>{{ post.title }}</div>
    <button @click="() => mutate((state) => ({ ...state, title: 'Sample' }), { revalidate: false })">
      Mutate only title
    </button>
    <button @click="() => mutate({ title: 'Sample' }, { revalidate: false })">Leave only title</button>
  </div>
</template>
```

#### Example (With Suspense)

Keep in mind we set revalidate to false to avoid it performing a HTTP request for this example, since this would just
over-write the static data with the server data again.

```vue
<script setup>
import { querySuspense } from 'vswr'

const { data: post, mutate } = querySuspense('https://jsonplaceholder.typicode.com/posts/1')
</script>

<template>
  <div>{{ post.title }}</div>
  <button @click="() => mutate((state) => ({ ...state, title: 'Sample' }), { revalidate: false })">
    Mutate only title
  </button>
  <button @click="() => mutate({ title: 'Sample' }, { revalidate: false })">Leave only title</button>
</template>
```

## Manual subscription

You can manually subscribe to data or error changes by using the `subscribeData` and `subscribeErrors` functions.

### Example

```js
import { subscribeData, subscribeErrors } from 'vswr'

const key = 'example/key'

subscribeData(key, (data) => {
  console.log(`${key} changed to ${data}`)
})

subscribeErrors(key, (error) => {
  console.log(`${key} error: ${error}`)
})
```

## Get values from the cache

You can also manually get values from the cache without the need to subscribe for changes or
use the built-in hook (that does more things under the hood like subscribing as well). You can use
the `get` and `getWait` functions to get the current values from the cache.

## Example

```js
import { get, getWait } from 'vswr'

const key = 'example/key'

// Gets the current cached data of the given key.
// This does not trigger any revalidation nor mutation of the data.
// - If the data has never been validated (there is no cache) it will return undefined.
// - If the item is pending to resolve (there is a request pending to resolve) it will return undefined.
const currentValue = get(key)

// Gets an element from the cache. The difference with the get is that
// this method returns a promise that will resolve the the value.
// If there's no item in the cache, it will wait for it before resolving.
// It does not attempt to revalidate or fetch the data, thus a possible
// endless promise is possible. Make sure the data is fetched or revalidated first.
const awaitCurrentValue = await getWait(key)
```

## Error handling

### Without Suspense

You can handle request errors by using the `error` return value on a hook call. This will return the specific error that happened to the hook.
For example, a failed request.

#### Example

```vue
<script setup>
import { query } from 'vswr'

const { data: posts, error } = query('https://jsonplaceholder.typicode.com/posts')
</script>

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
```

### With Suspense

In suspense, if a query errors out, there will be no `error` variable available.
Instead, errors are expected to be handled by what's known as an `error boundary`.
An error boundary will capture errors during the initial component load and subsequent updates.

An error boundary may look like this, althought that component must be created manually and serves as ilustration.

```vue
<script setup>
import { onErrorCaptured, ref, Ref, unref } from 'vue'

const error = ref(undefined)
const retry = () => (error.value = undefined)

onErrorCaptured((err) => {
  // We must unref since it can be either a thrown Error or
  // a Ref<E>, where E is Error by default but depends on the query's fetch.
  error.value = unref(err)
  return false
})
</script>

<template>
  <slot name="error" v-if="error" :error="error" :retry="retry" />
  <slot v-else />
</template>
```

#### Example

`<ErrorBoundary>` referts to the ilustrated error boundary component above, althought it might be different.

Your application should wrap your suspensable component in both, an error boundary and a `Suspense` component. An example below:

```vue
<template>
  <ErrorBoundary>
    <template #error="{ error, retry }">
      <div>{{ error.message }}</div>
      <button @click="retry">Retry</button>
    </template>
    <Suspense>
      <template #fallback>
        <div>Loading...</div>
      </template>
      <ExamplePosts />
    </Suspense>
  </ErrorBoundary>
</template>
```

Then your components can use suspense like this (`ExamplePosts`):

```vue
<script setup>
import { querySuspense } from 'vswr'

const { data: posts } = await querySuspense('https://jsonplaceholder.typicode.com/posts')
</script>

<template>
  <div v-for="post of posts" :key="post.id">
    {{ post.title }}
  </div>
</template>
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

- `keys`: A list with the keys to delete or a single string key. If keys is undefined, all keys will be cleared from the cache. Null will set the value to null.
- `options`: A list of optional options.
  - `broadcast: boolean = false`: Determines if the cache should broadcast the cache change to subscribed handlers. That means telling them the value now resolves to undefined.

## More Examples

Check out the `src` folder of this project. You'll find an `example.ts` file with a sample vue application and a few components serving as examples.
