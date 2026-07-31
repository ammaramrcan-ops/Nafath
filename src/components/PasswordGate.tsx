import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const AUTH_KEY = "nafath.auth";

export function PasswordGate({ children }: { readonly children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored === "true") setAuthed(true);
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = import.meta.env.VITE_APP_PASSWORD || "nafath";
    if (password === correct) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (loading) return null;
  if (authed) return <>{children}</>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#e0c0b1]/40 shadow-sm p-8 text-center">
        {/* Lock Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#9d4300]/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-[#9d4300]" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#0b1c30] mb-2">نفاذ</h1>
        <p className="text-sm text-[#584237]/70 mb-6 font-medium">
          هذا الموقع خاص بالمالك فقط. الرجاء إدخال كلمة المرور للمتابعة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="كلمة المرور"
              autoFocus
              className={`w-full h-12 px-4 rounded-xl border bg-[#f8f9ff] text-[#0b1c30] text-sm font-bold outline-none transition ${
                error ? "border-red-400" : "border-[#e0c0b1]/40 focus:border-[#9d4300]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#584237]/50 hover:text-[#9d4300] transition cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold">
              ⚠️ كلمة المرور غير صحيحة. حاول مرة أخرى.
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-[#9d4300] text-white rounded-xl text-sm font-bold hover:bg-[#833800] transition cursor-pointer shadow-sm"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
