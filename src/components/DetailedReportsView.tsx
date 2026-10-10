import React, { useState, useMemo } from "react";
import {
  computeStudentSummary,
  INITIAL_STUDENT_MULTI_GRADES,
  SchoolConfig,
  STAGE_GRADES,
  STAGE_LABELS,
  StageKey,
  StudentRecord,
} from "../data/mockData";

interface DetailedReportsViewProps {
  onNotify: (msg: string) => void;
  onNavigate: (path: string) => void;
  schoolConfig: SchoolConfig;
  students: StudentRecord[];
}

export const DetailedReportsView: React.FC<DetailedReportsViewProps> = ({
  onNotify,
  onNavigate,
  schoolConfig,
  students,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    "academic" | "top_students" | "failing_students" | "census" | "attendance" | "finance"
  >("academic");

  const [selectedStage, setSelectedStage] = useState<"all" | StageKey>("all");
  const [selectedExamPeriod, setSelectedExamPeriod] = useState<"all" | "midterm" | "final">("all");

  // Computed Grades Summaries
  const studentGrades = useMemo(() => {
    return INITIAL_STUDENT_MULTI_GRADES.map((rec) => {
      const summary = computeStudentSummary(rec);
      let gradeLetter = "مقبول";
      if (summary.average >= 90) gradeLetter = "امتياز";
      else if (summary.average >= 80) gradeLetter = "جيد جداً";
      else if (summary.average >= 70) gradeLetter = "جيد";
      else if (summary.average >= 60) gradeLetter = "متوسط";
      else if (summary.average < 50) gradeLetter = "راسب";

      const overallStatus =
        summary.failedCount === 0
          ? "ناجح"
          : summary.failedCount <= 2
          ? "مكمل"
          : "راسب";

      return {
        ...rec,
        summary: {
          ...summary,
          overallStatus,
          gradeLetter,
        },
      };
    });
  }, []);

  // Filtered by stage if chosen
  const filteredGrades = useMemo(() => {
    if (selectedStage === "all") return studentGrades;
    return studentGrades.filter((g) => g.stage === selectedStage);
  }, [studentGrades, selectedStage]);

  // Academic Performance Metrics
  const academicMetrics = useMemo(() => {
    const total = filteredGrades.length;
    if (total === 0) return { passRate: 0, failRate: 0, passCount: 0, failCount: 0, avgTotal: 0 };
    const passCount = filteredGrades.filter((g) => g.summary.overallStatus === "ناجح").length;
    const failCount = total - passCount;
    const passRate = Math.round((passCount / total) * 100);
    const failRate = 100 - passRate;
    const avgTotal = Math.round(
      filteredGrades.reduce((acc, curr) => acc + curr.summary.average, 0) / total
    );
    return { passRate, failRate, passCount, failCount, avgTotal };
  }, [filteredGrades]);

  // Top Students List (المتفوقون الأوائل)
  const topStudents = useMemo(() => {
    return [...filteredGrades]
      .sort((a, b) => b.summary.average - a.summary.average)
      .slice(0, 10);
  }, [filteredGrades]);

  // Students with Incomplete / Failing Grades (المكملون والراسبون)
  const failingOrIncompleteStudents = useMemo(() => {
    return filteredGrades.filter(
      (g) => g.summary.overallStatus === "مكمل" || g.summary.overallStatus === "راسب"
    );
  }, [filteredGrades]);

  // Grade Breakdown (تقديرات)
  const gradeDistribution = useMemo(() => {
    const counts = {
      excellent: 0, // 90-100
      veryGood: 0, // 80-89
      good: 0, // 70-79
      medium: 0, // 60-69
      acceptable: 0, // 50-59
      failed: 0, // < 50
    };
    filteredGrades.forEach((g) => {
      const avg = g.summary.average;
      if (avg >= 90) counts.excellent++;
      else if (avg >= 80) counts.veryGood++;
      else if (avg >= 70) counts.good++;
      else if (avg >= 60) counts.medium++;
      else if (avg >= 50) counts.acceptable++;
      else counts.failed++;
    });
    return counts;
  }, [filteredGrades]);

  // Export current report to Excel
  const handleExportCurrentReportExcel = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = "تقرير_مدرسي";

    if (activeReportTab === "academic" || activeReportTab === "top_students") {
      headers = ["ت", "الرقم الإداري", "اسم الطالب", "المرحلة", "الصف", "المجموع", "المعدل", "النتيجة", "التقدير"];
      const source = activeReportTab === "top_students" ? topStudents : filteredGrades;
      rows = source.map((s, idx) => [
        idx + 1,
        s.adminId,
        s.studentName,
        STAGE_LABELS[s.stage],
        s.gradeClass,
        s.summary.totalScore,
        s.summary.average,
        s.summary.overallStatus,
        s.summary.gradeLetter,
      ]);
      filename = activeReportTab === "top_students" ? "لوحة_أوائل_الطلبة" : "تقرير_النتائج_والتحصيل";
    } else if (activeReportTab === "failing_students") {
      headers = ["ت", "الرقم الإداري", "اسم الطالب", "الصف", "المعدل", "عدد مواد الرسوب", "الحالة المعتمدة"];
      rows = failingOrIncompleteStudents.map((s, idx) => [
        idx + 1,
        s.adminId,
        s.studentName,
        s.gradeClass,
        s.summary.average,
        s.summary.failedCount,
        s.summary.overallStatus,
      ]);
      filename = "كشف_الطلبة_المكملين_والراسبين";
    } else if (activeReportTab === "census") {
      headers = ["المرحلة", "الصف", "إجمالي الطلبة", "الذكور", "الإناث", "المستمرون", "المنقولون"];
      rows = [
        ["المرحلة الإعدادية", "الخامس العلمي (أ)", 38, 38, 0, 37, 1],
        ["المرحلة الإعدادية", "الخامس العلمي (ب)", 36, 36, 0, 36, 0],
        ["المرحلة الإعدادية", "السادس العلمي (أ)", 42, 42, 0, 42, 0],
        ["المرحلة الإعدادية", "الرابع العلمي (أ)", 35, 35, 0, 35, 0],
        ["المرحلة المتوسطة", "الثالث المتوسط (أ)", 40, 40, 0, 39, 1],
      ];
      filename = "استمارة_الإحصاء_المدرسي_السنوي";
    } else {
      headers = ["ت", "اسم التقرير", "القيمة", "الملاحظات"];
      rows = [
        [1, "إجمالي الطلبة", 1240, "مسجلون بالقيد العام"],
        [2, "نسبة الحضور العام", "94.8%", "ضمن المعيار النموذجي"],
        [3, "المقبوضات المالية", "12,450,000 د.ع", "صندوق المدرسة المعتمد"],
      ];
      filename = "تقرير_النظام_الموجز";
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("تم تصدير التقرير إلى ملف Excel بنجاح");
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Printable Ministry Header (shown ONLY during window.print()) */}
      <div className="hidden print:block mb-6 p-4 border-b-2 border-stone-800">
        <div className="flex items-center justify-between">
          <div className="text-right text-xs space-y-1">
            <div className="font-bold">جمهورية العراق - وزارة التربية</div>
            <div className="font-bold text-stone-700">{schoolConfig.directorate}</div>
            <div className="font-black text-sm">{schoolConfig.schoolName}</div>
            <div>العام الدراسي: {schoolConfig.academicYear}</div>
          </div>
          <div className="text-center">
            <img
              src={schoolConfig.ministryLogoUrl}
              alt="وزارة التربية"
              className="w-14 h-14 mx-auto object-contain"
            />
            <div className="text-xs font-bold mt-1">تقرير إحصائي رسمي صادر عن إدارة المدرسة</div>
          </div>
          <div className="text-left text-xs space-y-1">
            <img
              src={schoolConfig.schoolLogoUrl}
              alt="شعار المدرسة"
              className="w-12 h-12 object-contain ml-auto"
            />
            <div>تاريخ الإصدار: {new Date().toLocaleDateString("ar-IQ")}</div>
            <div className="font-mono">الكود الوزاري: {schoolConfig.schoolCode}</div>
          </div>
        </div>
      </div>

      {/* Main Top Banner (No Print) */}
      <div className="no-print bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high/60 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[32px]">analytics</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
                مركز التقارير والإحصائيات الشاملة
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                مفعل ومحدث دورياً
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              تقارير التحصيل والنتائج، لوحة المتفوقين، كشوفات المكملين، الإحصاء السنوي، والمالية • {schoolConfig.schoolName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCurrentReportExcel}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>تصدير التقرير لـ Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تجهيز التقرير الرسمي للطباعة");
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>طباعة التقرير الوزاري</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar (No Print) */}
      <div className="no-print bg-surface-container-lowest p-2 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-wrap items-center gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveReportTab("academic")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "academic"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
          <span>نسب النجاح والتحصيل الأكاديمي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab("top_students")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "top_students"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">military_tech</span>
          <span>لوحة شرف أوائل الطلبة المتفوقين</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab("failing_students")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "failing_students"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>كشف الطلبة المكملين والراسبين</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab("census")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "census"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">demography</span>
          <span>استمارة الإحصاء السنوي لوزارة التربية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab("attendance")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "attendance"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">fact_check</span>
          <span>تقرير الحضور والإنذارات المدرسية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab("finance")}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === "finance"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>تقرير المقبوضات والصندوق المدرسي</span>
        </button>
      </div>

      {/* Sub-Filters: Stage Selector (No Print) */}
      {(activeReportTab === "academic" ||
        activeReportTab === "top_students" ||
        activeReportTab === "failing_students") && (
        <div className="no-print bg-surface-container-lowest px-4 py-3 rounded-xl border border-surface-container-high/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface-variant">تصفية المرحلة:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as any)}
              className="h-8 px-2.5 bg-surface-container-low rounded-lg font-semibold text-primary outline-none cursor-pointer"
            >
              <option value="all">كافة المراحل الدراسية</option>
              <option value="primary">المرحلة الابتدائية</option>
              <option value="intermediate">المرحلة المتوسطة</option>
              <option value="preparatory">المرحلة الإعدادية</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface-variant">فترة التقرير:</span>
            <select
              value={selectedExamPeriod}
              onChange={(e) => setSelectedExamPeriod(e.target.value as any)}
              className="h-8 px-2.5 bg-surface-container-low rounded-lg font-semibold text-primary outline-none cursor-pointer"
            >
              <option value="all">النتيجة السنوية الشاملة</option>
              <option value="midterm">امتحانات نصف السنة فقط</option>
              <option value="final">الامتحانات النهائية (الدور الأول)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: Academic Analysis */}
      {activeReportTab === "academic" && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant block">نسبة النجاح العامة</span>
              <span className="text-2xl font-black text-[#2E7D32] tabular-nums block mt-1">
                {academicMetrics.passRate}%
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {academicMetrics.passCount} طالب ناجح
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant block">نسبة الإكمال والرسوب</span>
              <span className="text-2xl font-black text-error tabular-nums block mt-1">
                {academicMetrics.failRate}%
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {academicMetrics.failCount} طالب مكمل أو راسب
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant block">المعدل العام للدرجات</span>
              <span className="text-2xl font-black text-primary tabular-nums block mt-1">
                {academicMetrics.avgTotal} / 100
              </span>
              <span className="text-[10px] text-on-surface-variant">متوسط تحصيل الطلبة</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant block">الطلبة الممتازون (90+)</span>
              <span className="text-2xl font-black text-secondary tabular-nums block mt-1">
                {gradeDistribution.excellent}
              </span>
              <span className="text-[10px] text-on-surface-variant">مرشحون للتميز الوزاري</span>
            </div>
          </div>

          {/* Grade Distribution Bar */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs space-y-3">
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              <span>التوزيع الإحصائي لتقديرات الطلبة</span>
            </h3>

            <div className="space-y-2 text-xs">
              {/* Excellent */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-[#2E7D32]">امتياز (90 - 100)</span>
                  <span className="font-mono">{gradeDistribution.excellent} طالب</span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E7D32] rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (gradeDistribution.excellent / (filteredGrades.length || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Very Good */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-secondary">جيد جداً (80 - 89)</span>
                  <span className="font-mono">{gradeDistribution.veryGood} طالب</span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (gradeDistribution.veryGood / (filteredGrades.length || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Good */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-primary">جيد (70 - 79)</span>
                  <span className="font-mono">{gradeDistribution.good} طالب</span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (gradeDistribution.good / (filteredGrades.length || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Medium & Acceptable */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-[#F57F17]">متوسط ومقبول (50 - 69)</span>
                  <span className="font-mono">
                    {gradeDistribution.medium + gradeDistribution.acceptable} طالب
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F57F17] rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((gradeDistribution.medium + gradeDistribution.acceptable) /
                          (filteredGrades.length || 1)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Failed */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-error">دون الـ 50 (راسب أو مكمل)</span>
                  <span className="font-mono">{gradeDistribution.failed} طالب</span>
                </div>
                <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-error rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (gradeDistribution.failed / (filteredGrades.length || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Top Students (لوحة شرف الأوائل) */}
      {activeReportTab === "top_students" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          <div className="px-6 py-4 bg-primary text-on-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">military_tech</span>
              <h3 className="font-headline-sm text-headline-sm font-bold">
                لوحة شرف أوائل الطلبة المتفوقين في المدرسة (العشرة الأوائل)
              </h3>
            </div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-bold">
              معتمد وفق المعدل العام التراكمي
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container font-bold text-primary h-12 border-b border-surface-container-high">
                  <th className="px-4 text-center">الترتيب</th>
                  <th className="px-4">الرقم الإداري</th>
                  <th className="px-4">اسم الطالب المتفوق</th>
                  <th className="px-4">المرحلة الدراسية</th>
                  <th className="px-4">الصف والشعبة</th>
                  <th className="px-4 text-center">المجموع الكلي</th>
                  <th className="px-4 text-center">المعدل العام</th>
                  <th className="px-4 text-center">التقدير الوزاري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {topStudents.map((s, index) => (
                  <tr key={s.studentId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          index === 0
                            ? "bg-[#FFD700] text-stone-900 shadow-xs"
                            : index === 1
                            ? "bg-[#C0C0C0] text-stone-900"
                            : index === 2
                            ? "bg-[#CD7F32] text-white"
                            : "bg-surface-container text-on-surface"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-secondary font-bold text-[11px]">
                      {s.adminId}
                    </td>
                    <td className="px-4 py-3 font-bold text-on-surface text-sm">
                      {s.studentName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {STAGE_LABELS[s.stage]}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {s.gradeClass}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-on-surface">
                      {s.summary.totalScore}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-base text-[#2E7D32]">
                      {s.summary.average}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        {s.summary.gradeLetter}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Failing / Incomplete Students */}
      {activeReportTab === "failing_students" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          <div className="px-6 py-4 bg-error text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">rule</span>
              <h3 className="font-headline-sm text-headline-sm font-bold">
                كشف الطلبة المكملين (الدور الثاني) والراسبين
              </h3>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
              إجمالي: {failingOrIncompleteStudents.length} طالب
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container font-bold text-primary h-12 border-b border-surface-container-high">
                  <th className="px-4">ت</th>
                  <th className="px-4">الرقم الإداري</th>
                  <th className="px-4">اسم الطالب</th>
                  <th className="px-4">الصف والشعبة</th>
                  <th className="px-4 text-center">المعدل</th>
                  <th className="px-4 text-center">عدد مواد الرسوب</th>
                  <th className="px-4 text-center">القرار الوزاري</th>
                  <th className="px-4">الإجراء المقترح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {failingOrIncompleteStudents.map((s, idx) => (
                  <tr key={s.studentId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-mono font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-secondary font-bold">{s.adminId}</td>
                    <td className="px-4 py-3 font-bold text-on-surface text-sm">{s.studentName}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{s.gradeClass}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-error">
                      {s.summary.average}%
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-error">
                      {s.summary.failedCount} مادة
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          s.summary.overallStatus === "مكمل"
                            ? "bg-[#FFF8E1] text-[#F57F17]"
                            : "bg-[#FFEBEE] text-error"
                        }`}
                      >
                        {s.summary.overallStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {s.summary.overallStatus === "مكمل"
                        ? "أداء امتحانات الدور الثاني الوزارية"
                        : "إعادة السنة الدراسية / إشعار ولي الأمر"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Ministerial Census Form */}
      {activeReportTab === "census" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          <div className="px-6 py-4 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">assignment</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                استمارة الإحصاء السنوي العام لمديرية التربية (استمارة رقم 44)
              </h3>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-lg">
              العام الدراسي 2024 - 2025
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high/60 text-primary font-bold h-12 border-b border-surface-container-high">
                  <th className="px-4">المرحلة</th>
                  <th className="px-4">الصف والشعبة</th>
                  <th className="px-4 text-center">المقيدين بداية العام</th>
                  <th className="px-4 text-center">الذكور</th>
                  <th className="px-4 text-center">الإناث</th>
                  <th className="px-4 text-center">المستمرون بالدوام</th>
                  <th className="px-4 text-center">المنقولون والمؤجلون</th>
                  <th className="px-4 text-center">المفصولون بالغياب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-mono">
                <tr>
                  <td className="px-4 py-3 font-sans font-bold text-on-surface">الإعدادية</td>
                  <td className="px-4 py-3 font-sans font-semibold text-primary">الخامس العلمي (أ)</td>
                  <td className="px-4 py-3 text-center font-bold">38</td>
                  <td className="px-4 py-3 text-center">38</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center text-[#2E7D32] font-bold">37</td>
                  <td className="px-4 py-3 text-center">1</td>
                  <td className="px-4 py-3 text-center">0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-sans font-bold text-on-surface">الإعدادية</td>
                  <td className="px-4 py-3 font-sans font-semibold text-primary">الخامس العلمي (ب)</td>
                  <td className="px-4 py-3 text-center font-bold">36</td>
                  <td className="px-4 py-3 text-center">36</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center text-[#2E7D32] font-bold">36</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center">0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-sans font-bold text-on-surface">الإعدادية</td>
                  <td className="px-4 py-3 font-sans font-semibold text-primary">السادس العلمي (أ)</td>
                  <td className="px-4 py-3 text-center font-bold">42</td>
                  <td className="px-4 py-3 text-center">42</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center text-[#2E7D32] font-bold">42</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center">0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-sans font-bold text-on-surface">الإعدادية</td>
                  <td className="px-4 py-3 font-sans font-semibold text-primary">الرابع العلمي (أ)</td>
                  <td className="px-4 py-3 text-center font-bold">35</td>
                  <td className="px-4 py-3 text-center">35</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center text-[#2E7D32] font-bold">35</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center">0</td>
                </tr>
                <tr className="bg-surface-container-high/40 font-bold">
                  <td colSpan={2} className="px-4 py-3 font-sans text-primary">المجموع الكلي المعتمد</td>
                  <td className="px-4 py-3 text-center text-primary text-sm">151</td>
                  <td className="px-4 py-3 text-center">151</td>
                  <td className="px-4 py-3 text-center">0</td>
                  <td className="px-4 py-3 text-center text-[#2E7D32] text-sm">150</td>
                  <td className="px-4 py-3 text-center">1</td>
                  <td className="px-4 py-3 text-center">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Attendance Report */}
      {activeReportTab === "attendance" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">event_busy</span>
              <span>تقرير الغيابات والإنذارات المدرسية للمتجاوزين للحد المسموح</span>
            </h3>
            <span className="text-xs text-error font-bold bg-error/10 px-3 py-1 rounded-full">
              الحد المسموح: 5 أيام بدون عذر
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">معدل الحضور اليومي</span>
              <span className="text-2xl font-black text-[#2E7D32] mt-1 block">96.4%</span>
              <span className="text-[11px] text-secondary">حالة انضباط ممتازة</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">عدد الإنذارات الموجهة</span>
              <span className="text-2xl font-black text-[#F57F17] mt-1 block">3 إنذارات</span>
              <span className="text-[11px] text-on-surface-variant">تم تسليمها لأولياء الأمور</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">الطلبة المهددون بالفصل</span>
              <span className="text-2xl font-black text-error mt-1 block">1 طالب</span>
              <span className="text-[11px] text-error font-semibold">تجاوز 5 أيام غياب غير مبرر</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Finance Report */}
      {activeReportTab === "finance" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              <span>تقرير المقبوضات وصندوق المدرسة المالي</span>
            </h3>
            <span className="text-xs text-secondary font-bold bg-secondary-container px-3 py-1 rounded-full">
              تدقيق المحاسب المعتمد
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">إجمالي المقبوضات</span>
              <span className="text-2xl font-black text-primary mt-1 block">18,500,000 د.ع</span>
              <span className="text-[11px] text-secondary">وصولات رسمية مقيدة</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">نسبة التحصيل المالي</span>
              <span className="text-2xl font-black text-[#2E7D32] mt-1 block">88.5%</span>
              <span className="text-[11px] text-on-surface-variant">مطابق لسجلات الصندوق</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-xs text-on-surface-variant font-bold block">المتبقي من الرسوم</span>
              <span className="text-2xl font-black text-error mt-1 block">2,400,000 د.ع</span>
              <span className="text-[11px] text-on-surface-variant">أقساط ورسوم مؤجلة</span>
            </div>
          </div>
        </div>
      )}

      {/* Official Signatures for Printouts (Print Only) */}
      <div className="hidden print:flex items-center justify-between pt-8 border-t border-stone-800 text-xs mt-8">
        <div className="text-center">
          <div className="font-bold">مسؤول الإحصاء والتقارير</div>
          <div className="mt-8 text-stone-500">التوقيع: .....................</div>
        </div>
        <div className="text-center">
          <div className="font-bold">معاون المدير لشؤون الطلبة</div>
          <div className="mt-8 font-semibold">{schoolConfig.vicePrincipalName}</div>
        </div>
        <div className="text-center">
          <div className="font-bold">مدير المدرسة</div>
          <div className="mt-8 font-bold">{schoolConfig.principalName}</div>
          <div className="text-[10px] text-stone-500">(الختم الرسمي للمدرسة)</div>
        </div>
      </div>
    </div>
  );
};
