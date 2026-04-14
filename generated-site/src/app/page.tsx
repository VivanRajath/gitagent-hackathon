'use client';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CardSection from '../components/CardSection';
import FeatureStrip from '../components/FeatureStrip';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <CardSection />
      <FeatureStrip />
      <CTABanner />
      <Footer />
    </main>
  );
}
