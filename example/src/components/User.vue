<template>
  <div style="margin: 30px 0px">
    <input v-model="userId" placeholder="User ID" type="number" />
    <div>User ID {{ userId }}</div>
    <div v-if="!isLoading">
      <div v-if="isValid">User: {{ user }}</div>
      <div>Error: {{ error }}</div>
      <div>
        <button @click="revalidate()">Revalidate</button>
        <button @click="mutate({ name: 'Sample' }, { revalidate: false })">Mutate</button>
        <button @click="clear({ broadcast: true })">Clear</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useSWR } from 'vswr'

export default {
  setup() {
    const userId = ref(1)
    const { data: user, error, mutate, revalidate, clear, isLoading, isValid, loading } = useSWR(
      () => `https://jsonplaceholder.typicode.com/users/${userId.value}`
    )

    loading()
      .then((u) => console.log('First user fetched resolved to:', u.value))
      .catch((e) => console.log('First user fetched failed with error', e.value))

    return { user, error, mutate, revalidate, clear, userId, isLoading, isValid }
  },
}
</script>
