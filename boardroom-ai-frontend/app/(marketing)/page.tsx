import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { ArchitecturePreview } from "@/components/marketing/architecture-preview";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";

export const metadata: Metadata = {
  title: "Boardroom AI — Your AI Board of Directors",
  description:
    "Six specialized AI executives analyze, debate, and vote on your business idea before returning one defensible recommendation.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ArchitecturePreview />
      <FeatureGrid />
      <HowItWorksSection />
    </>
  );
}
