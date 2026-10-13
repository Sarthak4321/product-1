import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AppContextProvider } from "@/components/context/AppContext";
import { WebVitals } from "@/components/analytics/WebVitals";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://leaddesk-bay.vercel.app"),
  title: {
    default: "LeadDesk — Coaching Institute Management & CRM System",
    template: "%s | LeadDesk",
  },
  description:
    "Run your coaching institute from one powerful platform. Manage leads, automate telecaller follow-ups, track employee attendance, and streamline HR and payroll.",
  keywords: [
    "coaching institute CRM",
    "institute management system",
    "education CRM",
    "telecaller management software",
    "lead management system",
    "staff attendance system",
    "batch fee management",
    "coaching class automation",
    "LeadDesk",
  ],
  authors: [{ name: "LeadDesk" }],
  creator: "LeadDesk",
  publisher: "LeadDesk",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LeadDesk — Coaching Institute Management & CRM System",
    description:
      "All-in-one coaching institute system. Eliminate lead leakage, automate telecaller follow-ups, track employee attendance, and scale admissions.",
    url: "https://leaddesk-bay.vercel.app",
    siteName: "LeadDesk",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadDesk — Coaching Institute Management System",
    description:
      "Eliminate lead leakage, automate follow-ups, track employee attendance, and scale batch admissions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: "srSpV-6P3OO_KWW8j9D3bOiyZdFjYitlE9gFj1YCTiw",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "LeadDesk",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "description":
          "The complete coaching institute management system. Manage leads, automate follow-ups, track employee attendance, and streamline HR and payroll.",
        "offers": {
          "@type": "Offer",
          "price": "2499",
          "priceCurrency": "INR",
          "priceValidUntil": "2027-12-31",
        },
      },
      {
        "@type": "Organization",
        "name": "LeadDesk",
        "url": "https://leaddesk-bay.vercel.app",
        "logo": "https://leaddesk-bay.vercel.app/icon.svg",
        "sameAs": [],
      },
      {
        "@type": "WebSite",
        "name": "LeadDesk",
        "url": "https://leaddesk-bay.vercel.app",
      },
    ],
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="google-site-verification" content="srSpV-6P3OO_KWW8j9D3bOiyZdFjYitlE9gFj1YCTiw" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <WebVitals />
        <ToastProvider>
          <AppContextProvider>{children}</AppContextProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
