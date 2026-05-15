"use client";

import { useReportWebVitals } from "next/web-vitals";

type SentryGlobal = {
  setMeasurement?: (name: string, value: number, unit: string) => void;
};

export function WebVitals() {
  useReportWebVitals((metric) => {
    const sentry = (window as { Sentry?: SentryGlobal }).Sentry;
    sentry?.setMeasurement?.(
      metric.name,
      metric.value,
      metric.name === "CLS" ? "" : "millisecond",
    );
  });

  return null;
}
