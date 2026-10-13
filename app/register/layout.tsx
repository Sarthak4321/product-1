import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Institute Workspace — 14-Day Free Trial",
  description:
    "Launch your coaching center's dedicated LeadDesk workspace in under 60 seconds. Full access to admission pipelines, auto-calling desks, and employee management.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Create Institute Workspace — 14-Day Free Trial | LeadDesk",
    description:
      "Start your 14-day free trial with full access to LeadDesk lead CRM, automated follow-ups, and staff operations.",
    url: "/register",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start Free Trial — LeadDesk",
    description:
      "Launch your coaching center workspace with full access to LeadDesk.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
