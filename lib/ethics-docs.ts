// Generates ethics documents from templates + study fields, in EN and AR.

interface DocCtx {
  title: string;
  pi: string;
  method: string;
  targetN: number;
  institution: string;
}

export function consentDoc(c: DocCtx, lang: "en" | "ar"): string {
  if (lang === "ar") {
    return `# نموذج الموافقة المستنيرة

**عنوان الدراسة:** ${c.title}
**الباحث الرئيسي:** ${c.pi}
**المؤسسة:** ${c.institution}

أنت مدعو للمشاركة في دراسة بحثية تستخدم تصميم معاينة **${c.method}**. مشاركتك **طوعية**، ويمكنك الانسحاب في أي وقت دون أي عواقب.

## الغرض
تجمع هذه الدراسة ردودًا مجهولة لأغراض البحث الأكاديمي فقط.

## الإجراءات
ستكمل استبيانًا قصيرًا (يستغرق 3–7 دقائق تقريبًا).

## المخاطر والفوائد
لا توجد مخاطر متوقعة تتجاوز مخاطر الحياة اليومية. ستحصل على نقاط مكافآت.

## السرية
تُخزَّن ردودك بأمان وتُعرض بشكل تجميعي فقط. لا تُنشر أي معلومات تعريفية.

## الموافقة
بمتابعتك، تؤكد أن عمرك 18 عامًا أو أكثر وأنك توافق على المشاركة.`;
  }
  return `# Informed Consent Form

**Study title:** ${c.title}
**Principal investigator:** ${c.pi}
**Institution:** ${c.institution}

You are invited to participate in a research study using a **${c.method.toLowerCase()}** sampling design. Your participation is **voluntary**. You may withdraw at any time without penalty.

## Purpose
This study collects anonymous responses for academic research purposes only.

## Procedures
You will complete a short questionnaire (estimated 3–7 minutes).

## Risks & benefits
There are no anticipated risks beyond those of everyday life. You will receive panel reward points.

## Confidentiality
Your responses are stored securely and reported only in aggregate. No personally identifying information is published.

## Consent
By proceeding, you confirm that you are 18 years or older and consent to participate.`;
}

export function infoSheet(c: DocCtx, lang: "en" | "ar"): string {
  if (lang === "ar") {
    return `# ورقة معلومات المشارك

**الدراسة:** ${c.title}

- **ما هذا؟** استبيان بحثي أكاديمي.
- **من يمكنه المشاركة؟** أعضاء اللوحة الموثقون المطابقون لمعايير الأهلية.
- **كم يستغرق؟** حوالي 3–7 دقائق.
- **حقوقك:** المشاركة طوعية؛ يمكنك تخطي الأسئلة غير الإلزامية أو الانسحاب.
- **معالجة البيانات:** تُعالَج الردود بشكل مجهول وفقًا لنظام حماية البيانات الشخصية السعودي.
- **التواصل:** research.ethics@ksu.edu.sa`;
  }
  return `# Participant Information Sheet

**Study:** ${c.title}

- **What is this?** An academic research questionnaire.
- **Who can take part?** Verified panel members who match the study's eligibility criteria.
- **How long?** Approximately 3–7 minutes.
- **Your rights:** Participation is voluntary; you may skip non-required questions or withdraw.
- **Data handling:** Responses are anonymised and processed in line with the Saudi Personal Data Protection Law (PDPL).
- **Contact:** research.ethics@ksu.edu.sa`;
}

export function irbSummary(c: DocCtx, lang: "en" | "ar"): string {
  if (lang === "ar") {
    return `# ملخص تقديم لجنة الأخلاقيات (IRB)

**العنوان:** ${c.title}
**التصميم:** مسح مقطعي، معاينة **${c.method}**
**حجم العينة المستهدف:** ${c.targetN} (كوكران، ثقة 95%، هامش ±5%)
**المجتمع:** طلاب الجامعة / مهنيون موثقون
**جمع البيانات:** استبيان إلكتروني ذاتي عبر لوحة إيزي سرفاي الموثقة
**ضوابط الجودة:** اختبارات الانتباه، كشف السرعة، فحص التكرار والروبوتات
**حماية البيانات:** متوافق مع نظام حماية البيانات؛ تقارير تجميعية فقط
**مستوى الخطر:** خطر ضئيل`;
  }
  return `# IRB Submission Summary

**Title:** ${c.title}
**Design:** Cross-sectional survey, **${c.method}** sampling
**Target sample size:** ${c.targetN} (Cochran, 95% confidence, ±5% margin)
**Population:** University students / verified professionals
**Data collection:** Self-administered electronic questionnaire via the Easy Survey verified panel
**Quality controls:** Attention checks, speeding detection, duplicate/bot screening
**Data protection:** PDPL-compliant; aggregate reporting only
**Risk level:** Minimal risk`;
}

export function pdplNotice(_c: DocCtx, lang: "en" | "ar"): string {
  if (lang === "ar") {
    return `# إشعار معالجة البيانات (نظام حماية البيانات الشخصية)

وفقًا لـ **نظام حماية البيانات الشخصية** السعودي:

- **المتحكم:** جامعة الملك سعود، مكتب البحث
- **الغرض:** البحث الأكاديمي؛ الأساس النظامي هو الموافقة المستنيرة.
- **البيانات المجمَّعة:** ردود الاستبيان وسمات اللوحة غير التعريفية.
- **الاحتفاظ:** يُحتفظ بالبيانات فقط طوال مدة الدراسة والتحليل.
- **الحقوق:** يمكن للمشاركين طلب الوصول إلى بياناتهم أو تصحيحها أو حذفها.
- **النقل عبر الحدود:** لا يوجد. تُعالَج البيانات وتُخزَّن محليًا.`;
  }
  return `# PDPL Data-Processing Notice

In accordance with the Saudi **Personal Data Protection Law (PDPL)**:

- **Controller:** King Saud University, Research Office
- **Purpose:** Academic research; lawful basis is informed consent.
- **Data collected:** Questionnaire responses and non-identifying panel attributes.
- **Retention:** Data retained only for the duration of the study and analysis.
- **Rights:** Participants may request access, correction, or deletion of their data.
- **Cross-border transfer:** None. Data is processed and stored locally.`;
}

export function generateAllDocs(c: DocCtx, lang: "en" | "ar") {
  return {
    consentDocMarkdown: consentDoc(c, lang),
    infoSheetMarkdown: infoSheet(c, lang),
    irbSummaryMarkdown: irbSummary(c, lang),
    pdplNoticeMarkdown: pdplNotice(c, lang),
  };
}
