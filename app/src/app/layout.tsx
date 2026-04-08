import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Indigenous Cultural Alignment Review',
  description: 'Culturally responsive AI review prompts to help professionals ensure their work aligns with Indigenous frameworks and cultural protocols.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fustat:wght@200..800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
