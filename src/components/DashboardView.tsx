import React, { useState } from "react";
import { INITIAL_MOVEMENTS, RecentMovementRecord, SchoolConfig } from "../data/mockData";

interface DashboardViewProps {
  onNavigate: (path: string, openModal?: boolean) => void;
  onNotify: (msg: string) => void;
  totalStudentsCount: number;
  schoolConfig?: SchoolConfig;
  onOpenSettings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onNotify,
  totalStudentsCount,
  schoolConfig,
  onOpenSettings,
}) => {
  const [tasks, setTasks] = useState([
    {
      id: "t1",
      text: "توقيع أمر النقل للطالب علي حيدر إلى مدرسة الموهوبين",
      done: true,
    },
    {
      id: "t2",
      text: "اعتماد جداول المراقبة للامتحانات الشهرية الأولى",
      done: false,
    },
    {
      id: "t3",
      text: "إرسال تقرير الغيابات الموحد إلى شعبة الإشراف التربوي",
      done: false,
    },
  ]);

  const [movementFilter, setMovementFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedMovement, setSelectedMovement] = useState<RecentMovementRecord | null>(null);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const filteredMovements = INITIAL_MOVEMENTS.filter((m) => {
    if (movementFilter === "all") return true;
    return m.statusStyle === movementFilter;
  });

  const handleExportMovements = () => {
    const headers = [
      "رقم القيد الوزاري",
      "اسم الطالب الثلاثي واللقب",
      "الصف والشعبة",
      "تاريخ التسجيل / التعديل",
      "المدرسة السابقة / المنقول إليها",
      "حالة الطالب المعتمدة",
    ];
    const rows = filteredMovements.map((m) => [
      m.ministryId,
      m.name,
      m.gradeSection,
      m.date,
      m.schoolNote,
      m.statusLabel,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "سجل_حركة_الطلبة_الوزاري.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("تم تصدير سجل حركة الطلبة الرسمي بنجاح (Excel / CSV)");
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Welcome & Ministry Status Bar */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">
                account_balance
              </span>
              وزارة التربية العراقية
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-outline">
                calendar_today
              </span>
              الأحد، 15 تشرين الأول 2024 | 11 ربيع الثاني 1446 هـ
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            مرحباً بك، {schoolConfig?.principalName || "أ. حسام عبد الرضا"}{" "}
            <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
              (مدير المدرسة)
            </span>
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {schoolConfig?.schoolName || "ثانوية المتميزين للبنين"} - {schoolConfig?.directorate || "مديرية تربية بغداد / الكرخ الأولى"} • السجل الإداري المركزي المباشر
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="لوحة تحكم إعدادات المدرسة، الشعار، والمديرية"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>تعديل تفاصيل المدرسة والشعار</span>
            </button>
          )}
          <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-space-xs rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                حالة المزامنة الوزارية
              </span>
              <span className="font-label-md text-label-md text-primary font-bold">
                متصل بالخادم المركزي (مباشر)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs bg-primary-container px-space-md py-space-xs rounded-lg">
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
              school
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-primary-container">
                العام الدراسي الحالي
              </span>
              <span className="font-label-md text-label-md text-on-primary font-bold">
                {schoolConfig?.academicYear || "2024 - 2025"} (الفصل الأول)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Institutional KPI Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Metric 1: Total Students */}
        <div
          onClick={() => onNavigate("students")}
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:bg-surface-container-low cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                إجمالي الطلبة المقيدين
              </span>
              <div className="font-headline-xl text-headline-xl text-primary mt-1 font-bold tabular-nums">
                {totalStudentsCount.toLocaleString("en-US")}{" "}
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                  طالب
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">
                groups
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded flex items-center justify-between text-on-surface-variant">
            <span className="font-body-sm text-body-sm">
              علمي: <strong className="text-primary">720</strong>
            </span>
            <span className="text-outline">•</span>
            <span className="font-body-sm text-body-sm">
              أدبي: <strong className="text-primary">528</strong>
            </span>
            <span className="text-outline">•</span>
            <span className="font-label-sm text-label-sm text-secondary font-bold">
              24 شعبة
            </span>
          </div>
        </div>

        {/* Metric 2: Teaching Staff */}
        <div
          onClick={() => onNavigate("staff")}
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:bg-surface-container-low cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                الملاك التدريسي والإداري
              </span>
              <div className="font-headline-xl text-headline-xl text-primary mt-1 font-bold tabular-nums">
                68{" "}
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                  تدريسي وموظف
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">
                badge
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              إشغال الحصص:
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>{" "}
              100% مكتمل
            </span>
          </div>
        </div>

        {/* Metric 3: Today's Absences */}
        <div
          onClick={() => onNavigate("attendance")}
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:bg-surface-container-low cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                غيابات اليوم المعتمدة
              </span>
              <div className="font-headline-xl text-headline-xl text-primary mt-1 font-bold tabular-nums">
                14{" "}
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                  طالب فقط
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">
                verified
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-low px-space-sm py-1.5 rounded flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              نسبة الحضور اليومية:
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] font-bold">
              98.9% (مؤشر ممتاز)
            </span>
          </div>
        </div>

        {/* Metric 4: Tuition & Dues */}
        <div
          onClick={() => onNavigate("finance")}
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:bg-surface-container-low cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                الرسوم والأمانات المستحقة
              </span>
              <div className="font-headline-xl text-headline-xl text-primary mt-1 font-bold tabular-nums">
                4,350,000{" "}
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                  د.ع
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col gap-1">
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>نسبة التحصيل الفصلي</span>
              <span className="font-bold text-primary">82%</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full"
                style={{ width: "82%" }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Quick Actions Toolbar */}
      <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
          <span className="material-symbols-outlined text-secondary text-[22px]">
            flash_on
          </span>
          <span>الإجراءات الإدارية المباشرة:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-row items-center gap-space-sm w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate("attendance")}
            className="flex items-center justify-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              how_to_reg
            </span>
            <span>تسجيل غياب يومي</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("exams-and-grades")}
            className="flex items-center justify-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              fact_check
            </span>
            <span>رصد درجات الامتحان</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("students", true)}
            className="flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            <span>إضافة طالب جديد</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("accounts")}
            className="flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              manage_accounts
            </span>
            <span>حسابات الكادر والصلاحيات</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تجهيز السجل العام بصيغة A4 للطباعة الرسمية");
            }}
            className="flex items-center justify-center gap-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>طباعة السجل العام A4</span>
          </button>
        </div>
      </section>

      {/* Visual Break / Atmosphere Banner */}
      <section className="relative w-full rounded-xl overflow-hidden bg-primary-container text-on-primary p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md shadow-sm">
        <div className="relative z-10 max-w-2xl flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm text-secondary-fixed uppercase font-bold tracking-wider">
            ملاحظة تنظيمية هامة
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-white">
            إغلاق وتدقيق سجل درجات التقويم الأول عبر المنظومة
          </h2>
          <p className="font-body-md text-body-md text-primary-fixed">
            يُرجى من السادة مدرسي المراحل المنتهية (السادس الإعدادي بفرعيه
            العلمي والأدبي) مطابقة وتوقيع السجلات المطبوعة وتسليمها إلى المعاون
            العلمي قبل نهاية دوام يوم الخميس القادم.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-space-sm flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigate("exams-and-grades")}
            title="الانتقال إلى سجل الدرجات"
            className="w-14 h-14 rounded-full bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 backdrop-blur flex items-center justify-center text-secondary-fixed transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px]">
              assignment_turned_in
            </span>
          </button>
        </div>
        {/* Soft Decorative Graphic Glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-secondary/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-primary/40 blur-3xl pointer-events-none"></div>
      </section>

      {/* Two Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Right Side (Major - 8 Columns): Attendance Chart & Circulars */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Weekly Attendance Trend Chart (Inline SVG visualization) */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-xs gap-space-xs">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">
                  مؤشر الحضور الأسبوعي للطلبة حسب المراحل
                </h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  البيانات الإحصائية للأسبوع الدراسي الرابع (تشرين الأول 2024)
                </span>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap text-label-sm font-label-sm">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>{" "}
                  السادس الإعدادي
                </span>
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>{" "}
                  الخامس الإعدادي
                </span>
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-surface-tint"></span>{" "}
                  الرابع الإعدادي
                </span>
              </div>
            </div>
            {/* SVG Line/Area Graph for Weekly Attendance */}
            <div className="w-full bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-sm">
              <div className="w-full overflow-x-auto">
                <svg
                  className="w-full min-w-[500px] h-52 overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 600 200"
                >
                  {/* Grid lines */}
                  <line
                    stroke="#d9e3f4"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                    x1="40"
                    x2="580"
                    y1="20"
                    y2="20"
                  ></line>
                  <line
                    stroke="#d9e3f4"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                    x1="40"
                    x2="580"
                    y1="65"
                    y2="65"
                  ></line>
                  <line
                    stroke="#d9e3f4"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                    x1="40"
                    x2="580"
                    y1="110"
                    y2="110"
                  ></line>
                  <line
                    stroke="#d9e3f4"
                    strokeWidth="1"
                    x1="40"
                    x2="580"
                    y1="155"
                    y2="155"
                  ></line>
                  {/* Y-Axis labels */}
                  <text
                    className="text-[11px] fill-[#43474e] font-Cairo"
                    textAnchor="start"
                    x="595"
                    y="24"
                  >
                    100%
                  </text>
                  <text
                    className="text-[11px] fill-[#43474e] font-Cairo"
                    textAnchor="start"
                    x="595"
                    y="69"
                  >
                    95%
                  </text>
                  <text
                    className="text-[11px] fill-[#43474e] font-Cairo"
                    textAnchor="start"
                    x="595"
                    y="114"
                  >
                    90%
                  </text>
                  <text
                    className="text-[11px] fill-[#43474e] font-Cairo"
                    textAnchor="start"
                    x="595"
                    y="159"
                  >
                    85%
                  </text>
                  {/* Line 1: Grade 6 */}
                  <polyline
                    fill="none"
                    points="80,26 180,32 280,24 380,29 480,22"
                    stroke="#032448"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  ></polyline>
                  <circle cx="80" cy="26" fill="#032448" r="4"></circle>
                  <circle cx="180" cy="32" fill="#032448" r="4"></circle>
                  <circle cx="280" cy="24" fill="#032448" r="4"></circle>
                  <circle cx="380" cy="29" fill="#032448" r="4"></circle>
                  <circle cx="480" cy="22" fill="#032448" r="4"></circle>
                  {/* Line 2: Grade 5 */}
                  <polyline
                    fill="none"
                    points="80,45 180,55 280,36 380,41 480,36"
                    stroke="#026a6a"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></polyline>
                  <circle cx="80" cy="45" fill="#026a6a" r="3.5"></circle>
                  <circle cx="180" cy="55" fill="#026a6a" r="3.5"></circle>
                  <circle cx="280" cy="36" fill="#026a6a" r="3.5"></circle>
                  <circle cx="380" cy="41" fill="#026a6a" r="3.5"></circle>
                  <circle cx="480" cy="36" fill="#026a6a" r="3.5"></circle>
                  {/* Line 3: Grade 4 */}
                  <polyline
                    fill="none"
                    points="80,72 180,64 280,68 380,55 480,60"
                    stroke="#465f86"
                    strokeDasharray="4,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></polyline>
                  <circle cx="80" cy="72" fill="#465f86" r="3"></circle>
                  <circle cx="180" cy="64" fill="#465f86" r="3"></circle>
                  <circle cx="280" cy="68" fill="#465f86" r="3"></circle>
                  <circle cx="380" cy="55" fill="#465f86" r="3"></circle>
                  <circle cx="480" cy="60" fill="#465f86" r="3"></circle>
                  {/* X-Axis Days Labels */}
                  <text
                    className="text-[12px] fill-[#121c28] font-Cairo"
                    textAnchor="middle"
                    x="80"
                    y="180"
                  >
                    الأحد
                  </text>
                  <text
                    className="text-[12px] fill-[#121c28] font-Cairo"
                    textAnchor="middle"
                    x="180"
                    y="180"
                  >
                    الإثنين
                  </text>
                  <text
                    className="text-[12px] fill-[#121c28] font-Cairo"
                    textAnchor="middle"
                    x="280"
                    y="180"
                  >
                    الثلاثاء
                  </text>
                  <text
                    className="text-[12px] fill-[#121c28] font-Cairo"
                    textAnchor="middle"
                    x="380"
                    y="180"
                  >
                    الأربعاء
                  </text>
                  <text
                    className="text-[12px] fill-[#121c28] font-Cairo"
                    textAnchor="middle"
                    x="480"
                    y="180"
                  >
                    الخميس
                  </text>
                </svg>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    trending_up
                  </span>
                  ارتفاع ملحوظ في التزام طلبة السادس العلمي بنسبة التزام تفوق
                  99.4%
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("attendance")}
                  className="text-secondary hover:text-primary font-label-sm font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>تقرير تفصيلي للشعب</span>
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_left
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Ministry Circulars & Official Decrees Table */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  policy
                </span>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">
                  أحدث قرارات وتعاميم وزارة التربية
                </h3>
              </div>
              <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-primary font-semibold">
                وارد المديرية العامة - تشرين الأول 2024
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface-container-high text-primary font-table-header text-table-header">
                    <th className="p-space-md">رقم الكتاب الوزاري</th>
                    <th className="p-space-md">تاريخ الصدور</th>
                    <th className="p-space-md">موضوع الإعمام الرسمي</th>
                    <th className="p-space-md">جهة التوجيه</th>
                    <th className="p-space-md text-center">الإجراء المطلوب</th>
                    <th className="p-space-md text-center">المرفق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-table-data text-table-data">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-space-md font-bold text-primary">
                      ت/ك1/4892
                    </td>
                    <td className="p-space-md text-on-surface-variant tabular-nums">
                      2024/10/12
                    </td>
                    <td className="p-space-md font-semibold text-on-surface">
                      ضوابط إعفاء الطلبة المتميزين في الامتحانات الفصلية
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      إدارة ثانوية المتميزين
                    </td>
                    <td className="p-space-md text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        مُعمم ومُطبق
                      </span>
                    </td>
                    <td className="p-space-md text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onNotify(
                            "تم فتح نسخة PDF الرسمية للكتاب الوزاري (ت/ك1/4892)"
                          )
                        }
                        title="تحميل الإعمام بصيغة PDF"
                        className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          picture_as_pdf
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-space-md font-bold text-primary">
                      م/ع/7731
                    </td>
                    <td className="p-space-md text-on-surface-variant tabular-nums">
                      2024/10/09
                    </td>
                    <td className="p-space-md font-semibold text-on-surface">
                      إطلاق مسابقة أولمبياد الرياضيات والفيزياء الوطنية
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      شعبة رعاية الموهوبين
                    </td>
                    <td className="p-space-md text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#FFF3E0] text-[#B25000]">
                        قيد ترشيح الطلبة
                      </span>
                    </td>
                    <td className="p-space-md text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onNotify(
                            "تم فتح نسخة PDF الرسمية للكتاب الوزاري (م/ع/7731)"
                          )
                        }
                        title="تحميل الإعمام بصيغة PDF"
                        className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          picture_as_pdf
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-space-md font-bold text-primary">
                      إ/ت/2045
                    </td>
                    <td className="p-space-md text-on-surface-variant tabular-nums">
                      2024/10/04
                    </td>
                    <td className="p-space-md font-semibold text-on-surface">
                      تعليمات استلام السجلات المدرسية والبطاقات المدرسية الورقية
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      المعاون الإداري وشؤون الطلبة
                    </td>
                    <td className="p-space-md text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        مكتمل الأرشفة
                      </span>
                    </td>
                    <td className="p-space-md text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onNotify(
                            "تم فتح نسخة PDF الرسمية للكتاب الوزاري (إ/ت/2045)"
                          )
                        }
                        title="تحميل الإعمام بصيغة PDF"
                        className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          picture_as_pdf
                        </span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Left Side (4 Columns): Schedules & Pass Rates */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Upcoming Exam Schedules & Calendar */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                الامتحانات القادمة والتقويم
              </h3>
              <span className="material-symbols-outlined text-outline">
                event_note
              </span>
            </div>
            <div className="flex flex-col gap-space-sm">
              <div
                onClick={() => onNavigate("exams-and-grades")}
                className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-1.5 transition-all hover:bg-surface-container cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    الامتحان الشهري الأول - الرياضيات
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary text-on-primary font-bold">
                    السادس العلمي
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      schedule
                    </span>
                    الأربعاء، 18 تشرين الأول 2024
                  </span>
                  <span className="text-secondary font-semibold">
                    أ. عادل المشهداني
                  </span>
                </div>
              </div>

              <div
                onClick={() => onNavigate("exams-and-grades")}
                className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-1.5 transition-all hover:bg-surface-container cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    الامتحان الشهري الأول - الكيمياء
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary text-on-primary font-bold">
                    الخامس العلمي
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      schedule
                    </span>
                    الأحد، 22 تشرين الأول 2024
                  </span>
                  <span className="text-secondary font-semibold">
                    د. قتيبة الجميلي
                  </span>
                </div>
              </div>

              <div
                onClick={() => onNavigate("exams-and-grades")}
                className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-1.5 transition-all hover:bg-surface-container cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    الامتحان الشهري الأول - اللغة العربية
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold">
                    الرابع العام
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      schedule
                    </span>
                    الثلاثاء، 24 تشرين الأول 2024
                  </span>
                  <span className="text-secondary font-semibold">
                    أ. سرمد الربيعي
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("exams-and-grades")}
              className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span>عرض جدول الامتحانات المعتمد كاملاً</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
            </button>
          </section>

          {/* Pass Rate Estimates (Subject Analysis) */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                نسب النجاح والتقييم الفصلي
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                العام المنصرم ومؤشر الحالي
              </span>
            </div>
            <div className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="font-bold text-primary">
                    الرياضيات المتقدمة
                  </span>
                  <span className="text-secondary font-bold tabular-nums">
                    96.4%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "96.4%" }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="font-bold text-primary">
                    اللغة الإنكليزية التخصصية
                  </span>
                  <span className="text-secondary font-bold tabular-nums">
                    98.2%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{ width: "98.2%" }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="font-bold text-primary">
                    الفيزياء التطبيقية
                  </span>
                  <span className="text-secondary font-bold tabular-nums">
                    94.8%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "94.8%" }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="font-bold text-primary">
                    اللغة العربية وقواعدها
                  </span>
                  <span className="text-secondary font-bold tabular-nums">
                    95.0%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full"
                    style={{ width: "95%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                military_tech
              </span>
              <span>
                المدرسة حائزة على المرتبة الأولى في نتائج الامتحانات الوزارية
                لتربية الكرخ الأولى.
              </span>
            </div>
          </section>

          {/* Headmaster Direct Audit Note */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">
                checklist_rtl
              </span>
              <span className="font-label-md text-label-md font-bold">
                المهام الإدارية العاجلة اليوم
              </span>
            </div>
            <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2">
                  <input
                    id={task.id}
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 w-4 h-4 text-primary rounded bg-surface-container border-outline cursor-pointer accent-primary"
                  />
                  <label
                    htmlFor={task.id}
                    className={`cursor-pointer select-none ${
                      task.done ? "line-through text-outline" : ""
                    }`}
                  >
                    {task.text}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Bottom Section: Recent Students Registry & Statuses */}
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-xs gap-space-xs">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">
              سجل حركة الطلبة: آخر المسجلين والمنقولين
            </h3>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              تحديثات السجل المركزي الموثق برقم القيد والباركود الوزاري
            </span>
          </div>
          <div className="flex items-center gap-space-xs flex-wrap">
            <button
              type="button"
              onClick={() =>
                setMovementFilter((prev) =>
                  prev === "all"
                    ? "active"
                    : prev === "active"
                    ? "transferred"
                    : prev === "transferred"
                    ? "carryover"
                    : "all"
                )
              }
              className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high rounded text-primary font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>
              <span>
                {movementFilter === "all"
                  ? "تصفية السجل"
                  : movementFilter === "active"
                  ? "الطلبة النشطون"
                  : movementFilter === "transferred"
                  ? "الطلبة المنقولون"
                  : "الطلبة المكملون"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportMovements}
              className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              <span>تصدير السجل الرسمي Excel</span>
            </button>
          </div>
        </div>

        {/* Tabular Data for Students */}
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-high text-primary font-table-header text-table-header">
                <th className="p-space-md">رقم القيد الوزاري</th>
                <th className="p-space-md">اسم الطالب الثلاثي واللقب</th>
                <th className="p-space-md">الصف والشعبة</th>
                <th className="p-space-md">تاريخ التسجيل / التعديل</th>
                <th className="p-space-md">المدرسة السابقة / المنقول إليها</th>
                <th className="p-space-md text-center">حالة الطالب المعتمدة</th>
                <th className="p-space-md text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-table-data text-table-data">
              {filteredMovements.map((student) => (
                <tr
                  key={student.ministryId}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="p-space-md font-bold text-primary tabular-nums">
                    {student.ministryId}
                  </td>
                  <td className="p-space-md font-semibold text-on-surface">
                    {student.name}
                  </td>
                  <td className="p-space-md text-on-surface-variant">
                    {student.gradeSection}
                  </td>
                  <td className="p-space-md text-on-surface-variant tabular-nums">
                    {student.date}
                  </td>
                  <td className="p-space-md text-on-surface-variant">
                    {student.schoolNote}
                  </td>
                  <td className="p-space-md text-center">
                    {student.statusStyle === "active" && (
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        {student.statusLabel}
                      </span>
                    )}
                    {student.statusStyle === "transferred" && (
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#E1F5FE] text-[#0277BD]">
                        {student.statusLabel}
                      </span>
                    )}
                    {student.statusStyle === "carryover" && (
                      <span className="inline-block px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#FFF3E0] text-[#B25000]">
                        {student.statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="p-space-md text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedMovement(student)}
                        title="عرض الإضبارة الإلكترونية"
                        className="p-1 hover:bg-surface-container rounded text-primary cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          visibility
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate("students")}
                        title={
                          student.statusStyle === "transferred"
                            ? "وثيقة النقل"
                            : "تعديل البيانات"
                        }
                        className="p-1 hover:bg-surface-container rounded text-on-surface-variant cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {student.statusStyle === "transferred"
                            ? "description"
                            : "edit"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs text-body-sm font-body-sm text-on-surface-variant">
          <span>
            عرض {filteredMovements.length} سجلات حديثة من أصل{" "}
            {totalStudentsCount.toLocaleString("en-US")} طالباً مقيداً
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 rounded text-label-sm cursor-pointer ${
                  currentPage === p
                    ? "bg-surface-container text-primary font-bold"
                    : "hover:bg-surface-container text-on-surface"
                }`}
              >
                {p}
              </button>
            ))}
            <span className="px-2">...</span>
            <button
              type="button"
              onClick={() => setCurrentPage(125)}
              className={`px-3 py-1 rounded text-label-sm cursor-pointer ${
                currentPage === 125
                  ? "bg-surface-container text-primary font-bold"
                  : "hover:bg-surface-container text-on-surface"
              }`}
            >
              125
            </button>
          </div>
        </div>
      </section>

      {/* Quick Preview Modal for Student Movement */}
      {selectedMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
                <span className="material-symbols-outlined text-[22px]">
                  badge
                </span>
                <span>بطاقة حركة القيد الوزاري</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="p-space-lg space-y-3 font-body-md text-body-md">
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-on-surface-variant">رقم القيد الوزاري:</span>
                <span className="font-bold text-primary font-mono">
                  {selectedMovement.ministryId}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-on-surface-variant">الاسم الثلاثي:</span>
                <span className="font-bold text-on-surface">
                  {selectedMovement.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-on-surface-variant">الصف والشعبة:</span>
                <span>{selectedMovement.gradeSection}</span>
              </div>
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-on-surface-variant">تاريخ الحركة:</span>
                <span className="font-mono">{selectedMovement.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">البيان الإداري:</span>
                <span className="font-semibold text-secondary">
                  {selectedMovement.schoolNote}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low px-space-lg py-space-sm flex justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedMovement(null);
                  onNavigate("students");
                }}
                className="px-space-md py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm cursor-pointer"
              >
                الانتقال إلى سجل شؤون الطلبة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
