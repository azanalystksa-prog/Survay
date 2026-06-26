export type Lang = "en" | "ar";

// Central UI string dictionary. Every label ships in English and Arabic.
export const STRINGS = {
  appName: { en: "Easy Survey", ar: "إيزي سرفاي" },
  tagline: { en: "Research operating system for universities", ar: "نظام تشغيل البحث للجامعات" },

  // Nav groups
  navResearcher: { en: "Researcher", ar: "الباحث" },
  navSupervisor: { en: "Supervisor", ar: "المشرف" },
  navParticipant: { en: "Participant", ar: "المشارك" },
  navPanelOps: { en: "Panel Ops", ar: "إدارة اللوحة" },
  navEnterprise: { en: "Enterprise", ar: "المؤسسات" },

  // Nav items
  dashboard: { en: "Dashboard", ar: "لوحة المعلومات" },
  createStudy: { en: "Create Study", ar: "إنشاء دراسة" },
  sampleDesigner: { en: "Sample Designer", ar: "مصمم العينة" },
  ethicsIrb: { en: "Ethics & IRB", ar: "الأخلاقيات والموافقة" },
  liveMonitor: { en: "Live Monitor", ar: "المراقبة الحية" },
  analysis: { en: "Analysis", ar: "التحليل" },
  integrityCertificate: { en: "Integrity Certificate", ar: "شهادة النزاهة" },
  wallet: { en: "Wallet", ar: "المحفظة" },
  oversight: { en: "Oversight", ar: "الإشراف" },
  panelistApp: { en: "Panelist App", ar: "تطبيق المشارك" },
  specialtyRegistry: { en: "Specialty Registry", ar: "سجل التخصصات" },
  verification: { en: "Verification", ar: "التحقق" },
  workplaceInsights: { en: "Workplace Insights", ar: "رؤى مكان العمل" },

  // Common
  search: { en: "Search…", ar: "بحث…" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج" },
  switchRole: { en: "Switch role", ar: "تبديل الدور" },
  apply: { en: "Apply", ar: "تطبيق" },
  dismiss: { en: "Dismiss", ar: "تجاهل" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  add: { en: "Add", ar: "إضافة" },
  delete: { en: "Delete", ar: "حذف" },
  required: { en: "Required", ar: "إلزامي" },
  resetDemo: { en: "Reset demo", ar: "إعادة ضبط العرض" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },

  // Lifecycle
  lifecycle: { en: "Research lifecycle", ar: "دورة حياة البحث" },
  design: { en: "Design", ar: "التصميم" },
  collect: { en: "Collect", ar: "الجمع" },
  analyze: { en: "Analyze", ar: "التحليل" },

  // Dashboard KPIs
  activeStudies: { en: "Active studies", ar: "الدراسات النشطة" },
  responsesThisWeek: { en: "Responses this week", ar: "الردود هذا الأسبوع" },
  medianTime: { en: "Median time-to-100", ar: "الوقت الوسيط لـ100 رد" },
  walletBalance: { en: "Wallet balance", ar: "رصيد المحفظة" },
  yourStudies: { en: "Your studies", ar: "دراساتك" },
  stage: { en: "Stage", ar: "المرحلة" },
  progress: { en: "Progress", ar: "التقدم" },
  qualityScore: { en: "Quality score", ar: "درجة الجودة" },

  // Builder
  questionnaireBuilder: { en: "Questionnaire builder", ar: "منشئ الاستبيان" },
  addQuestion: { en: "Add question", ar: "إضافة سؤال" },
  questionText: { en: "Question text", ar: "نص السؤال" },
  estCompletion: { en: "Estimated completion time", ar: "وقت الإكمال المقدّر" },
  aiReviewer: { en: "AI questionnaire reviewer", ar: "مراجع الاستبيان بالذكاء الاصطناعي" },
  reviewerNote: {
    en: "The wording and final question set are yours to decide.",
    ar: "الصياغة ومجموعة الأسئلة النهائية قرارك أنت.",
  },
  runReview: { en: "Run review", ar: "تشغيل المراجعة" },
  noFlags: { en: "No issues found. Looks rigorous.", ar: "لا توجد مشكلات. يبدو دقيقًا." },

  // Sample designer
  population: { en: "Population (N)", ar: "حجم المجتمع (N)" },
  confidence: { en: "Confidence level", ar: "مستوى الثقة" },
  marginOfError: { en: "Margin of error (±%)", ar: "هامش الخطأ (±%)" },
  requiredSample: { en: "Required sample size", ar: "حجم العينة المطلوب" },
  withFpc: { en: "Adjusted for finite population", ar: "بعد تصحيح المجتمع المحدود" },
  formulaUsed: { en: "Formula used", ar: "الصيغة المستخدمة" },
  methodRecommender: { en: "Sampling method recommender", ar: "موصي طريقة المعاينة" },
  researchGoal: { en: "Research goal", ar: "هدف البحث" },
  recommend: { en: "Recommend method", ar: "اقترح طريقة" },
  methodNote: {
    en: "Choosing and justifying the method is your decision.",
    ar: "اختيار الطريقة وتبريرها قرارك أنت.",
  },
  stratifiedPlan: { en: "Stratified plan", ar: "خطة طبقية" },
  stratum: { en: "Stratum", ar: "الطبقة" },
  quota: { en: "Quota", ar: "الحصة" },
  collected: { en: "Collected", ar: "تم جمعه" },

  // Ethics
  consentForm: { en: "Informed consent", ar: "الموافقة المستنيرة" },
  infoSheet: { en: "Participant info sheet", ar: "ورقة معلومات المشارك" },
  irbSummary: { en: "IRB submission summary", ar: "ملخص تقديم لجنة الأخلاقيات" },
  pdplNotice: { en: "PDPL data-processing notice", ar: "إشعار معالجة البيانات (نظام حماية البيانات)" },
  generateDocs: { en: "Generate documents", ar: "توليد المستندات" },
  markApproved: { en: "Mark approved", ar: "وضع علامة موافق" },
  approvalNumber: { en: "Approval number", ar: "رقم الموافقة" },
  approved: { en: "Approved", ar: "تمت الموافقة" },

  // Monitor
  validResponses: { en: "Valid responses", ar: "الردود الصالحة" },
  qualityPassRate: { en: "Quality pass rate", ar: "معدل اجتياز الجودة" },
  medianCompletion: { en: "Median completion time", ar: "الوقت الوسيط للإكمال" },
  timeToFill: { en: "Est. time-to-fill", ar: "الوقت المقدّر للاكتمال" },
  representativeness: { en: "Representativeness vs target", ar: "التمثيل مقابل الهدف" },
  qualityEngine: { en: "Quality engine", ar: "محرك الجودة" },
  responsesOverTime: { en: "Responses over time", ar: "الردود عبر الزمن" },
  excludedNote: {
    en: "Excluded responses are not charged and not in the dataset.",
    ar: "الردود المستبعدة غير محتسبة وغير مدرجة في البيانات.",
  },

  // Analysis
  descriptives: { en: "Descriptive statistics", ar: "الإحصاء الوصفي" },
  cronbach: { en: "Cronbach's alpha", ar: "ألفا كرونباخ" },
  analysisAssistant: { en: "AI analysis assistant", ar: "مساعد التحليل بالذكاء الاصطناعي" },
  suggestedTest: { en: "Suggested statistical test", ar: "الاختبار الإحصائي المقترح" },
  analysisNote: {
    en: "Interpreting what the results mean stays your work.",
    ar: "تفسير معنى النتائج يبقى عملك أنت.",
  },
  exportCsv: { en: "Export CSV", ar: "تصدير CSV" },
  exportCodebook: { en: "SPSS/R codebook", ar: "كتيب أكواد SPSS/R" },
  mean: { en: "Mean", ar: "المتوسط" },
  sd: { en: "SD", ar: "الانحراف" },
  n: { en: "n", ar: "ن" },

  // Certificate
  dataIntegrityCertificate: { en: "Data Integrity Certificate", ar: "شهادة نزاهة البيانات" },
  issueCertificate: { en: "Issue certificate", ar: "إصدار الشهادة" },
  verifyCode: { en: "Verification code", ar: "رمز التحقق" },
  botsBlocked: { en: "Bots blocked", ar: "الروبوتات المحجوبة" },
  collectionWindow: { en: "Collection window", ar: "نافذة الجمع" },
  downloadPdf: { en: "Download / Print PDF", ar: "تنزيل / طباعة PDF" },
  coSign: { en: "Co-sign certificate", ar: "التوقيع المشترك" },
  verified: { en: "Verified", ar: "موثّق" },
  signedBy: { en: "Co-signed by", ar: "وقّع بالاشتراك" },

  // Panelist
  surveysForYou: { en: "Surveys for you", ar: "استبيانات تناسبك" },
  points: { en: "points", ar: "نقطة" },
  takeSurvey: { en: "Take survey", ar: "ابدأ الاستبيان" },
  submit: { en: "Submit", ar: "إرسال" },
  redeem: { en: "Redeem points", ar: "استبدال النقاط" },
  pointsAwarded: { en: "Points awarded!", ar: "تم منح النقاط!" },
  noSurveys: { en: "No matching surveys right now.", ar: "لا توجد استبيانات مطابقة الآن." },

  // Registry
  availableCount: { en: "Available", ar: "متاح" },
  status: { en: "Status", ar: "الحالة" },
  avgFulfil: { en: "Avg fulfil (days)", ar: "متوسط التوفير (أيام)" },
  requestSpecialty: { en: "Request a specialty", ar: "طلب تخصص" },
  verificationQueue: { en: "Verification queue", ar: "قائمة التحقق" },
  approve: { en: "Approve", ar: "موافقة" },
  reject: { en: "Reject", ar: "رفض" },

  // Enterprise
  engagementScore: { en: "Engagement score", ar: "درجة الانخراط" },
  responseRate: { en: "Response rate", ar: "معدل الاستجابة" },
  enps: { en: "eNPS", ar: "مؤشر eNPS" },
  byDepartment: { en: "Engagement by department", ar: "الانخراط حسب القسم" },
  hiddenSmall: { en: "Hidden — group too small", ar: "مخفي — المجموعة صغيرة جدًا" },
  anonymityRule: { en: "Groups under 5 people are hidden to protect anonymity.", ar: "تُخفى المجموعات الأقل من 5 أشخاص لحماية السرية." },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  const entry = STRINGS[key];
  return entry ? entry[lang] : String(key);
}
