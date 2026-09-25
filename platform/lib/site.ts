/**
 * Site-wide constants. Single source of truth for URLs and brand strings.
 */
export const SITE = {
  name: "FinishLine",
  legalName: "FinishLine",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://finishlinemsp.com"),
  tagline: "Practical IT for businesses that cannot afford surprises.",
  description:
    "FinishLine is the local IT and cybersecurity partner for 5–30-person professional-services firms in Newport Beach and the South Bay.",
  email: "phil@finishlinemsp.com",
  // CAN-SPAM: a real physical postal address must appear in every commercial email.
  postalAddress: "FinishLine • San Francisco, CA",
} as const;

/** The intelligence-product name used on the daily content engine pages. */
export const SIGNALS_BRAND = "FinishLine Intelligence" as const;
