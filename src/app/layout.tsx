import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MobileBottomNav from '../components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'TourUZ Dashboard — B2B Agency CRM & Extranet',
  description: 'Панель управления турами и CRM заявок для туроператоров Узбекистана',
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
      <body>
        <Providers>
          <div className="flex min-h-screen bg-sand-50 pb-16 lg:pb-0">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
