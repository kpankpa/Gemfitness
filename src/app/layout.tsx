import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { Providers } from "@/components/providers";

// Primary font for body text - clean and readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Heading font - bold and impactful
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GemFitness - We're What We Eat!",
  description: "Gym memberships, group classes, and personal training in Gbestile, Tema, Ghana.",
  keywords: [
    "gym",
    "fitness",
    "workout",
    "health",
    "training",
    "Ghana",
    "Tema",
    "Gbestile",
    "gym membership",
    "personal training",
    "nutrition",
  ],
  authors: [{ name: "GemFitness" }],
  creator: "GemFitness",
  publisher: "GemFitness",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://gemfitness.fit",
    siteName: "GemFitness",
    title: "GemFitness - We're What We Eat!",
    description: "Gym memberships, group classes, and personal training in Gbestile, Tema, Ghana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GemFitness",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GemFitness - We're What We Eat!",
    description: "Gym memberships, group classes, and personal training in Gbestile, Tema, Ghana.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/gemfitness.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/gemfitness.svg", sizes: "48x48", type: "image/svg+xml" },
    ],
    apple: [{ url: "/gemfitness.svg", sizes: "180x180", type: "image/svg+xml" }],
    shortcut: "/gemfitness.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <script src="https://js.paystack.co/v1/inline.js" async></script>
      </head>
      <body className="font-sans antialiased bg-white">
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
