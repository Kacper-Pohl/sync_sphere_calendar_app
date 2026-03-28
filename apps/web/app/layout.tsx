import './globals.css';

export const metadata = {
  title: 'Calendar App',
  description: 'Zarządzaj wydarzeniami i integruj kalendarz ze znajomymi!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
