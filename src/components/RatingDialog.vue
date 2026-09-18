<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  initialRating: Number,
  initialComment: String,
  placeholder: {
    type: String,
    default: "Écrivez ce que vous voulez retenir..."
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const editRating = ref(0);
const editComment = ref("");

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    editRating.value = (props.initialRating <= 0) ? 5 : props.initialRating;
    editComment.value = props.initialComment || "";
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

const saveRating = () => {
  if (editRating.value < 1 || editRating.value > 10) return;
  if (editComment.value.length > 500) {
    alert('Le commentaire ne doit pas dépasser 500 caractères.');
    return;
  }
  emit('save', { rating: editRating.value, comment: editComment.value });
  closeDialog();
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" width="450px">
    <v-card class="pa-4 rounded-xl relative">
      <div class="d-flex align-center justify-center mb-4">
        <v-card-title class="pa-0 font-weight-bold">{{ title }}</v-card-title>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="comfortable"
          position="absolute"
          style="right: 16px; top: 16px"
          @click="closeDialog"
        ></v-btn>
      </div>

      <v-textarea
        v-model="editComment"
        :placeholder="placeholder"
        variant="outlined"
        rounded="lg"
        auto-grow
        rows="4"
        class="mb-6 comment-area"
        hide-details
      ></v-textarea>

      <div class="d-flex justify-space-between mb-8 px-1">
        <v-slide-group
          v-model="editRating"
          class="pa-0 mb-8"
          selected-class="selected-rating"
          mandatory
          center-active
        >
          <v-slide-group-item
            v-for="n in 10"
            :key="n"
            :value="n"
            v-slot="{ isSelected, toggle }"
          >
            <v-card
              :color="isSelected ? '#8C52FF' : 'white'"
              :class="[
                'ma-2 d-flex align-center justify-center rating-card elevation-2',
                isSelected ? 'text-white' : 'text-grey-darken-3'
              ]"
              height="40"
              width="40"
              rounded="lg"
              @click="toggle"
            >
              <span class="text-h6 font-weight-bold">{{ n }}</span>
            </v-card>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <v-btn
        block
        color="#6236FF"
        size="large"
        rounded="xl"
        class="text-none font-weight-bold text-white elevation-0"
        @click="saveRating"
      >
        Sauvegarder
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.comment-area :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.selected-rating {
  background-color: #8C52FF !important;
  border-color: #8C52FF !important;
}
</style>