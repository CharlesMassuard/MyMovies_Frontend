<script setup>
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const props = defineProps({
        modelValue: Boolean,
        title: String,
        message: String,
        confirmText: {
            type: String,
            default: ''
        },
        cancelText: {
            type: String,
            default: ''
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
                <v-btn :text="cancelText || t('common.cancel')" variant="text" @click="close"></v-btn>
                <v-btn color="error" variant="flat" :text="confirmText || t('common.confirm')" @click="confirm"></v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>
