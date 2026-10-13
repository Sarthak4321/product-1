import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Our Mission & Educational CRM Tech",
  description:
    "Learn how LeadDesk was built to solve lead leakage for coaching academies with zero-latency outreach, automated telecalling, and streamlined operations.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us — Our Mission & Educational CRM Tech | LeadDesk",
    description:
      "Empowering coaching institute admissions and operations teams with intelligent automation and zero lead leakage.",
    url: "/about",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us — LeadDesk Institute CRM",
    description:
      "Learn how LeadDesk was built to solve lead leakage for coaching academies with zero-latency outreach.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
