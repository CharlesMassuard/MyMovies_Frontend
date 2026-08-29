<script setup>
    import { ref } from 'vue'
    import { useAuthStore } from '../stores/auth';
    import axios  from 'axios';
    import router from '../router';
    import ConfirmationDialog from '../components/ConfirmationDialog.vue';

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const authStore = useAuthStore();

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const tab = ref('profile')
    const dialogPseudo = ref(false)
    const dialogEmail = ref(false)
    const dialogPass = ref(false)

    const dialogConfirmation = ref(false)

    const tempPseudo = ref('')
    const tempEmail = ref('')
    const tempPass = ref('')
    const tempPassConfirm = ref('')
    const tempOldPass = ref('')

    const newPassword = ref(null)
    const newPasswordConfirm = ref(null)

    const errorMessage = ref('')

    const snackbar = ref(false)
    const snackbarText = ref('')

    const emailRules = [
        v => !!v || 'Email requis',
        v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
    ];
    const passwordRules = [
        v => !!v || 'Mot de passe requis',
        v => v.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
    ];

    const newPasswordFocus = () => {
      newPassword.value?.focus()
    }

    const newPasswordConfirmFocus = () => {
      newPasswordConfirm.value?.focus()
    }

    const savePseudo = async () => {
      try {
        errorMessage.value = '';
        const token = localStorage.getItem('user_token');
        const newPseudo = (tempPseudo.value || '').trim();
        
        if (!newPseudo) {
          errorMessage.value = "Veuillez entrer un pseudo.";
          return;
        }

        await axios.put(`${API_BASE_URL}/auth/update/pseudo`, { newPseudo }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const updatedUser = { ...authStore.user, pseudo: newPseudo };
        authStore.setUser(updatedUser);
        
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          storedUser.pseudo = newPseudo;
          localStorage.setItem('user', JSON.stringify(storedUser));
        }

        tempPseudo.value = '';
        dialogPseudo.value = false;
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data?.message === 'Pseudo already in use') {
          errorMessage.value = "Ce pseudo est déjà utilisé.";
        } else {
          errorMessage.value = "Une erreur est survenue lors de la mise à jour.";
        }
      }
    }

    const saveEmail = async () => {
      try {
        errorMessage.value = '';
        const token = localStorage.getItem('user_token');
        const newMail = (tempEmail.value || '').trim();
        const currentPassword = (tempOldPass.value || '').trim();
        
        if (!newMail) {
          errorMessage.value = "Veuillez entrer une adresse email.";
          return;
        }

        const emailPattern = /.+@.+\..+/;
        if (!emailPattern.test(newMail)) {
          errorMessage.value = "L'adresse email n'est pas valide.";
          return;
        }

        const response = await axios.put(`${API_BASE_URL}/auth/update/mail`, { newMail, currentPassword }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const newToken = response.data.token;

        const updatedUser = { ...authStore.user, mail: newMail };
        
        authStore.setUser(updatedUser);
        
        if (newToken) {
          localStorage.setItem('user_token', newToken);
          authStore.token = newToken;
        }

        tempEmail.value = '';
        dialogEmail.value = false;
        
        snackbarText.value = "Email mis à jour avec succès !";
        snackbar.value = true;
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data?.message === 'Email already in use') {
          errorMessage.value = "Cette adresse email est déjà utilisée.";
        } else {
          errorMessage.value = "Une erreur est survenue lors de la mise à jour.";
        }
      }
    }

    const savePass = async () => {
      try {
        errorMessage.value = '';

        if (!tempOldPass.value || !tempPass.value) {
          errorMessage.value = "Veuillez remplir tous les champs.";
          return;
        }

        if (tempPass.value !== tempPassConfirm.value) {
          errorMessage.value = "Les nouveaux mots de passe ne correspondent pas.";
          return;
        }

        if(tempPass.value.length < 6) {
          errorMessage.value = "Le nouveau mot de passe doit contenir au moins 6 caractères.";
          return;
        }

        const token = localStorage.getItem('user_token');
        await axios.put(`${API_BASE_URL}/auth/update/password`, {
          oldPassword: tempOldPass.value,
          newPassword: tempPass.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        tempPass.value = ''
        tempPassConfirm.value = ''
        tempOldPass.value = ''
        dialogPass.value = false;
        
        snackbarText.value = "Mot de passe modifié avec succès !";
        snackbar.value = true;
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 400) {
          errorMessage.value = "L'ancien mot de passe est incorrect.";
        } else {
          errorMessage.value = "Erreur lors du changement de mot de passe.";
        }
      }
    }

    const deleteUser = () => {
      dialogConfirmation.value = true;
    }

    const confirmDeleteUser = async () => {
      try {
        const token = localStorage.getItem('user_token');
        await axios.delete(`${API_BASE_URL}/auth/delete`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        authStore.logout();
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la suppression du compte :", error);
      }
    }

    const closeDialogs = () => {
        dialogPseudo.value = false;
        dialogEmail.value = false;
        dialogPass.value = false;
        errorMessage.value = '';
        tempEmail.value = '';
        tempPass.value = '';
        tempPassConfirm.value = '';
        tempOldPass.value = '';
    }
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="rounded-lg shadow-lg">
          
          <v-tabs v-model="tab" grow color="#8C52FF">
            <v-tab value="profile">Profil</v-tab>
            <v-tab value="settings">Paramètres</v-tab>
          </v-tabs>

          <v-window v-model="tab" class="pa-6">
            
            <v-window-item value="profile">
              <div class="text-center mb-6">
                <h2 class="text-h5 font-weight-bold">{{ authStore.user?.pseudo }}</h2>
                <p class="text-body-3 text-medium-emphasis">{{ authStore.user?.mail }}</p>
                <p class="text-body-2 text-medium-emphasis">
                  Membre depuis le {{ formatDate(authStore.user?.registrationDate) }} - 
                  Dernière connexion le {{ formatDate(authStore.user?.lastLoginDate) }}
                </p>
              </div>

              <v-divider class="mb-6"></v-divider>

              <v-row dense>
                <v-col cols="12">
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-account-edit"
                    @click="dialogPseudo = true"
                    class="mb-3"
                  >
                    Changer le pseudo
                  </v-btn>
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-email-edit"
                    @click="dialogEmail = true"
                    class="mb-3"
                  >
                    Changer l'adresse mail
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-lock-reset"
                    @click="dialogPass = true"
                  >
                    Changer le mot de passe
                  </v-btn>
                </v-col>
              </v-row>
            </v-window-item>

            <v-window-item value="settings">
              <v-btn color="error" variant="text" class="px-0 mt-4" @click="deleteUser()">
                Supprimer le compte
              </v-btn>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogPseudo" max-width="400">
      <v-card title="Modifier le pseudo" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempPseudo"
          label="Nouveau Pseudo"
          variant="underlined"
          type="text"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">Annuler</v-btn>
          <v-btn color="#8C52FF" @click="savePseudo">Valider</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEmail" max-width="400">
      <v-card title="Modifier l'email" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempEmail"
          label="Nouvel Email"
          variant="underlined"
          type="email"
          :rules="emailRules"
        ></v-text-field>
        <v-text-field
          v-model="tempOldPass"
          label="Mot de passe"
          type="password"
          variant="underlined"
          @keydown.enter.prevent="newPasswordFocus"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">Annuler</v-btn>
          <v-btn color="#8C52FF" @click="saveEmail">Valider</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPass" max-width="400">
      <v-card title="Modifier le mot de passe" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempOldPass"
          label="Ancien mot de passe"
          type="password"
          variant="underlined"
          @keydown.enter.prevent="newPasswordFocus"
        ></v-text-field>
        
        <v-text-field
          v-model="tempPass"
          label="Nouveau mot de passe"
          type="password"
          variant="underlined"
          ref="newPassword"
          @keydown.enter.prevent="newPasswordConfirmFocus"
          :rules="passwordRules"
        ></v-text-field>
        
        <v-text-field
          v-model="tempPassConfirm"
          label="Confirmer le nouveau mot de passe"
          type="password"
          variant="underlined"
          ref="newPasswordConfirm"
          @keydown.enter.prevent="savePass"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">Annuler</v-btn>
          <v-btn color="#8C52FF" @click="savePass">Valider</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  <v-snackbar
      v-model="snackbar"
      timeout="3000"
      color="success"
      variant="flat"
    >
      {{ snackbarText }}
    </v-snackbar>
    <ConfirmationDialog
        v-model="dialogConfirmation"
        title="Supprimer mon compte"
        message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
        confirm-text="Supprimer"
        cancel-text="Annuler"
        @confirm="confirmDeleteUser"
  ></ConfirmationDialog>
</template>