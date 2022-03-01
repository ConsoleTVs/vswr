<script lang="ts" setup>
import Example from './Example.vue'
import SuspenseExample from './SuspenseExample.vue'
import ErrorBoundary from './ErrorBoundary.vue'
import DependentSuspense from './DependentSuspense.vue'
</script>

<template>
  <Example />
  <ErrorBoundary>
    <template #error="{ error, retry }">
      <div>{{ error.message }}</div>
      <button @click="retry">Retry</button>
    </template>
    <Suspense>
      <template #fallback>
        <div>Loading Suspense...</div>
      </template>
      <SuspenseExample />
    </Suspense>
  </ErrorBoundary>
  <ErrorBoundary>
    <template #error="{ error, retry }">
      <div>{{ error.message }}</div>
      <button @click="retry">Retry</button>
    </template>
    <Suspense>
      <template #fallback>
        <div>Loading Dependent Suspense...</div>
      </template>
      <DependentSuspense />
    </Suspense>
  </ErrorBoundary>
</template>
