import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Generates an SPSS/R-style codebook (.txt) describing each variable.
export async function GET(req: NextRequest) {
  const studyId = req.nextUrl.searchParams.get("study");
  if (!studyId) return new NextResponse("Missing study", { status: 400 });

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { questions: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });
  if (!study) return new NextResponse("Study not found", { status: 404 });

  const validCount = await prisma.response.count({ where: { studyId, included: true, qualityStatus: "VALID" } });

  const lines: string[] = [];
  lines.push("=".repeat(64));
  lines.push(`CODEBOOK — ${study.title}`);
  lines.push("=".repeat(64));
  lines.push(`Sampling method : ${study.samplingMethod}`);
  lines.push(`Target N        : ${study.targetN}`);
  lines.push(`Valid responses : ${validCount}`);
  lines.push(`Generated       : ${new Date().toISOString()}`);
  lines.push("");

  const typeMap: Record<string, string> = {
    SINGLE: "Nominal (single choice)",
    MULTI: "Nominal (multiple choice)",
    LIKERT: "Ordinal (Likert scale)",
    SHORT_TEXT: "String (open text)",
    NUMBER: "Scale (numeric)",
  };

  for (const q of study.questions) {
    lines.push("-".repeat(64));
    lines.push(`VARIABLE : Q${q.order}`);
    lines.push(`LABEL    : ${q.text}`);
    lines.push(`TYPE     : ${typeMap[q.type] ?? q.type}`);
    lines.push(`REQUIRED : ${q.required ? "Yes" : "No"}`);
    if (q.type === "LIKERT") {
      lines.push(`SCALE    : ${q.scaleMin} (Strongly disagree) .. ${q.scaleMax} (Strongly agree)`);
    }
    if (q.options.length > 0) {
      lines.push("VALUES   :");
      q.options.forEach((o, i) => lines.push(`           ${i + 1} = ${o.label}`));
    }
    lines.push("");
  }

  lines.push("=".repeat(64));
  lines.push("R import example:");
  lines.push(`  df <- read.csv("responses.csv")`);
  lines.push(`  # Likert items are coded 1..5; treat as ordered factors as needed.`);
  lines.push("SPSS note: set measurement levels per TYPE above.");

  const txt = lines.join("\n");
  const slug = study.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new NextResponse(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-codebook.txt"`,
    },
  });
}
