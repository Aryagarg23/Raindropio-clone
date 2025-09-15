
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '@fontsource/inter/index.css';
import '@fontsource/nunito-sans/index.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
