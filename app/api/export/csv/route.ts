import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Real CSV download: one row per valid response, one column per question.
export async function GET(req: NextRequest) {
  const studyId = req.nextUrl.searchParams.get("study");
  if (!studyId) return new NextResponse("Missing study", { status: 400 });

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
  });
  if (!study) return new NextResponse("Study not found", { status: 404 });

  const responses = await prisma.response.findMany({
    where: { studyId, included: true, qualityStatus: "VALID" },
    include: { answers: true },
    orderBy: { completedAt: "asc" },
  });

  const headers = ["response_id", "completed_at", "duration_sec", ...study.questions.map((q) => `Q${q.order}`)];
  const rows = [headers.join(",")];

  function esc(v: string): string {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  for (const r of responses) {
    const cells = [r.id, r.completedAt?.toISOString() ?? "", String(r.durationSec)];
    for (const q of study.questions) {
      const a = r.answers.find((x) => x.questionId === q.id);
      let val = "";
      if (a) {
        if (a.valueNumber != null) val = String(a.valueNumber);
        else if (a.optionId) val = q.options.find((o) => o.id === a.optionId)?.label ?? a.valueText ?? "";
        else if (a.valueText) val = a.valueText;
      }
      cells.push(esc(val));
    }
    rows.push(cells.join(","));
  }

  const csv = rows.join("\n");
  const slug = study.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-responses.csv"`,
    },
  });
}
