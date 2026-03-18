import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/componets/layouts/Navbar";
import TopBar from "@/componets/layouts/TopBar";
import FeedbackWidget from "@/componets/ui/FeedbackWidget";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "DroneOK — El primer verificador de drones en Chile",
  description: "Analizá los registros de vuelo de cualquier dron DJI y obtené un certificado de salud verificable en segundos. Ideal para compra y venta de drones usados en Chile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <Navbar />
        <TopBar />
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
