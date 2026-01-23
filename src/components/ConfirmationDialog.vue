<script setup>
    const props = defineProps({
        modelValue: Boolean,
        title: String,
        message: String,
        confirmText: {
            type: String,
            default: 'Confirmer'
        },
        cancelText: {
            type: String,
            default: 'Annuler'
        }
    });

    const emit = defineEmits(['update:modelValue', 'confirm']);

    const close = () => {
        emit('update:modelValue', false);
    };

    const confirm = () => {
        emit('confirm');
        close();
    };
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="close" width="500">
        <v-card prepend-icon="mdi-delete-alert" :title="title" :text="message">
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn :text="cancelText" variant="text" @click="close"></v-btn>
                <v-btn color="error" variant="flat" :text="confirmText" @click="confirm"></v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>