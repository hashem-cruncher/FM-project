import type { Metadata } from 'next';
import './globals.css';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { cn } from "@/lib/utils";
import { Navbar } from '@/components/Navbar';

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: 'منصة تعلم اللغة العربية للأطفال',
  description: 'منصة تعليمية تفاعلية لتعلم اللغة العربية للأطفال بطريقة ممتعة وسهلة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head />
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        arabic.variable
      )} suppressHydrationWarning>
        <Navbar />
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
