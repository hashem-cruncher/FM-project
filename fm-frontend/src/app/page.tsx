import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Team from '@/components/Team';

export default function Home() {
  return (
    <main className="min-h-screen" dir="rtl">
      <Hero />
      <Features />
      <Team />
    </main>
  );
}
