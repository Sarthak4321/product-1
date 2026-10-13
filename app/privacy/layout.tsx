import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Protection Standards",
  description:
    "Understand how LeadDesk protects student prospect inquiries, staff attendance records, and organization databases with enterprise encryption and zero third-party data sharing.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy & Data Protection Standards | LeadDesk",
    description:
      "Enterprise-grade cryptographic security and privacy standards for coaching institutions on LeadDesk.",
    url: "/privacy",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — LeadDesk",
    description:
      "Enterprise-grade data security protocols protecting student inquiries and staff attendance.",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
