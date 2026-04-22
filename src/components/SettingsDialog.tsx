import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Settings dialog — outer shell only.
 * Per current spec: do NOT add any options/features inside yet;
 * future stages will populate this.
 */
export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md gap-0 overflow-hidden rounded-[1.5rem] border-0 bg-zen-surface p-0 shadow-[var(--shadow-deep)]"
      >
        <DialogHeader className="px-7 pt-6 text-right">
          <DialogTitle className="text-[22px] font-semibold tracking-tight text-zen-on-surface">
            الإعدادات
          </DialogTitle>
          <DialogDescription className="text-[13px] text-zen-on-surface-variant">
            مساحة هادئة لتخصيص تجربتك. سيتم إضافة الخيارات قريباً.
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 pb-8 pt-6">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zen-surface-container bg-white/40 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
              <SettingsIcon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-zen-on-surface">لا توجد إعدادات بعد</p>
            <p className="max-w-[260px] text-xs leading-relaxed text-zen-on-surface-variant">
              سيتم تفعيل خيارات تخصيص الدرس والتسلسل والمظهر في تحديث قادم.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Compatibility wrapper — kept so existing trigger buttons keep working. */
export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className={
              className ??
              "inline-flex items-center gap-2 rounded-full border border-zen-surface-container bg-white px-4 py-2 text-sm font-semibold text-zen-on-surface-variant transition hover:border-zen-primary-container hover:text-zen-on-surface"
            }
          >
            <SettingsIcon className="h-4 w-4" />
            الإعدادات
          </button>
        </DialogTrigger>
      </Dialog>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
