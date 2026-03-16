import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NairobiSignal — Intelligence Terminal',
  description: 'Structural thermodynamics of the Kenyan tech ecosystem.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
