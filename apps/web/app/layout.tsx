import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'SyncSphere | Twój Elegancki Planner',
  description: 'Zarządzaj wydarzeniami i synchronizuj kalendarz Google w minimalistycznym wydaniu.',
  keywords: ['kalendarz', 'planner', 'google calendar', 'produktywność'],
};

import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="dark">
      <body className={`${outfit.variable} font-sans text-slate-200 antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
