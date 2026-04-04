// src/constants/subscriptionTiers.ts

export type SubscriptionTier = "starter" | "pro" | "elite";
export type BillingCycle = "monthly" | "annual";

export interface TierConfig {
  /** Human-readable name */
  label: string;
  /** Max active property listings (Infinity = unlimited) */
  maxProperties: number;
  /** Max active vehicle listings (Infinity = unlimited) */
  maxVehicles: number;
  /** Max photos per listing */
  maxPhotos: number;
  /** Whether the feature video upload is available */
  featureVideo: boolean;
  /** Max video duration in seconds (0 if featureVideo = false) */
  videoMaxSeconds: number;
  /** Max video file size in MB (0 if featureVideo = false) */
  videoMaxSizeMB: number;
  /** Commission rate taken by the platform (0–1) */
  commissionRate: number;
  /** Points added to search/homepage ranking score */
  searchBoost: number;
  /** Whether listings appear in the homepage featured rotation */
  homepageFeatured: boolean;
  /** Monthly price in NGN (0 = free) */
  priceMonthly: number;
  /** Annual price in NGN (total, not per month) */
  priceAnnual: number;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  starter: {
    label: "Starter",
    maxProperties: 3,
    maxVehicles: 2,
    maxPhotos: 20,
    featureVideo: false,
    videoMaxSeconds: 0,
    videoMaxSizeMB: 0,
    commissionRate: 0.12,
    searchBoost: 0,
    homepageFeatured: false,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    label: "Pro",
    maxProperties: 10,
    maxVehicles: 6,
    maxPhotos: 30,
    featureVideo: true,
    videoMaxSeconds: 60,
    videoMaxSizeMB: 50,
    commissionRate: 0.10,
    searchBoost: 5,
    homepageFeatured: false,
    priceMonthly: 7500,
    priceAnnual: 75000, // 2 months free
  },
  elite: {
    label: "Elite",
    maxProperties: Infinity,
    maxVehicles: Infinity,
    maxPhotos: 50,
    featureVideo: true,
    videoMaxSeconds: 90,
    videoMaxSizeMB: 100,
    commissionRate: 0.08,
    searchBoost: 15,
    homepageFeatured: true,
    priceMonthly: 18000,
    priceAnnual: 180000, // 2 months free
  },
};

/** Ordered from lowest to highest for comparison */
export const TIER_ORDER: SubscriptionTier[] = ["starter", "pro", "elite"];

/** Returns true if `candidate` meets or exceeds `required` */
export function tierMeetsMinimum(candidate: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER.indexOf(candidate) >= TIER_ORDER.indexOf(required);
}

/** Paystack plan code env var names */
export const PLAN_ENV_KEYS: Record<SubscriptionTier, Record<BillingCycle, string | null>> = {
  starter: { monthly: null, annual: null },
  pro: { monthly: "PAYSTACK_PRO_MONTHLY_PLAN_CODE", annual: "PAYSTACK_PRO_ANNUAL_PLAN_CODE" },
  elite: { monthly: "PAYSTACK_ELITE_MONTHLY_PLAN_CODE", annual: "PAYSTACK_ELITE_ANNUAL_PLAN_CODE" },
};

export function getPlanCode(tier: SubscriptionTier, cycle: BillingCycle): string | null {
  const key = PLAN_ENV_KEYS[tier][cycle];
  if (!key) return null;
  return process.env[key] ?? null;
}
