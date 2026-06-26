import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { Card, CardHeader, PageHeader, Badge, StatTile } from "@/components/ui";
import { RequestSpecialty } from "@/components/RequestSpecialty";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const lang = getLang();
  const entries = await prisma.registryEntry.findMany({ orderBy: [{ status: "asc" }, { count: "desc" }] });
  const totalAvailable = entries.reduce((a, e) => a + e.count, 0);
  const instant = entries.filter((e) => e.status === "INSTANT").length;

  return (
    <div>
      <PageHeader
        title={t("specialtyRegistry", lang)}
        subtitle={lang === "ar" ? "استراتيجية التوريد: فوري مقابل عند الطلب" : "Supply strategy: instant vs source-on-request"}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={lang === "ar" ? "مشاركون متاحون" : "Available panelists"} value={totalAvailable.toLocaleString()} tone="green" icon={<Icon name="Users" />} />
        <StatTile label={lang === "ar" ? "تخصصات فورية" : "Instant specialties"} value={instant} tone="gold" icon={<Icon name="Zap" />} />
        <StatTile label={lang === "ar" ? "إجمالي التخصصات" : "Total specialties"} value={entries.length} icon={<Icon name="BookUser" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title={lang === "ar" ? "سجل التخصصات" : "Specialty registry"} />
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "التخصص" : "Specialty"}</th>
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "المدينة" : "City"}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("availableCount", lang)}</th>
                <th className="px-3 py-2 text-start font-semibold">{t("status", lang)}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("avgFulfil", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-3 py-3 font-semibold text-ink">{e.specialty}</td>
                  <td className="px-3 py-3 text-muted">{e.city}</td>
                  <td className="px-3 py-3 text-end font-mono tabular">{e.count}</td>
                  <td className="px-3 py-3">
                    <Badge label={e.status === "INSTANT" ? (lang === "ar" ? "فوري" : "Instant") : (lang === "ar" ? "عند الطلب" : "On request")} kind={e.status} />
                  </td>
                  <td className="px-3 py-3 text-end font-mono tabular text-muted">{e.status === "INSTANT" ? "—" : e.avgFulfilDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6">
        <h3 className="mb-2 font-heading text-base font-bold">{t("requestSpecialty", lang)}</h3>
        <RequestSpecialty lang={lang} />
      </div>
    </div>
  );
}
