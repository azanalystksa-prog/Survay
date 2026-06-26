// Type unions mirroring the string fields in the Prisma schema (SQLite has no enums).

export type Role = "RESEARCHER" | "SUPERVISOR" | "PANELIST" | "ADMIN" | "ENTERPRISE";
export type PanelistKind = "STUDENT" | "PROFESSIONAL" | "PUBLIC";
export type VerifiedBy = "UNI_EMAIL" | "CREDENTIAL" | "EMPLOYER" | "NONE";
export type StudyStatus = "DRAFT" | "PILOT" | "COLLECTING" | "CLOSED" | "CERTIFIED";
export type SamplingMethod = "RANDOM" | "STRATIFIED" | "QUOTA" | "CONVENIENCE";
export type PricingTier = "STANDARD" | "TARGETED" | "PREMIUM";
export type QuestionType = "SINGLE" | "MULTI" | "LIKERT" | "SHORT_TEXT" | "NUMBER";
export type QualityStatus = "VALID" | "SPEEDER" | "FAILED_ATTENTION" | "DUPLICATE" | "BOT";
export type EthicsStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export const ROLE_LABELS: Record<Role, { en: string; ar: string }> = {
  RESEARCHER: { en: "Researcher", ar: "باحث" },
  SUPERVISOR: { en: "Supervisor", ar: "مشرف" },
  PANELIST: { en: "Panelist", ar: "مشارك" },
  ADMIN: { en: "Panel Ops", ar: "إدارة اللوحة" },
  ENTERPRISE: { en: "Enterprise", ar: "المؤسسات" },
};

export const STUDY_STATUS_LABELS: Record<StudyStatus, { en: string; ar: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  PILOT: { en: "Pilot", ar: "تجريبي" },
  COLLECTING: { en: "Collecting", ar: "قيد الجمع" },
  CLOSED: { en: "Closed", ar: "مغلق" },
  CERTIFIED: { en: "Certified", ar: "موثّق" },
};

export const QUALITY_LABELS: Record<QualityStatus, { en: string; ar: string }> = {
  VALID: { en: "Valid", ar: "صالح" },
  SPEEDER: { en: "Speeder", ar: "سريع جدًا" },
  FAILED_ATTENTION: { en: "Failed attention check", ar: "فشل اختبار الانتباه" },
  DUPLICATE: { en: "Duplicate", ar: "مكرر" },
  BOT: { en: "Bot", ar: "روبوت" },
};
