import { defineConfig, loadEnv } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
    },
    define: {
      'process.env': env,
    },
    plugins: [
      ...VitePluginNode({
        adapter: 'express',
        appPath: './src/index.ts',
        exportName: 'viteNodeApp',
        tsCompiler: 'vite',
      }),
    ],
    optimizeDeps: {
      exclude: ['mongoose'],
    },
  };
});
