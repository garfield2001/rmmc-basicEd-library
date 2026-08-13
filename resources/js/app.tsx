import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const realtimeEnabled = import.meta.env.VITE_REALTIME_ENABLED === 'true' && Boolean(import.meta.env.VITE_REVERB_APP_KEY);

configureEcho({
    broadcaster: realtimeEnabled ? 'reverb' : 'null',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: [import.meta.env.VITE_REVERB_SCHEME === 'https' ? 'wss' : 'ws'],
});

const appName = (import.meta.env.VITE_APP_NAME || 'RMMC Integration School Library').replaceAll('_', ' ');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: false,
});
