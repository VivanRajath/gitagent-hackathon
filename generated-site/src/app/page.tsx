'use client';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Card from '../components/Card';
import FeatureStrip from '../components/FeatureStrip';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';
import { SpatialLayout } from '../components/SpatialEditor/SpatialLayout';
import { SpatialTarget } from '../components/SpatialEditor/SpatialTarget';

export default function Page() {
  return (
    <SpatialLayout>
      <main>
        <SpatialTarget id="navbar"><Navbar /></SpatialTarget>
        <SpatialTarget id="hero"><Hero /></SpatialTarget>
        <section className="flex flex-wrap gap-4 p-8 justify-center">
          <SpatialTarget id="card-eleven"><Card index={0} /></SpatialTarget>
          <SpatialTarget id="card-mike"><Card index={1} /></SpatialTarget>
        </section>
        <SpatialTarget id="featurestrip"><FeatureStrip /></SpatialTarget>
        <SpatialTarget id="cta"><CTABanner /></SpatialTarget>
        <SpatialTarget id="footer"><Footer /></SpatialTarget>
      </main>
    </SpatialLayout>
  );
}