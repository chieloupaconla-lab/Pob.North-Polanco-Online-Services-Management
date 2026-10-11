export const COMPLAINT_CATEGORIES = [
  {
    name: "Peace and Order",
    description: "Noise disturbances, public disturbances, conflicts, suspicious activities",
  },
  {
    name: "Public Safety",
    description: "Unsafe areas, dangerous situations, accidents, safety concerns",
  },
  {
    name: "Environmental Concerns",
    description: "Improper waste disposal, littering, pollution, clogged drainage",
  },
  {
    name: "Infrastructure and Facilities",
    description: "Damaged roads, streetlights, drainage, public facilities, pathways",
  },
  {
    name: "Sanitation and Cleanliness",
    description: "Unclean surroundings, garbage collection issues, unsanitary areas",
  },
  {
    name: "Animal-Related Concerns",
    description: "Stray animals, dangerous animals, animal disturbances",
  },
  {
    name: "Community Concerns",
    description: "Neighborhood disputes, community conflicts, disturbances involving residents",
  },
  {
    name: "Public Services",
    description: "Problems with barangay services, delays, or difficulties accessing services",
  },
  {
    name: "Property and Land Concerns",
    description: "Property disputes, boundary concerns, unauthorized use of property",
  },
  {
    name: "Others",
    description: "For a specific concern that does not fit any of the listed categories",
  },
] as const;

export const OFFICIAL_COMPLAINT_CATEGORIES = COMPLAINT_CATEGORIES.map(
  (category) => category.name
) as [string, ...string[]];

export type OfficialComplaintCategory =
  (typeof COMPLAINT_CATEGORIES)[number]["name"];

export function isOfficialComplaintCategory(
  value: unknown
): value is OfficialComplaintCategory {
  return (
    typeof value === "string" &&
    (OFFICIAL_COMPLAINT_CATEGORIES as readonly string[]).includes(value)
  );
}
