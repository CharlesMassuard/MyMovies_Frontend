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
    <v-dialog :model-value="modelValue" @update:model-value="close" width="400">
        <v-card class="pa-4 rounded-xl text-center">
            <!--Icône centrale d'alerte-->
            <div class="d-flex justify-center mb-3 mt-2">
                <v-avatar color="error" variant="tonal" size="64">
                    <v-icon size="32" color="error">mdi-delete-alert-outline</v-icon>
                </v-avatar>
            </div>
            
            <v-card-title class="text-h6 font-weight-bold px-1 mb-2" style="white-space: normal; line-height: 1.3;">
                {{ title }}
            </v-card-title>
            
            <v-card-text class="text-body-2 text-grey-lighten-1 px-2 mb-6">
                {{ message }}
            </v-card-text>
            
            <!--Alignement à droite des boutons sans les étirer-->
            <div class="d-flex justify-end ga-2 px-2">
                <v-btn
                    variant="outlined"
                    color="grey"
                    rounded="xl"
                    class="text-none font-weight-bold px-4"
                    @click="close"
                >
                    {{ cancelText || t('common.cancel') }}
                </v-btn>
                <v-btn
                    color="error"
                    rounded="xl"
                    variant="flat"
                    class="text-none font-weight-bold elevation-0 px-4"
                    @click="confirm"
                >
                    {{ confirmText || t('common.confirm') }}
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>