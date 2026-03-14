import HeroUpload from "@/componets/landing/HeroUpload";
import SellerSection from "@/componets/landing/SellerSection";
import SpeedSection from "@/componets/landing/SpeedSection";
import CompatibleModels from "@/componets/landing/CompatibleModels";
import FAQ from "@/componets/landing/FAQ";
import Footer from "@/componets/layouts/Footer";

export default function Home() {
  return (
    <>
      <HeroUpload />
      <SellerSection />
      <SpeedSection />
      <CompatibleModels />
      <FAQ />
      <Footer />
    </>
  );
}
