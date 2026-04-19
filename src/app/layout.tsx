import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bhartiya Rishtey — Premium Indian Matrimonial Platform',
  description:
    'Find your perfect life partner with Bhartiya Rishtey. A trusted, premium matrimonial platform celebrating Indian heritage and modern values.',
  keywords: 'matrimony, Indian wedding, matrimonial, matchmaking, marriage',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
