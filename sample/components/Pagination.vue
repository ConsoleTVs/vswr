<template>
  <h1>Infinite pagination:</h1>
  <h4>Current pages: {{ data.length }}</h4>
  <div v-if="data !== undefined">
    <div v-for="(page, index) in data" :key="index">
      <div v-if="page">
        <ul v-for="user in page.data" :key="user.id">
          <li>{{ user.name }} ({{ user.email }})</li>
        </ul>
      </div>
    </div>
  </div>
  <button @click="resize(data.length + 1)">Fetch more</button>
  <button @click="resize(data.length - 1)">Remove Page</button>
</template>

<script>
import { useSWRInfinite } from '../../dist/vswr'

export default {
  setup() {
    const { data, resize } = useSWRInfinite((page, previous) => {
      if (previous && previous.data.length === 0) return undefined
      return `http://pagination.test/api/users?page=${page}`
    })
    console.log({ data, resize })
    return { data, resize }
  },
}
</script>
