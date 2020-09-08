<template>
  <h3 v-if="post">Post #{{ post.userId }} user:</h3>
  <h3 v-if="user">{{ user.name }}</h3>
  <button @click="rev">Revalidate</button>
  <button @click="mut">Mutate</button>
</template>

<script>
import { useSWR } from '../../dist/vswr'

export default {
  setup() {
    const { data: post } = useSWR('https://jsonplaceholder.typicode.com/posts/1')
    const { data: user, revalidate, mutate } = useSWR(
      () => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`
    )
    const rev = () => revalidate({ force: false })
    const mut = () => mutate({ name: 'Changed Name' }, { revalidate: false })
    return { post, user, rev, mut }
  },
}
</script>
