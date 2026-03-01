import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Buzzy Bee',
  description: 'A 3D Flappy Bird-style game with a cute bee flying through a garden',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Buzzy Bee',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4A90D9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#3A8F2E' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#3A8F2E',
          backgroundImage: 'linear-gradient(to bottom, #4A90D9 0%, #B8E4F9 25%, #5BBD3E 75%, #3A8F2E 100%)',
        }}
      >
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
