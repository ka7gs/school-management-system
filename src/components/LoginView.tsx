import React, { useState } from "react";
import {
  MINISTRY_LOGO_URL,
  UserAccount,
  UserRole,
} from "../data/mockData";

export type { UserRole };

interface LoginViewProps {
  onLoginSuccess: (
    userInfo: {
      role: UserRole;
      roleTitle: string;
      directorate: string;
      schoolName: string;
      username: string;
      fullName: string;
      teacherSubject?: string;
    },
    rememberMe: boolean
  ) => void;
  accounts?: UserAccount[];
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  accounts = [],
}) => {
  // Pure and secure: start empty, no prefilled test data
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [status, setStatus] = useState<{
    type: "idle" | "error" | "verifying" | "success" | "info";
    message: string;
  }>({ type: "idle", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setStatus({
        type: "error",
        message: "يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة.",
      });
      return;
    }

    setStatus({
      type: "verifying",
      message: "جاري التحقق من بيانات الدخول والاعتماد الإداري...",
    });

    setTimeout(() => {
      // Find matching user account strictly by username or email
      const matched = accounts.find(
        (a) =>
          a.username.trim().toLowerCase() === cleanId ||
          a.email.trim().toLowerCase() === cleanId
      );

      if (!matched) {
        setStatus({
          type: "error",
          message:
            "اسم المستخدم غير مسجل في النظام. تأكد من صحة البيانات أو راجع إدارة المدرسة.",
        });
        return;
      }

      // Strict password match: NO test backdoors allowed
      if (matched.password !== cleanPass) {
        setStatus({
          type: "error",
          message: "كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.",
        });
        return;
      }

      // Check if account is active
      if (!matched.isActive) {
        setStatus({
          type: "error",
          message:
            "هذا الحساب معطل حالياً من قبل إدارة المدرسة. يرجى مراجعة إدارة النظام لتفعيل الحساب.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: `تم توثيق الدخول بنجاح! مرحباً بك أ. ${matched.fullName} (${matched.roleTitle}). يتم نقلك الآن للنظام...`,
      });

      setTimeout(() => {
        onLoginSuccess(
          {
            role: matched.role,
            roleTitle: matched.roleTitle,
            directorate: matched.directorate || "بغداد / الكرخ الأولى",
            schoolName: matched.schoolName || "ثانوية المتميزين للبنين",
            username: matched.username,
            fullName: matched.fullName,
            teacherSubject: matched.teacherSubject,
          },
          rememberMe
        );
      }, 500);
    }, 450);
  };

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen flex items-center justify-center p-gutter">
      <main className="w-full max-w-lg mx-auto">
        <div className="flex flex-col w-full">
          <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-space-md sm:p-space-xl overflow-hidden relative border border-surface-container-high/60">
            {/* Top decorative stripe */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-primary via-primary-container to-secondary"></div>

            {/* Official Ministry Header */}
            <header className="flex flex-col items-center text-center space-y-space-sm mb-space-lg">
              <div className="relative flex items-center justify-center p-2 rounded-xl bg-surface-container-low shadow-sm">
                <img
                  alt="شعار وزارة التربية العراقية ونظام الإدارة المدرسية الموحد"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                  src={MINISTRY_LOGO_URL}
                />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span>جمهورية العراق</span>
                  <span>•</span>
                  <span>وزارة التربية</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary font-bold">
                  بوابة تسجيل الدخول المركزية
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
                  المنصة الإلكترونية الموحدة لإدارة المدارس العراقية
                </p>
              </div>
              <div className="w-full flex items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  العام الدراسي 2024 - 2025
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  الخادم الوطني الآمن v4.2
                </span>
              </div>
            </header>

            {/* Restricted Login Form: Username/Email and Password ONLY */}
            <form className="space-y-space-md" onSubmit={handleSubmit}>
              {/* Field 1: Username or Email */}
              <div>
                <label
                  className="block font-label-md text-label-md text-on-surface mb-1.5 text-right font-bold"
                  htmlFor="identifier"
                >
                  اسم المستخدم أو البريد الإلكتروني <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    dir="ltr"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. principal"
                    required
                    autoComplete="username"
                    className="w-full h-11 bg-surface-container-lowest border border-surface-container-high text-on-surface rounded-lg px-3 pl-10 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-colors text-left placeholder:text-outline"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    person
                  </span>
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block font-label-md text-label-md text-on-surface text-right font-bold"
                    htmlFor="password"
                  >
                    كلمة المرور في النظام <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setStatus({
                        type: "info",
                        message:
                          "في حال نسيان كلمة المرور، يرجى مراجعة إدارة المدرسة لإعادة تعيينها من قسم إدارة الحسابات.",
                      })
                    }
                    className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    dir="ltr"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 bg-surface-container-lowest border border-surface-container-high text-on-surface rounded-lg px-3 pl-10 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-colors text-left tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me & Security indicator */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface">
                    تذكر بيانات تسجيل الدخول
                  </span>
                </label>
                <div className="inline-flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    verified_user
                  </span>
                  <span>اتصال مشفر 256-bit</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="submitBtn"
                  type="submit"
                  disabled={status.type === "verifying"}
                  className="w-full h-11 bg-primary text-on-primary hover:bg-primary-container active:scale-[0.99] transition-all rounded-lg font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-80"
                >
                  {status.type === "verifying" ? (
                    <>
                      <span className="inline-block animate-spin material-symbols-outlined text-[20px]">
                        sync
                      </span>
                      <span>جاري التحقق من الاعتماد الوزاري...</span>
                    </>
                  ) : status.type === "success" ? (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>تم التحقق بنجاح - جاري الدخول</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">lock_open</span>
                      <span>تسجيل الدخول إلى النظام الموحد</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Alert Banner */}
              {status.type !== "idle" && (
                <div
                  className={`p-3 rounded-lg font-body-sm text-body-sm text-center leading-relaxed ${
                    status.type === "error"
                      ? "bg-error-container text-on-error-container font-medium border border-error/30"
                      : status.type === "info"
                      ? "bg-surface-container-high text-primary border border-surface-container-highest"
                      : "bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] font-medium"
                  }`}
                >
                  {status.message}
                </div>
              )}
            </form>

            {/* Official Security Footer */}
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high space-y-2 text-[11px] text-on-surface-variant">
              <div className="p-2.5 rounded-lg bg-surface-container text-right flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                  security
                </span>
                <p className="leading-relaxed">
                  نظام محمي ومخصص لإدارة المدرسة والكادر المعتمد فقط. يتم الدخول حصراً بالاسم وكلمة المرور الخاصة بكل مستخدم وفق الصلاحيات المعينة له.
                </p>
              </div>
              <div className="flex items-center justify-between px-1">
                <span>المنظومة المركزية - وزارة التربية العراقية</span>
                <span className="font-mono">IQ-MOEDU-SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
