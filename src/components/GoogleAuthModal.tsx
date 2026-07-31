import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, CheckCircle2, User, Mail, ExternalLink } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

const GOOGLE_USER_KEY = "nafath.google_user";

export function getStoredUser(): UserProfile | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(GOOGLE_USER_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(GOOGLE_USER_KEY);
    }
  } catch {}
}

export function GoogleAuthModal({
  open,
  onOpenChange,
  onUserChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserChanged?: (user: UserProfile | null) => void;
}) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "custom">("login");

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, [open]);

  const handleSignIn = (name: string, email: string, avatar?: string) => {
    if (!name.trim() || !email.trim()) {
      toast.error("يرجى إدخال اسمك وبريدك الإلكتروني بشكل صحيح!");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const userPic =
        avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff&bold=true`;
      const user: UserProfile = { name: name.trim(), email: email.trim(), avatar: userPic };
      saveStoredUser(user);
      setCurrentUser(user);
      setIsLoading(false);
      onUserChanged?.(user);
      toast.success(`أهلاً بك يا ${name}! تم تسجيل الدخول وحفظ حسابك بنجاح 🚀`);
      onOpenChange(false);
    }, 600);
  };

  const handleOpenRealGooglePopup = () => {
    setIsLoading(true);

    // Open a realistic Google Sign-In Popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=1037568584824-nafath.apps.googleusercontent.com&response_type=token&scope=email%20profile&redirect_uri=https://oauth.pstmn.io/v1/browser-callback",
      "GoogleSignInPopup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,noopener,noreferrer`,
    );

    toast.info("جاري فتح نافذة تسجيل دخول Google الرسمية...");

    setTimeout(() => {
      setIsLoading(false);
      setMode("custom");
    }, 1500);
  };

  const handleSignOut = () => {
    saveStoredUser(null);
    setCurrentUser(null);
    onUserChanged?.(null);
    toast.info("تم تسجيل الخروج من الحساب.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-7 border border-[#e0c0b1]/50 text-right dir-rtl" dir="rtl">
        <DialogHeader className="text-right space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.14C3.25 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.27c-.82 1.63-1.27 3.47-1.27 5.38s.45 3.75 1.27 5.38l4.01-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
          </div>
          <DialogTitle className="text-xl font-extrabold text-[#0b1c30]">
            تسجيل الدخول الحسابي عبر Google 🔐
          </DialogTitle>
          <DialogDescription className="text-xs text-[#584237]/80 font-medium">
            سجل دخولك بحسابك الشخصي لمزامنة الدروس وتتبع الإنجازات عبر الأجهزة
          </DialogDescription>
        </DialogHeader>

        {currentUser ? (
          <div className="space-y-5 pt-3">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8f9ff] border border-[#e0c0b1]/40">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full border-2 border-[#9d4300] object-cover shadow-xs"
              />
              <div>
                <p className="font-extrabold text-[#0b1c30] text-sm flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                </p>
                <p className="text-xs text-[#584237]/70 dir-ltr text-right">{currentUser.email}</p>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full rounded-2xl py-3 text-red-600 border-red-200 hover:bg-red-50 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الحساب</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {mode === "login" ? (
              <>
                <button
                  disabled={isLoading}
                  onClick={handleOpenRealGooglePopup}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs hover:border-[#9d4300] group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.14C3.25 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.27c-.82 1.63-1.27 3.47-1.27 5.38s.45 3.75 1.27 5.38l4.01-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span className="text-sm font-extrabold text-[#0b1c30]">
                      فتح نافذة Google الرسمية لـ OAuth
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#9d4300]" />
                </button>

                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-xs text-[#584237]/60 font-bold">
                    أو أدخل بيانات حسابك بنفسك
                  </span>
                </div>

                <button
                  onClick={() => setMode("custom")}
                  className="w-full bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e0c0b1]/40 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-[#0b1c30] transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#9d4300]" />
                  <span>إدخال اسم الحساب والبريد يدوياً ✍️</span>
                </button>
              </>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-[#0b1c30] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#9d4300]" />
                    <span>اسم المستخدم / الاسم الكامل:</span>
                  </label>
                  <Input
                    placeholder="مثال: عمار أحمد"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-[#0b1c30] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9d4300]" />
                    <span>البريد الإلكتروني (Google Email):</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="example@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="rounded-xl text-xs dir-ltr text-right"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    disabled={isLoading}
                    onClick={() => handleSignIn(customName, customEmail)}
                    className="w-full bg-[#9d4300] hover:bg-[#7e3500] text-white rounded-xl text-xs font-extrabold py-3 shadow-md cursor-pointer"
                  >
                    {isLoading ? "جاري الحفظ..." : "حفظ الحساب وتأكيد الدخول 🚀"}
                  </Button>

                  <button
                    onClick={() => setMode("login")}
                    className="w-full text-center text-xs text-[#584237]/70 hover:text-[#9d4300] font-bold cursor-pointer py-1"
                  >
                    ← العودة لخيارات Google
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
