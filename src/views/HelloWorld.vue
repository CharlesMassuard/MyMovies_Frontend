<script setup>
import { ref } from 'vue';
import axios  from 'axios';

defineProps({
  msg: String,
})

const count = ref(0)

async function testApi() {
  try {
    let API_URL = "http://localhost:8080/api/users";
    const user = { pseudo: 'Charlsess', mail: 'tessts@mail.com', password: '123' };

    axios.post('http://localhost:8080/api/users', user)
      .then(res => console.log('Utilisateur créé :', res.data))
      .catch(err => console.error('Erreur API :', err.response?.status, err.response?.data?.message, err));


    axios.get("http://localhost:8080/api/movies/test")
      .then(res => {
        console.log("coucou", res.data)
      })
  } catch (error) {
    console.error('API call failed:', error)
    alert('API call failed! Check console for details.')
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <button type="button" @click="testApi()">Test API</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
