import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Counsellor & Telecaller Desk Login",
  description:
    "Dedicated login portal for coaching institute admission counsellors and telecallers to access daily call queues, log inquiry outcomes, and trigger WhatsApp follow-ups.",
  alternates: {
    canonical: "/counsellor-login",
  },
  openGraph: {
    title: "Counsellor Desk Login | LeadDesk",
    description:
      "Secure login portal for coaching institute telecallers and admission advisors.",
    url: "/counsellor-login",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Counsellor Desk Login — LeadDesk",
    description:
      "Access daily student call queues and outreach desks.",
  },
};

export default function CounsellorLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
