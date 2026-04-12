// src/constants/propertyTypes.ts

export const VALID_PROPERTY_TYPES = [
  "entire home",
  "apartment",
  "duplex",
  "penthouse",
  "villa",
  "studio",
  "townhouse",
  "bungalow",
  "loft",
  "serviced apartment",
  "guest house",
  "beach house",
  "cabin",
  "chalet",
] as const;

export type PropertyType = (typeof VALID_PROPERTY_TYPES)[number];
