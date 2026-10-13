import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin & Director Sign In — Institute Workspace",
  description:
    "Access your LeadDesk administrative command center. Oversee daily lead pipelines, telecaller conversion KPIs, staff attendance, and batch revenue collections.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Admin Sign In | LeadDesk Institute Workspace",
    description:
      "Log in to your administrative dashboard to monitor admissions, calling KPIs, and employee attendance.",
    url: "/login",
    type: "website",
    siteName: "LeadDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Admin Sign In — LeadDesk",
    description:
      "Access your LeadDesk administrative dashboard to oversee coaching operations.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
