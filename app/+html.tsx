import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Plantilla HTML raíz para export estático web (PWA).
 * Solo se ejecuta en Node durante `expo export -p web`.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>FinApp - Finanzas Personales</title>
        <meta name="theme-color" content="#F5F0E8" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0D0D14" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinApp" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <ScrollViewStyleReset />
        <style>{`html,body,#root{width:100%;max-width:100vw;min-width:0;overflow-x:hidden}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
