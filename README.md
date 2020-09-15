![Vue SWR - Vue hook to use a stale-while-revalidate strategy to fetch data](https://raw.githubusercontent.com/ConsoleTVs/vswr/master/vswr.svg)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration options](#configuration-options)
- [Global configuration options](#global-configuration-options)
- [Dependent fetching](#dependent-fetching)
- [Re-validate on demand](#re-validate-on-demand)
- [Mutate on demand](#mutate-on-demand)
- [Error handling](#error-handling)
- [Clear Cache](#clear-cache)
- [FAQ](#faq)
- [Contributors](#contributors)

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
- :fire: &nbsp; **Extremly small** at 1.4KB.
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
const { data, error, mutate, revalidate } = useSWR(key, options)
```

#### Parameters

- `key`: A resolved or non-resolved key. Can either be a string, or a function. A function can be used for dependent fetching as seen below.
- `options`: An optional object with optional properties such as:
  - `fetcher: (key) => Promise<any> = (url) => fetch(url).then((res) => res.json())`: Determines the fetcher function to use.
    This will be called to get the data.
  - `initialData: any = undefined`: Represents the initial data to use instead of undefined. Keep in mind the component will still attempt to re-validate
    unless `revalidateOnMount` is set false.
  - `revalidateOnMount: boolean = true`: Determines if the hook should revalidate the component when it is called.
  - `dedupingInterval: number = 2000`: Determines the deduping interval. This interval represents the time SWR will avoid to perform a request if
    the last one was made before `dedupingInterval` ago.
  - `revalidateOnFocus: boolean = true`: Revalidates the data when the window re-gains focus.
  - `focusThrottleInterval: number = 5000`: Interval throttle for the focus event. This will ignore focus re-validation if it
    happened last time `focusThrottleInterval` ago.
  - `revalidateOnReconnect: boolean = true`: Revalidates the data when a network connect change is detected (basically the browser / app comes back online).
  - `onData: (data: D) => void = undefined`: This callback will be called every time there's new data available. Keep in mind this will fire after
    the initial population and after every revalidation's success.

#### Return Values

- `data: Ref<D | undefined>`: Stores the data of the HTTP response after the fetcher has proceesed it or undefined in case the HTTP request hasn't finished or there was an error.
- `error: Ref<E | undefined>`: Determines error of the HTTP response in case it happened or undefined if there was no error or the HTTP request is not completed yet.
- `mutate: (value, options) => void`: Mutate alias for the global mutate function without the need to append the key to it.
- `revalidate: (options) => void`: Revalidation alias for the global revalidate function without the need to append the key to it.

## Global configuration options

You can configure the options globally by creating a SWR instance and using it in your vue
application as a plugin. This step is not mandatory but it's recommened for most apps.

### Signature

```ts
function createSWR(options): PluginFunction
```

#### Parameters

- `options: SWROptions`: Parameters of the options that will be passed to all components. They are the same as the ones on each instance.

#### Return value

A plugin function that can be used to register a vue 3 plugin using: `app.use()`

### Example

```js
import { createApp } from 'vue'
import { createSWR } from 'vswr'
import App from './App.vue'

const swr = createSWR({
  // Configure a global fetcher for all SWR hooks. This
  // can be replaced with anything that returns a promise
  // with the data inside, for example: axios.
  fetcher: (key) => fetch(key).then((res) => res.json()),
})

createApp(App)
  .use(swr)
  .mount('#app')
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
  - `force: boolean = false`:Determines if the re-validation should be forced. When a re-validation is forced, the dedupingInterval
    will be ignored and a fetch will be performed.

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
- `value: any | ((any) => any)`: Determines the new value to set. This can either be the value itself or a function that receives the current
  state and returns the new one.
- `options`: A partial object (meaning all props can be optional / undefined) that accepts the following options:

  - `revalidate: boolean = true`: Determines if the mutation should attempt to revalidate the data afterwards.
  - `revalidateOptions: Partial<SWRRevalidateOptions> = { ...defaultRevalidateOptions }`: Determines the revalidation options passed to revalidate in case
    the parameter `revalidate` is set to true.

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
    <button @click="() => mutate({ title: 'Sample' }, { revalidate: false })">
      Leave only title
    </button>
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
function clear(keys): void
```

#### Parameters

- `keys`: A list with the keys to delete. If keys is undefined, all keys will be cleared from the cache.

## FAQ

### Differences with `swr`

SWR was my first impressions on this quind of aproach towards data fetching. I've come to realize it
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

## Contributors

![No contributors yet](https://i.imgflip.com/2agvl6.jpg)
