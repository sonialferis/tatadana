import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram',
  description:
    'Aplikasi manajemen keuangan pribadi premium Indonesia yang terintegrasi langsung dengan Telegram Bot. Catat pemasukan dan pengeluaran secepat kirim pesan.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans text-slate-900 bg-slate-50 selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
