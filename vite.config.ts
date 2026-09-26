import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Project Pages live at /<repo>/; user sites and local dev stay at /. */
function githubPagesBase(): string {
  if (process.env.GITHUB_ACTIONS !== 'true') return '/';

  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  if (!repo || repo === `${owner}.github.io`) return '/';

  return `/${repo}/`;
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
});
