import React, { useState, useMemo } from "react";
import {
  ClassWeeklySchedule,
  INITIAL_STAFF_MEMBERS,
  INITIAL_WEEKLY_SCHEDULES,
  PeriodSlot,
  PERIOD_TIMES,
  ScheduleDay,
  SCHEDULE_DAYS,
  SchoolConfig,
  StaffMember,
  SUBJECTS_BY_STAGE,
} from "../data/mockData";
import { UserRole } from "./LoginView";

interface WeeklyScheduleViewProps {
  onNotify: (msg: string) => void;
  onNavigate: (path: string) => void;
  schoolConfig: SchoolConfig;
  userRole?: UserRole;
  currentTeacherName?: string;
  teacherSubject?: string;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  onNotify,
  onNavigate,
  schoolConfig,
  userRole = "principal",
  currentTeacherName = "أ. حامد جاسم الشمري",
  teacherSubject = "الرياضيات (Mathematics)",
}) => {
  // Load schedules from localStorage or fallback
  const [schedules, setSchedules] = useState<ClassWeeklySchedule[]>(() => {
    const saved = localStorage.getItem("school_weekly_schedules");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_WEEKLY_SCHEDULES;
      }
    }
    return INITIAL_WEEKLY_SCHEDULES;
  });

  const saveSchedules = (updated: ClassWeeklySchedule[]) => {
    setSchedules(updated);
    try {
      localStorage.setItem("school_weekly_schedules", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Staff members (for teacher dropdown in editor)
  const staffList: StaffMember[] = useMemo(() => {
    const saved = localStorage.getItem("school_staff_registry");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STAFF_MEMBERS;
      }
    }
    return INITIAL_STAFF_MEMBERS;
  }, []);

  const teachersOnly = useMemo(() => {
    return staffList.filter((m) => m.category === "teacher");
  }, [staffList]);

  // Selected Classroom or Teacher View
  const [viewMode, setViewMode] = useState<"by_class" | "by_teacher">(
    userRole === "teacher" ? "by_teacher" : "by_class"
  );
  const [selectedClassId, setSelectedClassId] = useState<string>("cls-5s-a");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(
    userRole === "teacher" ? currentTeacherName : "أ. حامد جاسم الشمري"
  );

  // Edit Cell Modal State
  const [editingSlot, setEditingSlot] = useState<{
    classId: string;
    day: ScheduleDay;
    periodIndex: number;
    currentPeriod: PeriodSlot;
  } | null>(null);

  const [editFormData, setEditFormData] = useState<{
    subject: string;
    teacherName: string;
    room: string;
    isBreak: boolean;
    notes: string;
  }>({
    subject: "",
    teacherName: "",
    room: "",
    isBreak: false,
    notes: "",
  });

  // Active Schedule
  const activeClassSchedule = useMemo(() => {
    return (
      schedules.find((s) => s.classId === selectedClassId) ||
      schedules[0] || {
        classId: "cls-5s-a",
        classroom: "الخامس العلمي (أ)",
        stage: "preparatory",
        gradeCode: "5s",
        days: [],
      }
    );
  }, [schedules, selectedClassId]);

  // Teacher Schedule View Builder
  const activeTeacherSchedule = useMemo(() => {
    // Collect all periods where this teacher is assigned across ALL classes
    const dayMap: Record<ScheduleDay, PeriodSlot[]> = {
      الأحد: [],
      الإثنين: [],
      الثلاثاء: [],
      الأربعاء: [],
      الخميس: [],
    };

    SCHEDULE_DAYS.forEach((day) => {
      dayMap[day] = PERIOD_TIMES.map((pt) => {
        // find if any class has this teacher at this day & periodIndex
        let assignedSlot: PeriodSlot = {
          periodIndex: pt.index,
          timeLabel: pt.time,
          subject: "فراغ / إشراف",
          teacherName: selectedTeacherName,
          room: "غرفة المدرسين",
          isBreak: true,
        };

        for (const cls of schedules) {
          const dObj = cls.days.find((d) => d.day === day);
          if (dObj) {
            const matchP = dObj.periods.find(
              (p) =>
                p.periodIndex === pt.index &&
                p.teacherName.trim().toLowerCase() === selectedTeacherName.trim().toLowerCase()
            );
            if (matchP) {
              assignedSlot = {
                ...matchP,
                room: `${cls.classroom} • ${matchP.room}`,
                isBreak: false,
              };
              break;
            }
          }
        }
        return assignedSlot;
      });
    });

    return dayMap;
  }, [schedules, selectedTeacherName]);

  // Conflict Checker
  const checkTeacherConflict = (day: ScheduleDay, periodIndex: number, teacher: string, currentClassId: string) => {
    if (!teacher || teacher === "مشرف النشاط" || teacher === "إدارة المدرسة") return null;
    for (const cls of schedules) {
      if (cls.classId === currentClassId) continue;
      const d = cls.days.find((x) => x.day === day);
      if (d) {
        const conflictP = d.periods.find(
          (p) => p.periodIndex === periodIndex && p.teacherName.trim() === teacher.trim() && !p.isBreak
        );
        if (conflictP) {
          return `تنبيه: الأستاذ (${teacher}) لديه حصة (${conflictP.subject}) في نفس التوقيت في صف (${cls.classroom})!`;
        }
      }
    }
    return null;
  };

  const conflictWarning = useMemo(() => {
    if (!editingSlot || editFormData.isBreak) return null;
    return checkTeacherConflict(
      editingSlot.day,
      editingSlot.periodIndex,
      editFormData.teacherName,
      editingSlot.classId
    );
  }, [editingSlot, editFormData]);

  // Open Edit Modal
  const handleOpenEditCell = (day: ScheduleDay, periodIndex: number, currentPeriod: PeriodSlot) => {
    if (userRole === "teacher") {
      onNotify("تعديل الجدول متاح لمدير المدرسة ومعاون شؤون الطلبة فقط");
      return;
    }
    setEditingSlot({
      classId: selectedClassId,
      day,
      periodIndex,
      currentPeriod,
    });
    setEditFormData({
      subject: currentPeriod.subject,
      teacherName: currentPeriod.teacherName,
      room: currentPeriod.room,
      isBreak: currentPeriod.isBreak || false,
      notes: currentPeriod.notes || "",
    });
  };

  // Save Edit
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const updated = schedules.map((cls) => {
      if (cls.classId !== editingSlot.classId) return cls;

      const updatedDays = cls.days.map((d) => {
        if (d.day !== editingSlot.day) return d;

        const updatedPeriods = d.periods.map((p) => {
          if (p.periodIndex !== editingSlot.periodIndex) return p;
          return {
            ...p,
            subject: editFormData.isBreak ? "استراحة / نشاط" : editFormData.subject,
            teacherName: editFormData.isBreak ? "مشرف النشاط" : editFormData.teacherName,
            room: editFormData.room,
            isBreak: editFormData.isBreak,
            notes: editFormData.notes,
          };
        });

        return { ...d, periods: updatedPeriods };
      });

      return { ...cls, days: updatedDays };
    });

    saveSchedules(updated);
    onNotify(
      `تم تحديث الحصة ${editingSlot.periodIndex} ليوم ${editingSlot.day} لصف ${activeClassSchedule.classroom}`
    );
    setEditingSlot(null);
  };

  // Clear slot
  const handleClearSlot = () => {
    if (!editingSlot) return;
    const updated = schedules.map((cls) => {
      if (cls.classId !== editingSlot.classId) return cls;
      const updatedDays = cls.days.map((d) => {
        if (d.day !== editingSlot.day) return d;
        const updatedPeriods = d.periods.map((p) => {
          if (p.periodIndex !== editingSlot.periodIndex) return p;
          return {
            ...p,
            subject: "شاغرة / غير محددة",
            teacherName: "-",
            room: "قاعة الصف",
            isBreak: true,
            notes: "حصة شاغرة",
          };
        });
        return { ...d, periods: updatedPeriods };
      });
      return { ...cls, days: updatedDays };
    });
    saveSchedules(updated);
    onNotify("تم تفريغ الحصة بنجاح");
    setEditingSlot(null);
  };

  // Reset to default template
  const handleResetSchedule = () => {
    if (window.confirm("هل أنت متأكد من استعادة الجدول الأسبوعي الافتراضي لكافة الصفوف؟")) {
      saveSchedules(INITIAL_WEEKLY_SCHEDULES);
      onNotify("تمت استعادة الجدول الأسبوعي المعتمد بنجاح");
    }
  };

  // Export to Excel
  const handleExportScheduleExcel = () => {
    const headers = [
      "الصف",
      "اليوم",
      "الحصة 1 (08:00 - 08:45)",
      "الحصة 2 (08:50 - 09:35)",
      "الحصة 3 (09:40 - 10:25)",
      "الحصة 4 (10:45 - 11:30)",
      "الحصة 5 (11:35 - 12:20)",
      "الحصة 6 (12:25 - 01:10)",
    ];

    const rows: string[][] = [];
    if (viewMode === "by_class") {
      activeClassSchedule.days.forEach((d) => {
        const pTexts = d.periods.map((p) => `${p.subject} (${p.teacherName})`);
        rows.push([activeClassSchedule.classroom, d.day, ...pTexts]);
      });
    } else {
      SCHEDULE_DAYS.forEach((day) => {
        const periods = activeTeacherSchedule[day];
        const pTexts = periods.map((p) => (p.isBreak ? "فراغ" : `${p.subject} [${p.room}]`));
        rows.push([selectedTeacherName, day, ...pTexts]);
      });
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `جدول_الحصص_الأسبوعي_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("تم تصدير الجدول الأسبوعي إلى Excel بنجاح");
  };

  const allAvailableSubjects = Array.from(
    new Set([
      ...SUBJECTS_BY_STAGE.preparatory,
      ...SUBJECTS_BY_STAGE.intermediate,
      ...SUBJECTS_BY_STAGE.primary,
      "الحاسوب",
      "التربية الرياضية",
      "التربية الفنية",
      "حل أسئلة وزارية ونماذج",
      "إرشاد تربوي ونشاط",
    ])
  );

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
            <div className="text-xs font-bold mt-1">
              جدول الحصص الأسبوعي المعتمد —{" "}
              {viewMode === "by_class" ? activeClassSchedule.classroom : `الأستاذ: ${selectedTeacherName}`}
            </div>
          </div>
          <div className="text-left text-xs space-y-1">
            <img
              src={schoolConfig.schoolLogoUrl}
              alt="شعار المدرسة"
              className="w-12 h-12 object-contain ml-auto"
            />
            <div>تاريخ الاعتماد: 2024/10/01</div>
            <div className="font-mono">الكود: {schoolConfig.schoolCode}</div>
          </div>
        </div>
      </div>

      {/* Main Top Banner (No Print) */}
      <div className="no-print bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high/60 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[32px]">calendar_month</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
                جدول الحصص الأسبوعي (قابل للتعديل)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32]">
                معتمد وقابل للتحرير
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              توزيع الحصص اليومية، تعيين الأساتذة، كشف التضارب وتصدير الجداول الرسمية • {schoolConfig.schoolName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {userRole !== "teacher" && (
            <button
              type="button"
              onClick={handleResetSchedule}
              className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-xl font-label-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="إعادة ضبط الجدول للنموذج المقترح"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>استعادة الافتراضي</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportScheduleExcel}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تحضير جدول الحصص الأسبوعي للطباعة الرسمية");
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>طباعة الجدول الأسبوعي</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Selector Bar (No Print) */}
      <div className="no-print bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode("by_class")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "by_class"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            <span>عرض حسب الصف والشعبة</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("by_teacher")}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "by_teacher"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>عرض حسب المدرس المختص</span>
          </button>
        </div>

        {/* Dynamic Selector based on ViewMode */}
        <div className="flex items-center gap-3">
          {viewMode === "by_class" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
                اختر الصف والشعبة:
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-10 px-3 bg-surface-container-low rounded-xl text-xs font-bold text-primary outline-none border border-surface-container-high cursor-pointer"
              >
                {schedules.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.classroom} ({cls.days.length} أيام أسبوعياً)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
                اختر المدرس:
              </span>
              <select
                value={selectedTeacherName}
                onChange={(e) => setSelectedTeacherName(e.target.value)}
                className="h-10 px-3 bg-surface-container-low rounded-xl text-xs font-bold text-primary outline-none border border-surface-container-high cursor-pointer"
              >
                {teachersOnly.map((t) => (
                  <option key={t.id} value={t.fullName}>
                    {t.fullName} — ({t.subjectSpecialization})
                  </option>
                ))}
              </select>
            </div>
          )}

          {userRole !== "teacher" && (
            <div className="text-xs text-secondary font-bold flex items-center gap-1 bg-secondary/10 px-3 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[16px]">touch_app</span>
              <span>انقر على أي حصة لتعديلها فوراً</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/60 overflow-hidden">
        {/* Table Title Bar */}
        <div className="px-6 py-4 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">event_note</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary">
              {viewMode === "by_class"
                ? `جدول حصص: ${activeClassSchedule.classroom}`
                : `جدول الحصص للأستاذ: ${selectedTeacherName}`}
            </span>
          </div>
          <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-lg">
            العام الدراسي: {schoolConfig.academicYear} • الدوام الصباحي
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-surface-container-high/60 text-primary font-bold text-xs h-14 border-b border-surface-container-high">
                <th className="px-4 py-2 w-28 text-center border-l border-surface-container">
                  اليوم الدراسي
                </th>
                {PERIOD_TIMES.map((pt) => (
                  <th
                    key={pt.index}
                    className="px-3 py-2 text-center border-l border-surface-container last:border-l-0"
                  >
                    <div className="font-black text-sm">{pt.label}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant font-normal">
                      {pt.time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs font-medium">
              {SCHEDULE_DAYS.map((dayName) => {
                const dayPeriods: PeriodSlot[] =
                  viewMode === "by_class"
                    ? activeClassSchedule.days.find((d) => d.day === dayName)?.periods || []
                    : activeTeacherSchedule[dayName] || [];

                return (
                  <tr key={dayName} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* Day Column */}
                    <td className="px-4 py-4 font-black text-center text-primary bg-surface-container-low/80 border-l border-surface-container">
                      <div className="text-sm font-bold">{dayName}</div>
                    </td>

                    {/* Periods 1 to 6 */}
                    {PERIOD_TIMES.map((pt) => {
                      const period =
                        dayPeriods.find((p) => p.periodIndex === pt.index) || {
                          periodIndex: pt.index,
                          timeLabel: pt.time,
                          subject: "شاغرة",
                          teacherName: "-",
                          room: "-",
                          isBreak: true,
                        };

                      const isClickable = userRole !== "teacher" && viewMode === "by_class";

                      return (
                        <td
                          key={pt.index}
                          onClick={() => {
                            if (isClickable) {
                              handleOpenEditCell(dayName, pt.index, period);
                            }
                          }}
                          className={`px-3 py-3 text-center border-l border-surface-container last:border-l-0 transition-all ${
                            isClickable ? "cursor-pointer hover:bg-primary/5 group" : ""
                          } ${
                            period.isBreak
                              ? "bg-surface-container-low/40"
                              : "bg-surface-container-lowest"
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl transition-transform group-hover:scale-[1.02]">
                            {/* Subject Badge */}
                            <span
                              className={`text-xs font-bold leading-tight block mb-1 px-2 py-0.5 rounded-md ${
                                period.isBreak
                                  ? "text-outline bg-surface-container"
                                  : "text-primary bg-primary/10"
                              }`}
                            >
                              {period.subject}
                            </span>

                            {/* Teacher Name */}
                            <span className="text-[11px] font-semibold text-on-surface block leading-tight">
                              {period.teacherName}
                            </span>

                            {/* Room */}
                            {period.room && (
                              <span className="text-[10px] text-on-surface-variant font-mono mt-0.5 block">
                                {period.room}
                              </span>
                            )}

                            {/* Edit Icon on Hover */}
                            {isClickable && (
                              <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 mt-1 transition-opacity">
                                edit
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend / Footer Note */}
        <div className="p-4 bg-surface-container-low/50 border-t border-surface-container flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary"></span>
              <span>حصة دراسية منهجية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-surface-container border border-outline"></span>
              <span>استراحة / نشاط / حصة شاغرة</span>
            </div>
          </div>
          <span className="text-secondary font-bold">
            ملاحظة: مدة الحصة 45 دقيقة • استراحة الفسحة الكبرى بين الحصة الثالثة والرابعة (20 دقيقة)
          </span>
        </div>
      </div>

      {/* Official Signatures for Printouts (Print Only) */}
      <div className="hidden print:flex items-center justify-between pt-8 border-t border-stone-800 text-xs mt-8">
        <div className="text-center">
          <div className="font-bold">منظم الجدول الأسبوعي</div>
          <div className="mt-8 text-stone-500">التوقيع: .....................</div>
        </div>
        <div className="text-center">
          <div className="font-bold">معاون المدير للشؤون العلمية</div>
          <div className="mt-8 font-semibold">{schoolConfig.vicePrincipalName}</div>
        </div>
        <div className="text-center">
          <div className="font-bold">مدير المدرسة</div>
          <div className="mt-8 font-bold">{schoolConfig.principalName}</div>
          <div className="text-[10px] text-stone-500">(الختم الرسمي)</div>
        </div>
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-auto">
            {/* Header */}
            <div className="px-6 py-4 bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">edit_calendar</span>
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  تعديل الحصة {editingSlot.periodIndex} ({editingSlot.day}) — {activeClassSchedule.classroom}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 text-xs">
              {/* Conflict Alert if any */}
              {conflictWarning && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* Toggle Break / Class */}
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <input
                  type="checkbox"
                  id="isBreakSlot"
                  checked={editFormData.isBreak}
                  onChange={(e) => setEditFormData({ ...editFormData, isBreak: e.target.checked })}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <label htmlFor="isBreakSlot" className="font-bold text-on-surface cursor-pointer">
                  حصة استراحة / نشاط لا صفي / اجتماع مجلس مدرسين
                </label>
              </div>

              {!editFormData.isBreak && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-primary">المادة الدراسية *</label>
                    <select
                      value={editFormData.subject}
                      onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-bold text-xs cursor-pointer"
                    >
                      {allAvailableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-primary">الأستاذ / المعلم المكلف *</label>
                    <select
                      value={editFormData.teacherName}
                      onChange={(e) => setEditFormData({ ...editFormData, teacherName: e.target.value })}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-bold text-xs cursor-pointer"
                    >
                      {teachersOnly.map((t) => (
                        <option key={t.id} value={t.fullName}>
                          {t.fullName} ({t.subjectSpecialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-on-surface">القاعة / المختبر المخصص</label>
                    <input
                      type="text"
                      value={editFormData.room}
                      onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                      placeholder="مثال: قاعة 101، مختبر الفيزياء..."
                      className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-bold text-on-surface">ملاحظات إضافية على الحصة</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="مثال: مراجعة شاملة، امتحان يومي، درس إضافي..."
                  className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-surface-container flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClearSlot}
                  className="text-error font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>تفريغ الحصة</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold shadow-sm cursor-pointer"
                  >
                    حفظ الحصة
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
