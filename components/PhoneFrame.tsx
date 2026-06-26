import type { ReactNode } from "react";

export function PhoneFrame({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="rounded-[2.2rem] border-[10px] border-deep-green bg-deep-green shadow-soft-lg">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-canvas">
          {/* status bar */}
          <div className="flex items-center justify-between bg-deep-green px-5 py-2 text-[11px] font-semibold text-white/80">
            <span>9:41</span>
            <span className="h-4 w-20 rounded-b-xl bg-deep-green" />
            <span className="flex items-center gap-1">
              <span>5G</span>
              <span>100%</span>
            </span>
          </div>
          <div className="max-h-[760px] min-h-[640px] overflow-y-auto scrollbar-thin">
            {title ? (
              <div className="sticky top-0 z-10 border-b border-line bg-card/95 px-5 py-3 backdrop-blur">
                <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
              </div>
            ) : null}
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
