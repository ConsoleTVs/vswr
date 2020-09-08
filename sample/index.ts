import { createApp } from 'vue'
import { createSWR, SWRResolvedKey } from '../dist/vswr'
import App from './App.vue'

const swr = createSWR({
  fetcher: (key: SWRResolvedKey) =>
    fetch(key).then((response) => {
      console.log({ response })
      return response.json()
    }),
})

createApp(App)
  .use(swr)
  .mount('#app')
