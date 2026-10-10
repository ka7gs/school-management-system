import React, { useState, useMemo } from "react";
import {
  STAGE_GRADES,
  STAGE_LABELS,
  StageKey,
  StudentRecord,
  SystemNotification,
} from "../data/mockData";
import { UserRole } from "./LoginView";

interface SecondaryModuleProps {
  moduleKey: string;
  onNotify: (msg: string) => void;
  onNavigate: (path: string) => void;
  userRole?: UserRole;
  teacherSubject?: string;
  students?: StudentRecord[];
  onAddNotification?: (
    notif: Omit<SystemNotification, "id" | "timestamp" | "isRead">
  ) => void;
  systemNotifications?: SystemNotification[];
}

export const SecondaryModulesView: React.FC<SecondaryModuleProps> = ({
  moduleKey,
  onNotify,
  onNavigate,
  userRole = "principal",
  teacherSubject = "الرياضيات (Mathematics)",
  students = [],
  onAddNotification,
  systemNotifications = [],
}) => {
  const [stage, setStage] = useState<StageKey>("preparatory");
  const [gradeCode, setGradeCode] = useState<string>("5s");

  // Absence Alert Settings & Threshold State
  const [absenceThreshold, setAbsenceThreshold] = useState<number>(3);
  const [autoAlertEnabled, setAutoAlertEnabled] = useState<boolean>(true);

  // Attendance Search and Filter State
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState<string>("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<
    "all" | "present" | "excused" | "absent"
  >("all");

  const [attendanceList, setAttendanceList] = useState([
    {
      id: "att-1",
      ministryId: "IQ-2024-51001",
      adminId: "ADM-24-101",
      name: "علي حسين كريم الدليمي",
      grade: "الخامس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "5s",
      status: "present",
      absenceDaysCount: 0,
      note: "حاضر - مشاركة متميزة بالدرس",
    },
    {
      id: "att-2",
      ministryId: "IQ-2024-51002",
      adminId: "ADM-24-102",
      name: "محمد باقر جاسم الربيعي",
      grade: "الخامس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "5s",
      status: "present",
      absenceDaysCount: 1,
      note: "حاضر من بداية الحصة",
    },
    {
      id: "att-3",
      ministryId: "IQ-2024-51003",
      adminId: "ADM-24-103",
      name: "سجاد حيدر عبد الأمير الجبوري",
      grade: "الخامس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "5s",
      status: "excused",
      absenceDaysCount: 2,
      note: "إجازة مرضية مصدقة وموثقة",
    },
    {
      id: "att-4",
      ministryId: "IQ-2024-51004",
      adminId: "ADM-24-104",
      name: "كرار عمار فاضل الزيدي",
      grade: "الخامس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "5s",
      status: "present",
      absenceDaysCount: 0,
      note: "حاضر ملتزم",
    },
    {
      id: "att-5",
      ministryId: "IQ-2024-51005",
      adminId: "ADM-24-105",
      name: "زيد رافد محمود السامرائي",
      grade: "الخامس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "5s",
      status: "absent",
      absenceDaysCount: 5,
      note: "تجاوز حد الغياب المسموح - تم إشعار ولي الأمر",
    },
    {
      id: "att-6",
      ministryId: "IQ-2024-8841",
      adminId: "ADM-2024-1001",
      name: "علي حيدر كاظم الخفاجي",
      grade: "السادس العلمي (أ)",
      stage: "preparatory",
      gradeCode: "6s",
      status: "present",
      absenceDaysCount: 0,
      note: "حاضر",
    },
    {
      id: "att-7",
      ministryId: "IQ-2024-8842",
      adminId: "ADM-2024-1002",
      name: "مصطفى عمار فاضل الزيدي",
      grade: "السادس العلمي (ب)",
      stage: "preparatory",
      gradeCode: "6s",
      status: "present",
      absenceDaysCount: 1,
      note: "حاضر",
    },
    {
      id: "att-8",
      ministryId: "IQ-2024-6210",
      adminId: "ADM-2024-2011",
      name: "الحسن علي محمود الكبيسي",
      grade: "الثالث المتوسط (أ)",
      stage: "intermediate",
      gradeCode: "m3",
      status: "absent",
      absenceDaysCount: 4,
      note: "غياب متكرر بدون عذر رسمي",
    },
    {
      id: "att-9",
      ministryId: "IQ-2024-3104",
      adminId: "ADM-2024-3005",
      name: "أمير ياسر قحطان العبيدي",
      grade: "السادس الابتدائي (أ)",
      stage: "primary",
      gradeCode: "p6",
      status: "present",
      absenceDaysCount: 0,
      note: "تلميذ ملتزم بالحضور اليومي",
    },
    {
      id: "att-10",
      ministryId: "IQ-2024-3190",
      adminId: "ADM-2024-3006",
      name: "عباس فلاح حسن الشمري",
      grade: "الأول الابتدائي (أ)",
      stage: "primary",
      gradeCode: "p1",
      status: "present",
      absenceDaysCount: 0,
      note: "حاضر",
    },
  ]);

  const [receipts, setReceipts] = useState([
    {
      receiptNo: "FIN-2024-9041",
      studentName: "علي حيدر كاظم الخفاجي",
      adminId: "ADM-2024-1001",
      stageGrade: "السادس العلمي (أ)",
      category: "مساهمة صندوق المدرسة والكتب",
      amount: "50,000 د.ع",
      date: "2024/10/14",
      status: "مسدد بالكامل",
    },
    {
      receiptNo: "FIN-2024-9042",
      studentName: "مصطفى عمار فاضل الزيدي",
      adminId: "ADM-2024-1002",
      stageGrade: "السادس العلمي (ب)",
      category: "رسوم البطاقة والزي المدرسي",
      amount: "75,000 د.ع",
      date: "2024/10/14",
      status: "مسدد بالكامل",
    },
    {
      receiptNo: "FIN-2024-9043",
      studentName: "أمير ياسر قحطان العبيدي",
      adminId: "ADM-2024-3005",
      stageGrade: "السادس الابتدائي (أ)",
      category: "رسوم الأنشطة اللاصفية",
      amount: "25,000 د.ع",
      date: "2024/10/15",
      status: "مسدد بالكامل",
    },
    {
      receiptNo: "FIN-2024-9044",
      studentName: "الحسن علي محمود الكبيسي",
      adminId: "ADM-2024-2011",
      stageGrade: "الثالث المتوسط (أ)",
      category: "قسط الفصل الدراسي الأول",
      amount: "150,000 د.ع",
      date: "2024/10/15",
      status: "قسط جزئي",
    },
  ]);

  const [newReceiptStudent, setNewReceiptStudent] = useState("");
  const [newReceiptAmount, setNewReceiptAmount] = useState("50,000");
  const [newReceiptCategory, setNewReceiptCategory] = useState(
    "مساهمة صندوق المدرسة والكتب"
  );

  const handleStageChange = (nextStage: StageKey) => {
    setStage(nextStage);
    setGradeCode(STAGE_GRADES[nextStage][0]?.code || "");
  };

  const toggleAttendance = (id: string | number, newStatus: string) => {
    let triggeredStudent: any = null;

    setAttendanceList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const wasAbsent = item.status === "absent";
          const isNowAbsent = newStatus === "absent";
          let newAbsenceCount = item.absenceDaysCount || 0;

          if (!wasAbsent && isNowAbsent) {
            newAbsenceCount += 1;
            if (newAbsenceCount >= absenceThreshold) {
              triggeredStudent = {
                ...item,
                absenceDaysCount: newAbsenceCount,
              };
            }
          } else if (wasAbsent && !isNowAbsent && newAbsenceCount > 0) {
            newAbsenceCount -= 1;
          }

          return {
            ...item,
            status: newStatus,
            absenceDaysCount: newAbsenceCount,
          };
        }
        return item;
      })
    );

    if (triggeredStudent && autoAlertEnabled && onAddNotification) {
      onAddNotification({
        type: "absence_alert",
        title: `تنبيه غياب تلقائي: تجاوز حد الغياب (${triggeredStudent.absenceDaysCount} أيام)`,
        message: `تجاوز الطالب ${triggeredStudent.name} حد الغياب المسموح به (${triggeredStudent.absenceDaysCount} أيام غياب تراكمي من أصل حد ${absenceThreshold} أيام). الصف: ${triggeredStudent.grade} - الرقم الإداري: ${triggeredStudent.adminId}. يُرجى توجيه إنذار رسمي لولي الأمر.`,
        studentId: String(triggeredStudent.id),
        studentName: triggeredStudent.name,
        adminId: triggeredStudent.adminId,
        absenceDays: triggeredStudent.absenceDaysCount,
        threshold: absenceThreshold,
        gradeClass: triggeredStudent.grade,
        severity:
          triggeredStudent.absenceDaysCount >= 7 ? "error" : "warning",
      });
      onNotify(
        `⚠️ تنبيه تلقائي: تجاوز الطالب (${triggeredStudent.name}) حد الغياب (${triggeredStudent.absenceDaysCount} أيام) وتم إرسال إشعار للوحة إشعارات النظام!`
      );
    } else {
      onNotify("تم تحديث حالة الحضور اليومي للطالب في السجل الإلكتروني");
    }
  };

  const handleSendManualAlert = (student: any) => {
    if (onAddNotification) {
      const days = student.absenceDaysCount || 0;
      onAddNotification({
        type: "absence_alert",
        title: `إنذار غياب رسمي: الطالب ${student.name}`,
        message: `سجل الطالب ${student.name} (${days} أيام غياب تراكمي) متجاوزاً الحد النظامي (${absenceThreshold} أيام). الصف: ${student.grade} - الرقم الإداري: ${student.adminId}.`,
        studentId: String(student.id),
        studentName: student.name,
        adminId: student.adminId,
        absenceDays: days,
        threshold: absenceThreshold,
        gradeClass: student.grade,
        severity: days >= 7 ? "error" : "warning",
      });
      onNotify(
        `تم إرسال إنذار رسمي للطالب (${student.name}) إلى لوحة إشعارات النظام بنجاح`
      );
    }
  };

  const handleScanAndGenerateAbsenceAlerts = () => {
    const violators = mergedAttendanceList.filter(
      (s) =>
        (!s.stage || s.stage === stage) &&
        (!s.gradeCode || s.gradeCode === gradeCode) &&
        (s.absenceDaysCount || 0) >= absenceThreshold
    );

    if (violators.length === 0) {
      onNotify(
        `فحص الغياب مكتمل: لا يوجد طلاب تجاوزوا حد الغياب المحدد (${absenceThreshold} أيام) في هذا الصف.`
      );
      return;
    }

    if (onAddNotification) {
      violators.forEach((st) => {
        onAddNotification({
          type: "absence_alert",
          title: `تنبيه غياب تلقائي: تجاوز حد الغياب (${st.absenceDaysCount} أيام)`,
          message: `تجاوز الطالب ${st.name} حد الغياب المسموح به (${st.absenceDaysCount} أيام تراكمية من أصل حد ${absenceThreshold} أيام). الصف: ${st.grade} - الرقم الإداري: ${st.adminId}.`,
          studentId: String(st.id),
          studentName: st.name,
          adminId: st.adminId,
          absenceDays: st.absenceDaysCount,
          threshold: absenceThreshold,
          gradeClass: st.grade,
          severity: (st.absenceDaysCount || 0) >= 7 ? "error" : "warning",
        });
      });
    }

    onNotify(
      `تم فحص السجل وإرسال (${violators.length}) تنبيه غياب تلقائي إلى لوحة إشعارات النظام!`
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceList((prev) =>
      prev.map((item) => {
        if ((!item.stage || item.stage === stage) && (!item.gradeCode || item.gradeCode === gradeCode)) {
          return { ...item, status: "present" };
        }
        return item;
      })
    );
    onNotify("تم تسجيل حضور جميع طلاب الصف المحددين بنجاح");
  };

  // Sync with prop students
  const mergedAttendanceList = useMemo(() => {
    const list = [...attendanceList];
    students.forEach((st) => {
      const exists = list.some(
        (a) =>
          a.id === st.id ||
          a.adminId === st.adminId ||
          a.ministryId === st.ministryId
      );
      if (!exists) {
        list.push({
          id: st.id,
          ministryId: st.ministryId,
          adminId: st.adminId,
          name: st.fullName,
          grade: `${st.gradeSection}`,
          stage: st.stageCode,
          gradeCode: st.gradeCode,
          status: "present",
          absenceDaysCount: 0,
          note: "حاضر",
        });
      }
    });
    return list;
  }, [attendanceList, students]);

  // Filter attendance records by active stage, grade, search query, and status
  const filteredAttendance = useMemo(() => {
    return mergedAttendanceList.filter((row) => {
      // Stage & Grade matching
      if (row.stage && row.stage !== stage) return false;
      if (row.gradeCode && row.gradeCode !== gradeCode) return false;

      // Status chip filter
      if (attendanceStatusFilter !== "all" && row.status !== attendanceStatusFilter) {
        return false;
      }

      // Search field filter
      if (attendanceSearchQuery.trim()) {
        const q = attendanceSearchQuery.trim().toLowerCase();
        const matchesName = row.name.toLowerCase().includes(q);
        const matchesAdmin = row.adminId.toLowerCase().includes(q);
        const matchesMinistry = row.ministryId.toLowerCase().includes(q);
        const matchesNote = (row.note || "").toLowerCase().includes(q);
        if (!matchesName && !matchesAdmin && !matchesMinistry && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [mergedAttendanceList, stage, gradeCode, attendanceStatusFilter, attendanceSearchQuery]);

  // Attendance stats for current grade
  const attendanceStats = useMemo(() => {
    const classRows = mergedAttendanceList.filter(
      (row) => (!row.stage || row.stage === stage) && (!row.gradeCode || row.gradeCode === gradeCode)
    );
    const total = classRows.length;
    const present = classRows.filter((r) => r.status === "present").length;
    const excused = classRows.filter((r) => r.status === "excused").length;
    const absent = classRows.filter((r) => r.status === "absent").length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "100.0";
    return { total, present, excused, absent, rate };
  }, [mergedAttendanceList, stage, gradeCode]);

  const handleAddReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceiptStudent.trim()) {
      onNotify("يرجى إدخال اسم الطالب لقطع وصل القبض");
      return;
    }
    const created = {
      receiptNo: `FIN-2024-${9045 + receipts.length}`,
      studentName: newReceiptStudent.trim(),
      adminId: `ADM-2024-${1050 + receipts.length}`,
      stageGrade:
        STAGE_GRADES[stage].find((g) => g.code === gradeCode)?.label ||
        "السادس العلمي",
      category: newReceiptCategory,
      amount: `${newReceiptAmount} د.ع`,
      date: "2024/10/15",
      status: "مسدد بالكامل",
    };
    setReceipts((prev) => [created, ...prev]);
    setNewReceiptStudent("");
    onNotify(`تم إصدار وصل القبض المالي رقم ${created.receiptNo} بنجاح`);
  };

  // 1. Attendance Module (Supports Teacher Subject Restriction + Cascading Stage -> Grade)
  if (moduleKey === "attendance") {
    return (
      <div className="flex flex-col w-full gap-space-lg">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">
                event_available
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg text-primary">
                  سجل الحضور والغياب اليومي
                </h1>
                {userRole === "teacher" && (
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2.5 py-0.5 rounded">
                    خاص بحصة مادة: {teacherSubject}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                ثانوية المتميزين للبنين - تربية الكرخ الأولى • الأحد 15 تشرين
                الأول 2024
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={() =>
                onNotify(
                  "تم اعتماد وإرسال الموقف اليومي للغيابات إلى الإشراف التربوي"
                )
              }
              className="flex items-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-lg py-2.5 rounded-lg font-label-md text-label-md shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                verified
              </span>
              <span>اعتماد حضور الحصة</span>
            </button>
          </div>
        </div>

        {/* Cascading Stage & Grade Selector for Attendance */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface mb-1">
              المرحلة الدراسية
            </label>
            <select
              value={stage}
              onChange={(e) => handleStageChange(e.target.value as StageKey)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg outline-none cursor-pointer"
            >
              <option value="primary">المرحلة الابتدائية</option>
              <option value="intermediate">المرحلة المتوسطة</option>
              <option value="preparatory">المرحلة الإعدادية</option>
            </select>
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface mb-1">
              الصف الدراسي ({STAGE_LABELS[stage]})
            </label>
            <select
              value={gradeCode}
              onChange={(e) => setGradeCode(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg outline-none cursor-pointer"
            >
              {STAGE_GRADES[stage].map((g) => (
                <option key={g.code} value={g.code}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface mb-1">
              المادة الدراسية
            </label>
            <input
              type="text"
              readOnly
              value={
                userRole === "teacher"
                  ? `${teacherSubject} (مادة التخصص)`
                  : "جميع الحصص اليومية"
              }
              className="w-full h-10 px-3 bg-surface-container-high/50 text-primary font-bold rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Automatic Absence Alerts Setting & Action Bar */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-space-md rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                notifications_active
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline-sm text-headline-sm font-bold text-amber-900">
                  نظام الإنذار والتنبيه التلقائي لتجاوز الغياب
                </span>
                <span className="bg-amber-200/70 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  تلقائي في لوحة الإشعارات
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                يتم إرسال تنبيهات تلقائية إلى لوحة إشعارات النظام في الشريط العلوي فور تجاوز الطالب حد الغياب المحدد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
              <label className="text-xs text-amber-900 font-bold whitespace-nowrap">
                حد أيام الغياب للتنبيه:
              </label>
              <select
                value={absenceThreshold}
                onChange={(e) => setAbsenceThreshold(Number(e.target.value))}
                className="bg-transparent font-bold text-xs text-amber-900 outline-none cursor-pointer"
              >
                <option value={3}>3 أيام (تنبيه أولي)</option>
                <option value={5}>5 أيام (إنذار أول)</option>
                <option value={7}>7 أيام (إنذار نهائي)</option>
                <option value={10}>10 أيام (فصل دراسي)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleScanAndGenerateAbsenceAlerts}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="فحص سجل غيابات هذا الصف وإرسال التنبيهات للطلبة المتجاوزين"
            >
              <span className="material-symbols-outlined text-[16px]">
                crisis_alert
              </span>
              <span>فحص وتوليد تنبيهات الغياب الآن</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar for Attendance */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-space-md">
          {/* Prominent Search Field (حقل البحث المطلوب) */}
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={attendanceSearchQuery}
              onChange={(e) => setAttendanceSearchQuery(e.target.value)}
              placeholder="بحث عن طالب (الاسم، الرقم الإداري، الرقم الإحصائي، الملاحظة)..."
              className="w-full h-10 pr-10 pl-9 bg-surface-container-low border border-surface-container-high rounded-lg outline-none text-body-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {attendanceSearchQuery && (
              <button
                type="button"
                onClick={() => setAttendanceSearchQuery("")}
                className="absolute left-2.5 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                title="مسح البحث"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <span className="text-xs text-on-surface-variant font-medium ml-1">تصفية:</span>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                attendanceStatusFilter === "all"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container"
              }`}
            >
              الكل ({attendanceStats.total})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter("present")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                attendanceStatusFilter === "present"
                  ? "bg-[#1B5E20] text-white shadow-sm"
                  : "bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]"
              }`}
            >
              حاضر ({attendanceStats.present})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter("excused")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                attendanceStatusFilter === "excused"
                  ? "bg-[#B25000] text-white shadow-sm"
                  : "bg-[#FFF3E0] text-[#B25000] hover:bg-[#FFE0B2]"
              }`}
            >
              مجاز ({attendanceStats.excused})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatusFilter("absent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                attendanceStatusFilter === "absent"
                  ? "bg-[#C62828] text-white shadow-sm"
                  : "bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2]"
              }`}
            >
              غائب ({attendanceStats.absent})
            </button>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-bold border border-surface-container-highest transition-colors cursor-pointer mr-1"
            >
              تسجيل حضور الكل
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
          <div className="px-space-lg py-space-md bg-surface-container-high/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                قائمة تدقيق الحضور اليومي —{" "}
                {STAGE_GRADES[stage].find((g) => g.code === gradeCode)?.label}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                (المعروض: {filteredAttendance.length} من {attendanceStats.total} طالب)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm bg-[#E8F5E9] text-[#1B5E20] px-3 py-1 rounded-full font-bold">
                نسبة الحضور: {attendanceStats.rate}%
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container text-primary font-table-header text-table-header h-12">
                  <th className="px-3 w-10 text-center">ت</th>
                  <th className="px-3 w-32">الرقم الإحصائي والإداري</th>
                  <th className="px-4 min-w-[150px]">اسم الطالب</th>
                  <th className="px-3 w-32">الصف والشعبة</th>
                  <th className="px-4 text-center w-48">حالة الحضور</th>
                  <th className="px-3 text-center min-w-[170px]">رصيد الغياب والإنذار</th>
                  <th className="px-4 min-w-[180px]">الملاحظات والتبليغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-table-data text-table-data">
                {filteredAttendance.map((row, idx) => {
                  const isExceeded = (row.absenceDaysCount || 0) >= absenceThreshold;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        isExceeded ? "bg-error/[0.03]" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-bold text-on-surface-variant tabular-nums text-center">
                        0{idx + 1}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        <div className="text-primary font-bold">
                          {row.ministryId}
                        </div>
                        <div className="text-secondary">{row.adminId}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-on-surface text-sm">
                        {row.name}
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant font-medium">
                        {row.grade}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-container-high">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(row.id, "present")}
                            className={`px-3 py-1 rounded text-label-sm cursor-pointer transition-all ${
                              row.status === "present"
                                ? "bg-[#E8F5E9] text-[#1B5E20] font-bold shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAttendance(row.id, "excused")}
                            className={`px-3 py-1 rounded text-label-sm cursor-pointer transition-all ${
                              row.status === "excused"
                                ? "bg-[#FFF3E0] text-[#B25000] font-bold shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            مجاز
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAttendance(row.id, "absent")}
                            className={`px-3 py-1 rounded text-label-sm cursor-pointer transition-all ${
                              row.status === "absent"
                                ? "bg-[#FFEBEE] text-[#C62828] font-bold shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            غائب
                          </button>
                        </div>
                      </td>

                      {/* Accumulated Absence Days & Auto Alert Badge */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isExceeded ? (
                            <>
                              <span className="bg-[#FFEBEE] text-error font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-error/30 shadow-2xs">
                                <span className="material-symbols-outlined text-[14px]">
                                  warning
                                </span>
                                <span>{row.absenceDaysCount} أيام (متجاوز الحد!)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendManualAlert(row)}
                                className="text-[10px] text-error hover:underline flex items-center gap-0.5 font-bold cursor-pointer mt-0.5"
                                title="إرسال تنبيه رسمي إلى لوحة الإشعارات"
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  send
                                </span>
                                <span>إرسال تنبيه للإشعارات</span>
                              </button>
                            </>
                          ) : (
                            <span className="bg-surface-container-high text-on-surface-variant text-[11px] px-2.5 py-0.5 rounded-md font-mono">
                              {row.absenceDaysCount || 0} أيام غياب
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-on-surface-variant">
                        <input
                          type="text"
                          value={row.note || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttendanceList((prev) =>
                              prev.map((item) =>
                                item.id === row.id ? { ...item, note: val } : item
                              )
                            );
                          }}
                          placeholder="أضف ملاحظة..."
                          className="w-full bg-transparent border-b border-dashed border-surface-container-high focus:border-primary outline-none py-1 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}

                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-on-surface-variant">
                          search_off
                        </span>
                        <div className="font-bold text-on-surface">
                          لا توجد نتائج مطابقة لبحثك في سجل الحضور
                        </div>
                        {attendanceSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setAttendanceSearchQuery("")}
                            className="mt-1 px-3 py-1 text-xs bg-primary text-on-primary rounded-lg font-bold cursor-pointer"
                          >
                            مسح حقل البحث وإظهار الجميع
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. Teacher Schedule & Staff Module
  if (moduleKey === "staff" || moduleKey === "teacher-schedule") {
    const scheduleDays = [
      {
        day: "الأحد",
        p1: "الخامس العلمي (أ)",
        p2: "السادس العلمي (أ)",
        p3: "استراحة / إشراف علمي",
        p4: "الخامس العلمي (ب)",
        p5: "السادس العلمي (ب)",
      },
      {
        day: "الإثنين",
        p1: "السادس العلمي (أ)",
        p2: "الخامس العلمي (أ)",
        p3: "السادس العلمي (ب)",
        p4: "استراحة",
        p5: "الرابع العلمي (أ)",
      },
      {
        day: "الثلاثاء",
        p1: "الخامس العلمي (ب)",
        p2: "استراحة",
        p3: "الخامس العلمي (أ)",
        p4: "السادس العلمي (أ)",
        p5: "لجنة تدقيق الدرجات",
      },
      {
        day: "الأربعاء",
        p1: "السادس العلمي (ب)",
        p2: "الخامس العلمي (أ)",
        p3: "السادس العلمي (أ)",
        p4: "الرابع العلمي (أ)",
        p5: "استراحة",
      },
      {
        day: "الخميس",
        p1: "الخامس العلمي (أ)",
        p2: "الخامس العلمي (ب)",
        p3: "اجتماع القسم العلمي",
        p4: "السادس العلمي (أ)",
        p5: "نشاط لا صفي",
      },
    ];

    return (
      <div className="flex flex-col w-full gap-space-lg">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">
              {userRole === "teacher"
                ? `جدول الحصص الأسبوعي للمدرس — مادة ${teacherSubject}`
                : "سجل ملاك الكادر التدريسي وجدول الحصص الأسبوعي"}
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              النصاب التدريسي المعتمد: 18 حصة أسبوعياً • العام الدراسي 2024-2025
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تجهيز جدول الحصص الأسبوعي للطباعة");
            }}
            className="bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-md text-label-md flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>طباعة الجدول الأسبوعي</span>
          </button>
        </div>

        {/* Weekly Schedule Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="px-space-lg py-space-md bg-surface-container-high/40 flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-primary">
              جدول توزيع الحصص الأسبوعي على الصفوف ({teacherSubject})
            </span>
            <span className="text-xs font-bold text-secondary bg-secondary-container px-2.5 py-1 rounded">
              معتمد من إدارة المدرسة
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-surface-container text-primary font-table-header text-table-header h-12">
                  <th className="px-4">اليوم الدراسي</th>
                  <th className="px-4">الحصة الأولى (8:00)</th>
                  <th className="px-4">الحصة الثانية (8:50)</th>
                  <th className="px-4">الحصة الثالثة (9:40)</th>
                  <th className="px-4">الحصة الرابعة (10:40)</th>
                  <th className="px-4">الحصة الخامسة (11:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-table-data text-table-data">
                {scheduleDays.map((d) => (
                  <tr key={d.day} className="hover:bg-surface-container-low">
                    <td className="px-4 py-3 font-bold text-primary bg-surface-container-low/60">
                      {d.day}
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {d.p1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {d.p2}
                    </td>
                    <td className="px-4 py-3 text-secondary font-semibold">
                      {d.p3}
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {d.p4}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {d.p5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dedicated Finance & Accounting Module (Accountant sees ONLY this section!)
  if (moduleKey === "finance") {
    return (
      <div className="flex flex-col w-full gap-space-lg">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">
                payments
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg text-primary">
                  منظومة الحسابات والرسوم والوصولات المالية
                </h1>
                {userRole === "accountant" && (
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2.5 py-0.5 rounded">
                    بوابة المحاسب المالي المعتمدة (صلاحية حصرية)
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                سجل محاسبة ٣٧ أ • الوصولات الرسمية، الأمانات المدرسية، وأقساط
                المراحل (الابتدائية • المتوسطة • الإعدادية)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.print();
                onNotify("جاري طباعة الكشف المالي اليومي بصيغة A4");
              }}
              className="px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md text-label-md flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                print
              </span>
              <span>طباعة الكشف المالي</span>
            </button>
          </div>
        </div>

        {/* Accounting KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">
              إجمالي المقبوضات الفصلية
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              18,450,000
            </span>
            <span className="font-body-sm text-body-sm text-[#2E7D32] block">
              دينار عراقي (مُودع في المصرف الحكومي)
            </span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">
              الرسوم والأمانات المستحقة
            </span>
            <span className="font-headline-xl text-headline-xl text-secondary font-bold tabular-nums">
              4,350,000
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant block">
              دينار عراقي قيد التحصيل
            </span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">
              عدد الوصولات المقطوعة
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              {940 + receipts.length}
            </span>
            <span className="font-body-sm text-body-sm text-secondary block">
              وصل قبض رسمي موثق
            </span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">
              نسبة التحصيل المالي
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              82%
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant block">
              مطابق لسجل التفتيش المالي
            </span>
          </div>
        </div>

        {/* Issue New Official Receipt Form */}
        <form
          onSubmit={handleAddReceipt}
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-3"
        >
          <div className="font-headline-sm text-headline-sm text-primary font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px]">
              receipt_long
            </span>
            <span>إصدار وصل قبض مالي جديد</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block font-label-sm text-label-sm mb-1">
                اسم الطالب الرباعي
              </label>
              <input
                type="text"
                value={newReceiptStudent}
                onChange={(e) => setNewReceiptStudent(e.target.value)}
                placeholder="أدخل اسم الطالب..."
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm mb-1">
                المرحلة الدراسية
              </label>
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value as StageKey)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg outline-none cursor-pointer"
              >
                <option value="primary">المرحلة الابتدائية</option>
                <option value="intermediate">المرحلة المتوسطة</option>
                <option value="preparatory">المرحلة الإعدادية</option>
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm mb-1">
                الصف ({STAGE_LABELS[stage]})
              </label>
              <select
                value={gradeCode}
                onChange={(e) => setGradeCode(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg outline-none cursor-pointer"
              >
                {STAGE_GRADES[stage].map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm mb-1">
                المبلغ المقبوض (د.ع)
              </label>
              <input
                type="text"
                value={newReceiptAmount}
                onChange={(e) => setNewReceiptAmount(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-mono font-bold text-primary outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full h-10 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-label-md cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_card
                </span>
                <span>قطع وصل قبض</span>
              </button>
            </div>
          </div>
        </form>

        {/* Financial Receipts Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="px-space-lg py-space-md bg-surface-container-high/40 flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-primary">
              سجل الوصولات المالية المصدقة
            </span>
            <span className="text-xs font-bold text-secondary">
              تحديث فوري مع الصندوق المدرسي
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-surface-container text-primary font-table-header text-table-header h-12">
                  <th className="px-4">رقم الوصل</th>
                  <th className="px-4">الرقم الإداري</th>
                  <th className="px-4">اسم الطالب</th>
                  <th className="px-4">الصف والشعبة</th>
                  <th className="px-4">تبويب القبض</th>
                  <th className="px-4">المبلغ</th>
                  <th className="px-4">التاريخ</th>
                  <th className="px-4 text-center">الحالة</th>
                  <th className="px-4 text-center">طباعة الوصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-table-data text-table-data">
                {receipts.map((rec) => (
                  <tr
                    key={rec.receiptNo}
                    className="hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {rec.receiptNo}
                    </td>
                    <td className="px-4 py-3 font-mono text-secondary text-xs">
                      {rec.adminId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {rec.studentName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {rec.stageGrade}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {rec.category}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {rec.amount}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {rec.date}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          window.print();
                          onNotify(
                            `تم طباعة وصل القبض المالي رقم ${rec.receiptNo}`
                          );
                        }}
                        className="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-primary cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          print
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const titles: Record<
    string,
    { title: string; subtitle: string; icon: string }
  > = {
    "academic-setup": {
      title: "التهيئة الأكاديمية وتوزيع المراحل الدراسية",
      subtitle:
        "إعداد العام الدراسي 2024 - 2025 للمراحل (الابتدائية • المتوسطة • الإعدادية)",
      icon: "account_balance",
    },
    "reports-and-settings": {
      title: "التقارير الوزارية والإعدادات المركزية",
      subtitle:
        "إعدادات الربط الشبكي مع مديرية تربية بغداد / الكرخ الأولى والنسخ الاحتياطي",
      icon: "settings",
    },
  };

  const info = titles[moduleKey] || titles["academic-setup"];

  return (
    <div className="flex flex-col w-full gap-space-lg">
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[28px]">
              {info.icon}
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">
              {info.title}
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {info.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md text-label-md cursor-pointer"
          >
            العودة للرئيسية
          </button>
          <button
            type="button"
            onClick={() =>
              onNotify("تم حفظ الإعدادات ومزامنتها مع الخادم المركزي")
            }
            className="px-space-lg py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-label-md cursor-pointer"
          >
            حفظ ومزامنة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            المرحلة الابتدائية
          </span>
          <span className="font-headline-md text-headline-md text-primary font-bold">
            الصفوف: الأول إلى السادس الابتدائي
          </span>
          <span className="font-body-sm text-body-sm text-secondary">
            مفعلة ومرتبطة بالسجل العام وقسم الصفوف
          </span>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            المرحلة المتوسطة
          </span>
          <span className="font-headline-md text-headline-md text-primary font-bold">
            الصفوف: الأول إلى الثالث المتوسط
          </span>
          <span className="font-body-sm text-body-sm text-secondary">
            مفعلة ومرتبطة بسجل الدرجات والامتحانات
          </span>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            المرحلة الإعدادية
          </span>
          <span className="font-headline-md text-headline-md text-primary font-bold">
            الصفوف: الرابع إلى السادس (علمي / أدبي)
          </span>
          <span className="font-body-sm text-body-sm text-secondary">
            مفعلة ومرتبطة باستمارة رقم ٤٤ / تقويم
          </span>
        </div>
      </div>
    </div>
  );
};
