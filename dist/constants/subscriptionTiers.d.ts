export type SubscriptionTier = "starter" | "pro" | "elite";
export type BillingCycle = "monthly" | "annual";
export interface TierConfig {
    /** Human-readable name */
    label: string;
    /** Max active property listings (Infinity = unlimited) */
    maxProperties: number;
    /** Max active vehicle listings (Infinity = unlimited) */
    maxVehicles: number;
    /** Max active hotel listings (Infinity = unlimited) */
    maxHotels: number;
    /** Max room types a single hotel can have (Infinity = unlimited) */
    maxRoomTypes: number;
    /** Max active event center listings */
    maxEventCenters: number;
    /** Max spaces per event center */
    maxEventSpaces: number;
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
export declare const TIER_CONFIG: Record<SubscriptionTier, TierConfig>;
/** Ordered from lowest to highest for comparison */
export declare const TIER_ORDER: SubscriptionTier[];
/** Returns true if `candidate` meets or exceeds `required` */
export declare function tierMeetsMinimum(candidate: SubscriptionTier, required: SubscriptionTier): boolean;
/** Paystack plan code env var names */
export declare const PLAN_ENV_KEYS: Record<SubscriptionTier, Record<BillingCycle, string | null>>;
export declare function getPlanCode(tier: SubscriptionTier, cycle: BillingCycle): string | null;
//# sourceMappingURL=subscriptionTiers.d.ts.map