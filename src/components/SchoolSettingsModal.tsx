import React, { useState } from "react";
import {
  DEFAULT_SCHOOL_CONFIG,
  MINISTRY_LOGO_URL,
  PRESET_SCHOOL_LOGOS,
  SchoolConfig,
} from "../data/mockData";

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onSave: (updatedConfig: SchoolConfig) => void;
  onNotify: (msg: string) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onNotify,
}) => {
  const [formData, setFormData] = useState<SchoolConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<"general" | "logos" | "personnel" | "preview">("general");

  if (!isOpen) return null;

  const handleInputChange = (field: keyof SchoolConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "schoolLogoUrl" | "ministryLogoUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onNotify("حجم ملف الشعار كبير جداً (الحد الأقصى 2 ميغابايت)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleInputChange(field, event.target.result as string);
          onNotify("تم تحميل الشعار بنجاح");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName.trim()) {
      onNotify("يرجى إدخال اسم المدرسة بشكل صحيح");
      return;
    }
    onSave(formData);
    onNotify("تم حفظ إعدادات المدرسة والتفاصيل الأساسية وتطبيقها على كامل النظام");
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm("هل أنت متأكد من استعادة الإعدادات والشعارات الافتراضية للنظام؟")) {
      setFormData({ ...DEFAULT_SCHOOL_CONFIG });
      onNotify("تمت استعادة الإعدادات الافتراضية");
    }
  };

  const quickDirectorates = [
    "المديرية العامة لتربية بغداد / الكرخ الأولى",
    "المديرية العامة لتربية بغداد / الكرخ الثانية",
    "المديرية العامة لتربية بغداد / الرصافة الأولى",
    "المديرية العامة لتربية بغداد / الرصافة الثانية",
    "المديرية العامة لتربية البصرة",
    "المديرية العامة لتربية نينوى",
    "المديرية العامة لتربية النجف الأشرف",
    "المديرية العامة لتربية كربلاء المقدسة",
    "المديرية العامة لتربية أربيل",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in no-print">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-primary text-on-primary flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-white leading-tight">
                لوحة تحكم إعدادات المدرسة والنظام الأساسية
              </h2>
              <p className="text-white/80 text-xs">
                تعديل اسم المدرسة، الشعار، المديرية، شعار الوزارة، والعام الدراسي في كافة مفاصل التطبيق
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-container px-6 bg-surface-container-low/50 overflow-x-auto text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "general"
                ? "border-primary text-primary bg-surface-container-lowest"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>البيانات الأساسية للمدرسة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logos")}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "logos"
                ? "border-primary text-primary bg-surface-container-lowest"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">imagesmode</span>
            <span>شعارات المدرسة والوزارة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("personnel")}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "personnel"
                ? "border-primary text-primary bg-surface-container-lowest"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_check</span>
            <span>الإدارة واللجان الرسمية</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "preview"
                ? "border-primary text-primary bg-surface-container-lowest"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>معاينة الترويسة الرسمية المباشرة</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    <span>اسم المدرسة الرسمي *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => handleInputChange("schoolName", e.target.value)}
                    placeholder="مثال: ثانوية المتميزين للبنين"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface font-semibold text-sm transition-all"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    يظهر هذا الاسم في أعلى النظام، والبطاقات والشهادات، وقوائم الدرجات، والتقارير الوزارية.
                  </span>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    <span>المديرية العامة للتربية *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.directorate}
                    onChange={(e) => handleInputChange("directorate", e.target.value)}
                    placeholder="مثال: المديرية العامة لتربية بغداد / الكرخ الأولى"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface font-medium text-sm transition-all"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-secondary font-bold self-center">خيارات سريعة:</span>
                    {quickDirectorates.slice(0, 4).map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleInputChange("directorate", d)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container-high hover:bg-primary-container hover:text-on-primary transition-colors cursor-pointer"
                      >
                        {d.replace("المديرية العامة لتربية ", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">
                    المحافظة
                  </label>
                  <input
                    type="text"
                    value={formData.governorate}
                    onChange={(e) => handleInputChange("governorate", e.target.value)}
                    placeholder="مثال: بغداد"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">
                    العام الدراسي المعتمد
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange("academicYear", e.target.value)}
                    placeholder="مثال: 2024 - 2025"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface font-mono font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">
                    الرمز الإحصائي للمدرسة (الكود الوزاري)
                  </label>
                  <input
                    type="text"
                    value={formData.schoolCode}
                    onChange={(e) => handleInputChange("schoolCode", e.target.value)}
                    placeholder="مثال: IQ-EDU-10492"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">
                    رقم الهاتف الرسمي للمدرسة
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="مثال: +964 770 123 4567"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface">
                    عنوان المدرسة الفعلي
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="مثال: بغداد - الكرخ - حي الجامعة - قرب ساحة اللقاء"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:bg-surface-container-lowest outline-none text-on-surface text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Logos */}
          {activeTab === "logos" && (
            <div className="space-y-6 animate-fade-in">
              {/* School Logo Section */}
              <div className="p-4 rounded-xl border border-surface-container bg-surface-container-low/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">verified</span>
                    <div>
                      <h4 className="font-bold text-primary text-sm">شعار المدرسة الرئيسي</h4>
                      <p className="text-xs text-on-surface-variant">
                        يظهر في الزاوية العلوية لجميع السجلات والشهادات والنتائج المطبوعة
                      </p>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-xl border-2 border-primary/20 bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
                    <img
                      src={formData.schoolLogoUrl || DEFAULT_SCHOOL_CONFIG.schoolLogoUrl}
                      alt="معاينة شعار المدرسة"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Upload or input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      رفع شعار من جهازك (PNG / JPG / WebP):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoFileUpload(e, "schoolLogoUrl")}
                      className="block w-full text-xs text-on-surface-variant file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      أو رابط صورة الشعار مباشرة:
                    </label>
                    <input
                      type="text"
                      value={formData.schoolLogoUrl}
                      onChange={(e) => handleInputChange("schoolLogoUrl", e.target.value)}
                      placeholder="https://..."
                      className="w-full h-9 px-3 bg-surface-container-low rounded-lg border border-surface-container-high text-xs font-mono outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Preset Logos */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-on-surface-variant mb-2">
                    نماذج شعارات جاهزة ومقترحة:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_SCHOOL_LOGOS.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleInputChange("schoolLogoUrl", preset.url)}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          formData.schoolLogoUrl === preset.url
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-surface-container hover:border-outline"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-contain rounded-md"
                        />
                        <span className="text-[11px] font-medium leading-tight">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ministry Logo Section */}
              <div className="p-4 rounded-xl border border-surface-container bg-surface-container-low/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                    <div>
                      <h4 className="font-bold text-primary text-sm">شعار وزارة التربية الرسمي</h4>
                      <p className="text-xs text-on-surface-variant">
                        شعار النسر وجمهورية العراق المعتمد في ترويسة الكتب والوثائق الوزارية
                      </p>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-xl border-2 border-primary/20 bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
                    <img
                      src={formData.ministryLogoUrl || MINISTRY_LOGO_URL}
                      alt="شعار وزارة التربية"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      رفع شعار مخصص للوزارة:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoFileUpload(e, "ministryLogoUrl")}
                      className="block w-full text-xs text-on-surface-variant file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      أو رابط الشعار:
                    </label>
                    <input
                      type="text"
                      value={formData.ministryLogoUrl}
                      onChange={(e) => handleInputChange("ministryLogoUrl", e.target.value)}
                      placeholder="https://..."
                      className="w-full h-9 px-3 bg-surface-container-low rounded-lg border border-surface-container-high text-xs font-mono outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInputChange("ministryLogoUrl", MINISTRY_LOGO_URL)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>إعادة تعيين شعار الوزارة الرسمي الافتراضي</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Personnel */}
          {activeTab === "personnel" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-secondary-container/40 rounded-xl text-xs text-on-secondary-container">
                تُستخدم هذه الأسماء تلقائياً في التواقيع الرسمية على وثائق الدرجات والنتائج وقوائم الصفوف.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary">
                    اسم مدير المدرسة الرباعي واللقب
                  </label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => handleInputChange("principalName", e.target.value)}
                    placeholder="مثال: أ.د. حسام عبد الرضا الربيعي"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high text-sm font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary">
                    اسم معاون المدير للشؤون العلمية
                  </label>
                  <input
                    type="text"
                    value={formData.vicePrincipalName}
                    onChange={(e) => handleInputChange("vicePrincipalName", e.target.value)}
                    placeholder="مثال: أ. مازن طارق الكرخي"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high text-sm font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-primary">
                    رئيس اللجنة الامتحانية المركزية
                  </label>
                  <input
                    type="text"
                    value={formData.examCommitteeHead}
                    onChange={(e) => handleInputChange("examCommitteeHead", e.target.value)}
                    placeholder="مثال: أ.د. حسام عبد الرضا"
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-surface-container-high text-sm font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Live Official Preview */}
          {activeTab === "preview" && (
            <div className="space-y-4 animate-fade-in">
              <span className="block text-xs font-bold text-secondary">
                معاينة مباشرة: هكذا تظهر ترويسة الكتب والوثائق والنتائج الرسمية بعد حفظ البيانات:
              </span>

              {/* The Official Letterhead Sheet Mockup */}
              <div className="p-6 bg-white border-2 border-primary/30 rounded-2xl shadow-md text-stone-900 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-4">
                  {/* Right Header */}
                  <div className="text-right flex flex-col items-start gap-1">
                    <span className="font-bold text-xs text-stone-800">جمهورية العراق</span>
                    <span className="font-bold text-xs text-stone-800">وزارة التربية</span>
                    <span className="font-bold text-xs text-primary">{formData.directorate}</span>
                    <span className="font-black text-sm text-stone-900">{formData.schoolName}</span>
                    <span className="text-[10px] text-stone-600 font-mono">الكود: {formData.schoolCode}</span>
                  </div>

                  {/* Center Emblem */}
                  <div className="flex flex-col items-center">
                    <img
                      src={formData.ministryLogoUrl || MINISTRY_LOGO_URL}
                      alt="وزارة التربية"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-[10px] font-bold mt-1 text-stone-700">شعار وزارة التربية</span>
                  </div>

                  {/* Left Header / School Logo */}
                  <div className="text-left flex flex-col items-end gap-1">
                    <img
                      src={formData.schoolLogoUrl || DEFAULT_SCHOOL_CONFIG.schoolLogoUrl}
                      alt="شعار المدرسة"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-contain rounded-lg border border-stone-200 p-0.5 bg-white"
                    />
                    <span className="text-[11px] font-bold text-stone-800">العام الدراسي: {formData.academicYear}</span>
                    <span className="text-[10px] text-stone-500">المحافظة: {formData.governorate}</span>
                  </div>
                </div>

                <div className="text-center py-2 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                  <span className="font-black text-base text-primary block">
                    وثيقة دراسية رسمية معتمدة
                  </span>
                  <span className="text-xs text-stone-600">
                    نموذج لاختبار مطابقة ترويسة المدرسة مع تعليمات التقويم والامتحانات
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs">
                  <div className="text-center">
                    <span className="font-bold text-stone-700 block">منظم السجل</span>
                    <span className="text-stone-500 mt-1 block">........................</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-stone-700 block">رئيس اللجنة الامتحانية</span>
                    <span className="font-semibold text-primary mt-1 block">{formData.examCommitteeHead}</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-stone-700 block">مدير المدرسة</span>
                    <span className="font-bold text-primary mt-1 block">{formData.principalName}</span>
                    <span className="text-[9px] text-stone-400 block">(الختم والتوقيع الرسمي)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-error font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>استعادة الإعدادات الافتراضية</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>حفظ وتطبيق التغييرات بالنظام</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
