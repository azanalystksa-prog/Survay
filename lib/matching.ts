// Determines whether a study's audienceFilter matches a panelist profile.

export interface AudienceFilter {
  kind?: string;
  specialty?: string;
  college?: string;
  city?: string;
}

export interface PanelistLike {
  kind: string;
  specialty?: string | null;
  college?: string | null;
  city: string;
}

export function parseAudience(json: string | null | undefined): AudienceFilter {
  if (!json) return {};
  try {
    return JSON.parse(json) as AudienceFilter;
  } catch {
    return {};
  }
}

export function matchesAudience(filter: AudienceFilter, panelist: PanelistLike): boolean {
  if (filter.kind && filter.kind !== panelist.kind) return false;
  if (filter.specialty && filter.specialty !== panelist.specialty) return false;
  if (filter.college && filter.college !== panelist.college) return false;
  if (filter.city && filter.city !== panelist.city) return false;
  return true;
}

export function describeAudience(filter: AudienceFilter, lang: "en" | "ar"): string {
  const parts: string[] = [];
  if (filter.kind) parts.push(filter.kind === "STUDENT" ? (lang === "ar" ? "طلاب" : "Students") : filter.kind === "PROFESSIONAL" ? (lang === "ar" ? "مهنيون" : "Professionals") : lang === "ar" ? "العامة" : "Public");
  if (filter.specialty) parts.push(filter.specialty);
  if (filter.college) parts.push(filter.college);
  if (filter.city) parts.push(filter.city);
  if (parts.length === 0) return lang === "ar" ? "الجميع" : "Everyone";
  return parts.join(" · ");
}
