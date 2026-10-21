import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const themePreferenceKey = 'mymovies-theme'
const validThemePreferences = ['system', 'light', 'dark']

const getThemePreference = () => {
  const preference = localStorage.getItem(themePreferenceKey)
  return validThemePreferences.includes(preference) ? preference : 'system'
}

const getSystemTheme = () => (
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
)

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0f1015',
          surface: '#171922',
          'surface-variant': '#252936',
          primary: '#8C52FF',
          secondary: '#FF528C',
          'on-background': '#f5f5f7',
          'on-surface': '#f5f5f7',
          'on-surface-variant': '#c5c7d0',
        },
      },
      light: {
        dark: false,
        colors: {
          background: '#ffffff',
          surface: '#ffffff',
          'surface-variant': '#f5f5f5',
          primary: '#8C52FF',
          secondary: '#FF528C',
          'on-background': '#213547',
          'on-surface': '#213547',
          'on-surface-variant': '#5f6368',
        },
      },
    },
  },
})

export const applyThemePreference = (preference = getThemePreference()) => {
  const normalizedPreference = validThemePreferences.includes(preference) ? preference : 'system'
  const activeTheme = normalizedPreference === 'system' ? getSystemTheme() : normalizedPreference

  vuetify.theme.change(activeTheme)
  document.documentElement.dataset.theme = activeTheme
}

export const themePreference = () => getThemePreference()

export const setThemePreference = (preference) => {
  const normalizedPreference = validThemePreferences.includes(preference) ? preference : 'system'
  localStorage.setItem(themePreferenceKey, normalizedPreference)
  applyThemePreference(normalizedPreference)
}

const systemThemeMedia = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
systemThemeMedia?.addEventListener('change', () => {
  if (getThemePreference() === 'system') applyThemePreference('system')
})

applyThemePreference()

export default vuetify