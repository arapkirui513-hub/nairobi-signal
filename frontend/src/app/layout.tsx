import './globals.css';

export const metadata = {
  title: 'NairobiSignal',
  description: 'Live Economic Intelligence for the Kenyan Tech Ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
