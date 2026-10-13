import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Usage Policies",
  description:
    "Official terms of service for LeadDesk workspace administrators, telecallers, and coaching centers governing data handling and outreach compliance.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service & Usage Policies | LeadDesk",
    description:
      "Review the terms and conditions for using the LeadDesk coaching institute management platform.",
    url: "/terms",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service — LeadDesk",
    description:
      "Official terms of service and compliance guidelines for LeadDesk users.",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
