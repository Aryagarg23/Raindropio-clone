
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '@fontsource/inter/index.css';
import '@fontsource/nunito-sans/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
