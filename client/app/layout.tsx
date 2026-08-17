import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { ConfirmProvider } from "@/providers/confirm-provider";
import StoreProvider from "@/providers/store-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import type { Metadata, Viewport } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import SkipLink from "@/components/ui/SkipLink";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// Absolute site URL, used by the Metadata API to resolve relative assets
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = "Mercovia";
const siteTitle = "Mercovia - Multi-Vendor E-Commerce Marketplace";
const siteDescription =
  "Mercovia is a multi-vendor marketplace platform to buy and sell products";
const previewImage = "/logo.svg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName,
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Site-wide E-Commerce Marketplace structured data (JSON-LD)
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  logo: `${siteUrl}${previewImage}`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('mercovia-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();",
          }}
        />
      </head>
      <body
        // className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${roboto.variable} bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased duration-300 bg-no-repeat`}
        // className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${roboto.variable} bg-background text-foreground antialiased duration-300 bg-no-repeat`}
        className={`${poppins.variable} ${roboto.variable} bg-background text-foreground antialiased duration-300 bg-no-repeat`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <SkipLink />
        <StoreProvider>
          <ThemeProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <div id="main-content">{children}</div>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
