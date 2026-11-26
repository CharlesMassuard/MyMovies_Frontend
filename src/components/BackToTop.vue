<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const visible = ref(false);

const handleScroll = () => {
  visible.value = (window.scrollY || 0) > 520;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', handleScroll));
</script>

<template>
  <transition name="btt-fade">
    <button
      v-if="visible"
      type="button"
      class="back-to-top-btn"
      :aria-label="$t('common.backToTop')"
      @click="scrollToTop"
    >
      <v-icon size="22">mdi-chevron-up</v-icon>
    </button>
  </transition>
</template>

<style scoped>
.back-to-top-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 950;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(23, 25, 34, 0.86);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.back-to-top-btn:hover {
  transform: translateY(-3px);
  background: #8C52FF;
  border-color: #8C52FF;
}

:root[data-theme='light'] .back-to-top-btn {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.12);
  color: #1f2937;
}

:root[data-theme='light'] .back-to-top-btn:hover {
  background: #8C52FF;
  color: #ffffff;
}

.btt-fade-enter-active,
.btt-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.btt-fade-enter-from,
.btt-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
