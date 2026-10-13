import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Core Values & Reliability — Zero-Latency Infrastructure",
  description:
    "Explore the fundamental engineering pillars of LeadDesk: 0ms latency follow-ups, clean CSV lead parsing, cryptographic session auditing, and 99.99% system uptime.",
  alternates: {
    canonical: "/values",
  },
  openGraph: {
    title: "Core Values & System Reliability | LeadDesk",
    description:
      "Designed for high performance and engineered for student data integrity. Explore our core engineering principles.",
    url: "/values",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Core Values & Reliability — LeadDesk",
    description:
      "0ms latency follow-ups, clean CSV lead parsing, cryptographic session auditing, and 99.99% system uptime.",
  },
};

export default function ValuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
