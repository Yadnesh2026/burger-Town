import type { Metadata } from 'next';
import './globals.css';
import './colorful.css';

export const metadata: Metadata = { title: 'Pulse | Business Analytics', description: 'Fast restaurant sales analytics' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
