import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'TourUZ Dashboard — B2B Agency CRM & Extranet',
  description: 'Панель управления турами и CRM заявок для туроператоров Узбекистана',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TourUZ CRM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="overflow-x-clip min-h-[100dvh]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
