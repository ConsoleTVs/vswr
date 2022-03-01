<script lang="ts" setup>
import { onErrorCaptured, ref, Ref, unref } from 'vue'

const error = ref<Error | undefined>(undefined)
const retry = () => (error.value = undefined)

onErrorCaptured((e: Error | Ref<Error>) => {
  error.value = unref(e)
  return false
})
</script>

<template>
  <slot name="error" v-if="error" :error="error" :retry="retry" />
  <slot v-else />
</template>
