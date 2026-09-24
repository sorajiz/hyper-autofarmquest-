import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auto Hyper - Farm Orb | Cyberpunk Mission Control',
  description: 'High-performance mission control and Orbs tracker for Discord Quests Automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
