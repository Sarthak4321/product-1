"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // When deployed on Vercel or custom analytics, this logs / forwards Core Web Vitals:
    // LCP (Largest Contentful Paint), FID / INP (Interaction to Next Paint), CLS (Cumulative Layout Shift)
    if (process.env.NODE_ENV === "development") {
      // In development, you can observe real-time metrics in browser devtools
      // console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value * 100) / 100);
    }
  });

  return null;
}
