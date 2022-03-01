<template>
  <div>
    <div v-if="post">{{ post.title }}</div>
    <div v-if="user">{{ user.name }}</div>
  </div>
</template>

<script lang="ts" setup>
import { querySuspense } from './vswr'

const { data: post } = await querySuspense(() => 'https://jsonplaceholder.typicode.com/posts/1')
const { data: user } = await querySuspense(() => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`)
</script>
