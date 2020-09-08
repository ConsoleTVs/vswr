<template>
  <div>Vue SWR</div>
  <button @click="show = !show">Toggle Child</button>
  <Child />
  <Child v-if="show" />
  <h1>Some other data:</h1>
  <div v-if="data">{{ data.name }}</div>
</template>

<script>
import { ref } from 'vue'
import Child from './components/Child'
import { useSWR } from '../dist/vswr'

export default {
  components: { Child },
  setup() {
    const show = ref(false)
    const { data, mutate } = useSWR('some.key', {
      initialData: { name: 'Erik' },
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    })
    setTimeout(() => {
      mutate({ name: 'Some other name' }, { revalidate: false })
    }, 2000)
    return { show, data }
  },
}
</script>
