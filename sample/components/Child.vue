<template>
  <h3 v-if="!post">Loading post...</h3>
  <h3 v-if="post">Post #{{ post.id }} - {{ post.title }}:</h3>
  <h3 v-if="!user">Loading user...</h3>
  <h3 v-if="user">{{ user.name }}</h3>
  <button @click="rev">Revalidate</button>
  <button @click="mut">Mutate</button>
  <input type="text" v-model="postInput" />
  {{ postId }}
  <button @click="postId = postInput">Set post ID</button>
</template>

<script>
import { useSWR } from '../../dist/vswr'
import { ref } from 'vue'

export default {
  setup() {
    const postId = ref(undefined)
    const postInput = ref('')
    const { data: post } = useSWR(() =>
      postId.value ? `https://jsonplaceholder.typicode.com/posts/${postId.value}` : undefined
    )
    const { data: user, revalidate, mutate } = useSWR(
      () => `https://jsonplaceholder.typicode.com/users/${post.value.userId}`
    )
    const rev = () => revalidate({ force: false })
    const mut = () => mutate({ name: 'Changed Name' }, { revalidate: false })
    return { post, user, rev, mut, postInput, postId }
  },
}
</script>
