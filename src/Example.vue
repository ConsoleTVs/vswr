<script lang="ts" setup>
import { query } from './vswr'

const fetcher = () =>
  new Promise((r) => setTimeout(r, 1000)).then(() => [
    // @ts-ignore
    { id: 1, title: 'Example: ' + crypto.randomUUID() },
    // @ts-ignore
    { id: 2, title: 'Example: ' + crypto.randomUUID() },
  ])

const { data, revalidate, isLoading } = query('e1', {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateOnStart: true,
})

const {
  data: d2,
  revalidate: r2,
  isLoading: il2,
} = query('e2', { fetcher, revalidateOnFocus: false, revalidateOnReconnect: false, revalidateOnStart: true })
</script>

<template>
  <h1>VSWR Example</h1>
  <div v-if="isLoading">Loading...</div>
  <template v-else>
    <h4>First</h4>
    <ul>
      <li><button @click="() => revalidate()">Revalidate</button></li>
      <li v-for="post of data" :key="post.id">{{ post.title }}</li>
    </ul>
  </template>
  <div v-if="il2">Loading...</div>
  <template v-else>
    <h4>Second</h4>
    <ul>
      <li><button @click="() => r2()">Revalidate</button></li>
      <li v-for="post of d2" :key="post.id">{{ post.title }}</li>
    </ul>
  </template>
</template>
