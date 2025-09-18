import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '@fontsource/inter/index.css';
import '@fontsource/nunito-sans/index.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { TimeSyncProvider } from '../context/TimeSyncContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TimeSyncProvider>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </TimeSyncProvider>
  );
}