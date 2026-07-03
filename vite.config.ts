import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'supabase-proxy',
        configureServer(server) {
          server.middlewares.use('/api/payments', (req, res, next) => {
            if (req.method !== 'POST' && req.method !== 'PATCH') return next();
            
            // req.originalUrl is /api/payments?id=eq.123
            const queryPart = req.originalUrl?.split('?')[1] ? `?${req.originalUrl.split('?')[1]}` : '';

            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
              try {
                // Node.js v18+ has native fetch
                const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/payments${queryPart}`, {
                  method: req.method,
                  headers: {
                    'apikey': env.VITE_SUPABASE_SECRET_KEY,
                    'Authorization': `Bearer ${env.VITE_SUPABASE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: body
                });
                const data = await response.text();
                res.statusCode = response.status;
                res.end(data);
              } catch (e: any) {
                res.statusCode = 500;
                res.end(e.message);
              }
            });
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
