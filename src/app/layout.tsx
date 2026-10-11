import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pob-north-polanco-online-services-management-bb05z9zbs.vercel.app"),
  title: {
    default: "Barangay Poblacion North, Polanco, Zamboanga del Norte | Online Services",
    template: "%s | Barangay Poblacion North",
  },
  description:
    "Official online services portal of Barangay Poblacion North, Polanco, Zamboanga del Norte. Request barangay documents, report public facility concerns, and access barangay services online.",
  keywords: [
    "Barangay Poblacion North",
    "Poblacion North Polanco",
    "Polanco Zamboanga del Norte",
    "Barangay services",
    "Barangay online services",
    "Barangay documents",
    "Barangay Clearance",
    "Certificate of Residency",
    "Barangay Business Clearance",
    "Community Tax Certificate (Cedula)",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Barangay Poblacion North Online Services",
    title: "Barangay Poblacion North, Polanco, Zamboanga del Norte | Online Services",
    description:
      "Official online services portal for barangay documents, public facility concerns, and barangay-owned equipment borrowing.",
    locale: "en_PH",
  },
  twitter: {
    card: "summary",
    title: "Barangay Poblacion North Online Services",
    description:
      "Official online services portal of Barangay Poblacion North, Polanco, Zamboanga del Norte.",
  },
  robots: { index: true, follow: true },
  applicationName: "Barangay Poblacion North Online Services",
  appleWebApp: {
    capable: true,
    title: "Barangay Poblacion North",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4c1d95",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="google-site-verification"
          content="3-L_aYRpOeTCqnwA_ljFNqDNFVSBrU7t6Q1gthGMnVk"
        />
      </head>

      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
