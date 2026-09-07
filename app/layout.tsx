import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IP-SAKTI Sahayak | Ayurveda IP & Regulatory Guidance AI',
  description: 'Source-cited, RAG-based AI assistant for Intellectual Property and regulatory guidance related to Ayurveda.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
