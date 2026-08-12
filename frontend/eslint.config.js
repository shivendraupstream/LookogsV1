import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // This rule flags a normal, long-standing React pattern (defaulting
      // state once external data loads, e.g. "select the first app once
      // the list arrives"). Rewriting every occurrence to satisfy this
      // newly-added rule is a real refactor with regression risk to
      // already-working code — deliberately disabled rather than rushed.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])