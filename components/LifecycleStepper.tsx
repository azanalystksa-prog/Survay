import { t, type Lang } from "@/lib/strings";
import { Icon } from "./Icon";

type Stage = "design" | "collect" | "analyze";

const STAGES: { key: Stage; icon: string }[] = [
  { key: "design", icon: "PenLine" },
  { key: "collect", icon: "Inbox" },
  { key: "analyze", icon: "BarChart3" },
];

export function LifecycleStepper({ active, lang }: { active: Stage; lang: Lang }) {
  const activeIdx = STAGES.findIndex((s) => s.key === active);
  return (
    <div className="flex items-center gap-2 rounded-card border border-line bg-card p-2 shadow-soft">
      {STAGES.map((s, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div
              className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 ${
                isActive ? "bg-primary text-white" : isDone ? "bg-soft text-primary" : "text-muted"
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
                <Icon name={s.icon} size={15} />
              </span>
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider opacity-70">{`Stage ${i + 1}`}</div>
                <div className="text-sm font-semibold">{t(s.key, lang)}</div>
              </div>
            </div>
            {i < STAGES.length - 1 ? <Icon name="ChevronRight" size={16} className="mx-1 text-line flip-x" /> : null}
          </div>
        );
      })}
    </div>
  );
}
