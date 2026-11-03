import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

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
      <body>
        <Providers>
          <div className="flex min-h-screen bg-sand-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
