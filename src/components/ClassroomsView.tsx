import React, { useState } from "react";
import {
  ALL_GRADES,
  GradeOption,
  STAGE_GRADES,
  STAGE_LABELS,
  StageKey,
  StudentRecord,
} from "../data/mockData";

interface ClassroomsViewProps {
  students: StudentRecord[];
  onAddStudent: (newStudent: StudentRecord) => void;
  onDeleteStudent?: (studentId: string) => void;
  onNavigate: (path: string) => void;
  onNotify: (msg: string) => void;
}

export const ClassroomsView: React.FC<ClassroomsViewProps> = ({
  students,
  onAddStudent,
  onDeleteStudent,
  onNavigate,
  onNotify,
}) => {
  const [stageFilter, setStageFilter] = useState<StageKey | "">("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<GradeOption | null>(null);

  // Quick Add Student inside a specific class
  const [newStudentName, setNewStudentName] = useState<string>("");
  const [newStudentAdminId, setNewStudentAdminId] = useState<string>("");
  const [newStudentSection, setNewStudentSection] = useState<string>("أ");
  const [newGuardianPhone, setNewGuardianPhone] = useState<string>("");

  // Dynamic Stage -> Grade cascading
  const availableGrades = stageFilter ? STAGE_GRADES[stageFilter] : ALL_GRADES;

  const handleStageChange = (val: string) => {
    const nextStage = val as StageKey | "";
    setStageFilter(nextStage);
    setGradeFilter("");
  };

  // Classes to display based on stage/grade filter
  const visibleClasses = availableGrades.filter((g) => {
    if (gradeFilter && g.code !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const classMatches = g.label.toLowerCase().includes(q);
      const studentMatches = students.some(
        (s) =>
          s.gradeCode === g.code &&
          (s.fullName.toLowerCase().includes(q) ||
            s.adminId.toLowerCase().includes(q) ||
            s.ministryId.toLowerCase().includes(q))
      );
      return classMatches || studentMatches;
    }
    return true;
  });

  const handleQuickAddStudentToClass = (
    e: React.FormEvent,
    targetClass: GradeOption
  ) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      onNotify("يرجى كتابة اسم الطالب الرباعي واللقب");
      return;
    }
    const nextNum = students.length + 1;
    const seqStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const randomMinistry = Math.floor(5000 + Math.random() * 4900);
    const secCode =
      newStudentSection === "ب"
        ? "b"
        : newStudentSection === "ج"
        ? "c"
        : newStudentSection === "د"
        ? "d"
        : "a";

    const defaultAvatar =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

    const created: StudentRecord = {
      id: `st-cls-${Date.now()}`,
      seq: seqStr,
      avatar: (students && students.length > 0 && students[0]?.avatar && students[0]?.avatar !== "") ? students[0].avatar : defaultAvatar,
      avatarAlt: "صورة الطالب",
      fullName: newStudentName.trim(),
      birthInfo: "تولد: بغداد/الكرخ",
      ministryId: `IQ-2024-${randomMinistry}`,
      adminId: newStudentAdminId.trim() || `ADM-2024-${1000 + nextNum}`,
      nationalId: `1910${Math.floor(1000000 + Math.random() * 8999999)}`,
      gradeSection: `${targetClass.label} (${newStudentSection})`,
      stageCode: targetClass.stage,
      gradeCode: targetClass.code,
      sectionCode: secCode,
      guardianName: "ولي أمر الطالب",
      guardianPhone: newGuardianPhone.trim() || "+964 771 000 1122",
      statusLabel: "مستمر بالدوام",
      statusType: "active",
      registrationDate: "2024/10/15",
      address: "العراق - بغداد",
    };

    onAddStudent(created);
    setNewStudentName("");
    setNewStudentAdminId("");
    setNewGuardianPhone("");
    onNotify(
      `تمت إضافة الطالب (${created.fullName}) مباشرةً داخل صف ${targetClass.label}`
    );
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Header */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[28px]">
              groups
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-primary">
                قسم الصفوف الدراسية وقوائم الطلاب
              </h1>
              <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-space-sm py-0.5 rounded">
                الابتدائية • المتوسطة • الإعدادية
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              عرض جميع الصفوف الدراسية وبداخل كل صف قائمة الطلاب المسجلين فيه فقط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("جاري طباعة قوائم الصفوف والطلاب");
            }}
            className="flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>طباعة قوائم الصفوف</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("students")}
            className="flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary px-space-lg py-2.5 rounded-lg font-label-md text-label-md shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              person_add
            </span>
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Stage & Grade Filter Bar (Dynamic Cascading) */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
        <div className="md:col-span-5 relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الصف أو اسم الطالب أو الرقم الإداري..."
            className="w-full h-11 pr-10 pl-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448]"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={stageFilter}
            onChange={(e) => handleStageChange(e.target.value)}
            className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] cursor-pointer"
          >
            <option value="">كافة المراحل الدراسية</option>
            <option value="primary">المرحلة الابتدائية</option>
            <option value="intermediate">المرحلة المتوسطة</option>
            <option value="preparatory">المرحلة الإعدادية</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] cursor-pointer"
          >
            <option value="">
              {stageFilter
                ? `صفوف ${STAGE_LABELS[stageFilter]}`
                : "كافة الصفوف الدراسية"}
            </option>
            {availableGrades.map((g) => (
              <option key={g.code} value={g.code}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setStageFilter("");
              setGradeFilter("");
              setSearchQuery("");
            }}
            title="إعادة ضبط"
            className="w-full h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              restart_alt
            </span>
          </button>
        </div>
      </div>

      {/* Classes Grid — Each Class contains ONLY its Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
        {visibleClasses.map((cls) => {
          const classStudents = students.filter(
            (s) => s.gradeCode === cls.code
          );

          return (
            <div
              key={cls.code}
              className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high hover:border-primary transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Class Header */}
              <div className="bg-surface-container-low px-space-md py-space-sm border-b border-surface-container-high flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    صف {cls.label}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {STAGE_LABELS[cls.stage]}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold tabular-nums">
                  {classStudents.length} طالب
                </span>
              </div>

              {/* Students List Inside the Class (الطلاب فقط داخل كل صف) */}
              <div className="p-space-md flex-1 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {classStudents.length > 0 ? (
                  classStudents.map((st, idx) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-outline w-5 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={st.avatar}
                          alt={st.fullName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-sm text-label-sm text-primary font-bold truncate">
                            {st.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-secondary">
                            الإداري: {st.adminId}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-label-sm text-[11px] shrink-0">
                          شعبة ({st.sectionCode === "a" ? "أ" : st.sectionCode === "b" ? "ب" : st.sectionCode === "c" ? "ج" : "د"})
                        </span>
                        {onDeleteStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`هل أنت متأكد من حذف قيد الطالب (${st.fullName}) نهائياً من المنظومة وقاعدة البيانات؟`)) {
                                onDeleteStudent(st.id);
                                onNotify(`تم حذف الطالب (${st.fullName}) ومزامنة التغيير سحابياً`);
                              }
                            }}
                            title="حذف الطالب من الصف"
                            className="p-1 rounded text-error hover:bg-error/10 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-on-surface-variant font-body-sm flex flex-col items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-outline text-[28px]">
                      person_off
                    </span>
                    <span>لا يوجد طلاب مضافون حالياً في هذا الصف</span>
                  </div>
                )}
              </div>

              {/* Class Footer Actions */}
              <div className="px-space-md py-space-sm bg-surface-container-low border-t border-surface-container flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className="text-label-sm font-label-sm text-primary hover:text-secondary font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    groups
                  </span>
                  <span>عرض وإدارة طلاب الصف ({classStudents.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-bold cursor-pointer"
                >
                  + إضافة طالب للصف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: View & Add Students Inside Selected Class */}
      {selectedClass && (() => {
        const classStudents = students.filter(
          (s) => s.gradeCode === selectedClass.code
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/40 backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    طلاب صف {selectedClass.label} ({STAGE_LABELS[selectedClass.stage]})
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    إجمالي الطلاب المسجلين داخل هذا الصف: {classStudents.length} طالب
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    close
                  </span>
                </button>
              </div>

              <div className="p-space-lg overflow-y-auto space-y-4">
                {/* Quick Form to Add a Student Directly Into This Class */}
                <form
                  onSubmit={(e) => handleQuickAddStudentToClass(e, selectedClass)}
                  className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high space-y-2.5"
                >
                  <div className="font-label-sm text-label-sm text-primary font-bold">
                    إضافة طالب جديد مباشرةً إلى صف {selectedClass.label}:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="الاسم الرباعي واللقب *"
                      className="h-9 px-3 bg-surface-container-lowest rounded-lg text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={newStudentAdminId}
                      onChange={(e) => setNewStudentAdminId(e.target.value)}
                      placeholder="الرقم الإداري (مثال: ADM-24-99)"
                      className="h-9 px-3 bg-surface-container-lowest rounded-lg text-xs font-mono outline-none"
                    />
                    <select
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      className="h-9 px-2 bg-surface-container-lowest rounded-lg text-xs outline-none cursor-pointer"
                    >
                      <option value="أ">الشعبة (أ)</option>
                      <option value="ب">الشعبة (ب)</option>
                      <option value="ج">الشعبة (ج)</option>
                      <option value="د">الشعبة (د)</option>
                    </select>
                    <button
                      type="submit"
                      className="h-9 bg-primary text-on-primary rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + إضافة للطالب بالصف
                    </button>
                  </div>
                </form>

                {/* Students Table Inside This Class */}
                <div className="border border-surface-container-high rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container text-primary font-bold h-10">
                        <th className="px-3 text-center w-10">ت</th>
                        <th className="px-3">اسم الطالب الرباعي واللقب</th>
                        <th className="px-3">الرقم الإداري</th>
                        <th className="px-3">الرقم الإحصائي</th>
                        <th className="px-3">الشعبة</th>
                        <th className="px-3">ولي الأمر والهاتف</th>
                        <th className="px-3 text-center">الحالة</th>
                        <th className="px-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {classStudents.length > 0 ? (
                        classStudents.map((st, i) => (
                          <tr
                            key={st.id}
                            className="hover:bg-surface-container-low"
                          >
                            <td className="px-3 py-2.5 text-center font-mono font-bold">
                              {i + 1}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-primary">
                              {st.fullName}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-secondary font-bold">
                              {st.adminId}
                            </td>
                            <td className="px-3 py-2.5 font-mono">
                              {st.ministryId}
                            </td>
                            <td className="px-3 py-2.5 font-semibold">
                              الشعبة (
                              {st.sectionCode === "a"
                                ? "أ"
                                : st.sectionCode === "b"
                                ? "ب"
                                : st.sectionCode === "c"
                                ? "ج"
                                : "د"}
                              )
                            </td>
                            <td className="px-3 py-2.5">
                              {st.guardianName} ({st.guardianPhone})
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] font-bold">
                                {st.statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {onDeleteStudent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف قيد الطالب (${st.fullName}) نهائياً من المنظومة وقاعدة البيانات السحابية؟`)) {
                                      onDeleteStudent(st.id);
                                      onNotify(`تم حذف قيد الطالب (${st.fullName}) بنجاح ومزامنة التغيير`);
                                    }
                                  }}
                                  title="حذف الطالب نهائياً من السجل"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-error/10 hover:bg-error hover:text-white text-error font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                  <span>حذف</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-6 text-center text-on-surface-variant"
                          >
                            لا يوجد طلاب في هذا الصف حالياً. يمكنك إضافة طالب من
                            النموذج أعلاه.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-surface-container-low px-space-lg py-space-sm flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    onNotify(`تم طباعة قائمة طلاب صف ${selectedClass.label}`);
                  }}
                  className="text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    print
                  </span>
                  <span>طباعة قائمة طلاب الصف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
