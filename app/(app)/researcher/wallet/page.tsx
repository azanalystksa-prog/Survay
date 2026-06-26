import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { Card, CardHeader, PageHeader, StatTile, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const lang = getLang();
  const researcher = await prisma.user.findFirst({ where: { role: "RESEARCHER" } });
  const studies = await prisma.study.findMany({ where: { researcherId: researcher?.id }, orderBy: { createdAt: "desc" } });

  // Spend model: charge only for valid (included) responses across studies.
  const PRICE: Record<string, number> = { STANDARD: 6, TARGETED: 14, PREMIUM: 22 };
  const rows = [];
  let totalSpend = 0;
  for (const s of studies) {
    const valid = await prisma.response.count({ where: { studyId: s.id, included: true, qualityStatus: "VALID" } });
    const unit = PRICE[s.pricingTier] ?? 6;
    const spend = valid * unit;
    totalSpend += spend;
    rows.push({ s, valid, unit, spend });
  }
  const budget = 40000;
  const balance = budget - totalSpend;

  return (
    <div>
      <PageHeader title={t("wallet", lang)} subtitle={lang === "ar" ? "تُحتسب التكلفة على الردود الصالحة فقط" : "You are charged only for valid responses"} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("walletBalance", lang)} value={`${balance.toLocaleString()}`} hint="SAR" tone="gold" icon={<Icon name="Wallet" />} />
        <StatTile label={lang === "ar" ? "الميزانية" : "Budget"} value={`${budget.toLocaleString()}`} hint="SAR" icon={<Icon name="PiggyBank" />} />
        <StatTile label={lang === "ar" ? "إجمالي الإنفاق" : "Total spent"} value={`${totalSpend.toLocaleString()}`} hint="SAR" tone="green" icon={<Icon name="Receipt" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title={lang === "ar" ? "الإنفاق حسب الدراسة" : "Spend by study"} />
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "الدراسة" : "Study"}</th>
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "الفئة" : "Tier"}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("validResponses", lang)}</th>
                <th className="px-3 py-2 text-end font-semibold">{lang === "ar" ? "سعر الوحدة" : "Unit (SAR)"}</th>
                <th className="px-3 py-2 text-end font-semibold">{lang === "ar" ? "الإجمالي" : "Total (SAR)"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, valid, unit, spend }) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-3 py-3 font-semibold text-ink">{s.title}</td>
                  <td className="px-3 py-3"><Badge label={s.pricingTier} tone="bg-soft text-primary" /></td>
                  <td className="px-3 py-3 text-end font-mono tabular">{valid}</td>
                  <td className="px-3 py-3 text-end font-mono tabular text-muted">{unit}</td>
                  <td className="px-3 py-3 text-end font-mono tabular font-semibold">{spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Icon name="Info" size={13} className="text-primary" />
        {lang === "ar" ? "الردود المستبعدة (سريعة/روبوت/مكررة) لا تُحتسب." : "Excluded responses (speeders/bots/duplicates) are never charged."}
      </p>
    </div>
  );
}
