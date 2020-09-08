[![Vue SWR - Vue hook to use a stale-while-revalidate strategy to fetch data](banner.svg)](https://rmariuzzo.github.io/github-banner/)

## Feautres

- :tada: &nbsp; Built for **Vue 3**
- :fire: &nbsp; **Extremly small** at 1.3KB.
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
- :zzz: &nbsp; **Offline support** to be used without any revalidations with string keys.
- :+1: &nbsp; **Global configuration** available or per hook call.

## Example

```ts
<template>
  <div v-for="post of posts" :key="post.id">
    {{ post.title }}
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
