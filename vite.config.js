import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Change '/workout-tracker/' to '/<your-github-repo-name>/' before deploying
export default defineConfig({
  plugins: [react()],
  // Use '/' locally (npm run dev) so you don't need the repo path prefix.
  // On production (npm run build), set this to '/<your-repo-name>/'.
  base: process.env.NODE_ENV === 'production' ? '/training-plan/' : '/',
})
