<script lang="ts" setup>
import { querySuspense } from './vswr'

const fetcher = () =>
  new Promise((r) => setTimeout(r, 1000)).then(() => [
    // @ts-ignore
    { id: 1, title: 'Example: ' + crypto.randomUUID() },
    // @ts-ignore
    { id: 2, title: 'Example: ' + crypto.randomUUID() },
  ])

const errorFetcher = () =>
  new Promise((r) => setTimeout(r, 1000)).then(() => {
    throw new Error('Whopsie! I failed')
    return [
      // @ts-ignore
      { id: 1, title: 'Example: ' + crypto.randomUUID() },
      // @ts-ignore
      { id: 2, title: 'Example: ' + crypto.randomUUID() },
    ]
  })

const s1 = querySuspense('nse1', { fetcher })
const s2 = querySuspense('nse2', { fetcher })
const [{ data, revalidate }, { data: d2, revalidate: r2 }] = await Promise.all([s1, s2])
</script>

<template>
  <h1>VSWR Suspense Example</h1>
  <h4>First</h4>
  <ul>
    <li><button @click="() => revalidate()">Revalidate</button></li>
    <li><button @click="() => revalidate({ fetcher: errorFetcher })">Revalidate Throw</button></li>
    <li v-for="post of data" :key="post.id">{{ post.title }}</li>
  </ul>
  <h4>Second</h4>
  <ul>
    <li><button @click="() => r2()">Revalidate</button></li>
    <li><button @click="() => r2({ fetcher: errorFetcher })">Revalidate Throw</button></li>
    <li v-for="post of d2" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
