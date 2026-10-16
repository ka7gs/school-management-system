import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  MINISTRY_LOGO_URL,
  STAGE_GRADES,
  STAGE_LABELS,
  SUBJECTS_BY_STAGE,
  StageKey,
  StudentRecord,
  SubjectGradeItem,
  StudentMultiSubjectGrade,
  computeSubjectRow,
  computeStudentSummary,
  computeMidtermSummary,
  computeFinalSummary,
  generateDefaultSubjectsForStudent,
  INITIAL_STUDENT_MULTI_GRADES,
  SchoolConfig,
} from "../data/mockData";
import { UserRole } from "./LoginView";
import {
  subscribeToMultiGrades,
  saveMultiGradeDb,
} from "../firebase/firestoreService";

interface GradesLedgerViewProps {
  onNotify: (msg: string) => void;
  userRole?: UserRole;
  teacherSubject?: string;
  students?: StudentRecord[];
  schoolConfig?: SchoolConfig;
}

export const GradesLedgerView: React.FC<GradesLedgerViewProps> = ({
  onNotify,
  userRole = "principal",
  teacherSubject = "الرياضيات (Mathematics)",
  students = [],
  schoolConfig,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<"student_tables" | "class_sheet" | "subject_ledger">(
    "student_tables"
  );

  // Filters
  const [stage, setStage] = useState<StageKey>("preparatory");
  const [gradeCode, setGradeCode] = useState<string>("5s");
  const [section, setSection] = useState<string>("الشعبة (أ)");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>(
    userRole === "teacher" ? teacherSubject : "الكل"
  );

  // Master State for Multi-Subject Student Grades
  const [studentGradesList, setStudentGradesList] = useState<StudentMultiSubjectGrade[]>([]);

  // Realtime Firestore synchronization for grades across all devices
  useEffect(() => {
    const unsub = subscribeToMultiGrades((cloudGrades) => {
      if (cloudGrades && cloudGrades.length > 0) {
        setStudentGradesList(cloudGrades);
      }
    });
    return () => unsub();
  }, []);

  // Track active selected student for deep focus / editing / printing
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Modal for Single Student Result Certificate Print
  const [printSingleStudent, setPrintSingleStudent] = useState<StudentMultiSubjectGrade | null>(null);

  // Print Mode: "midterm" (only mid-year), "final" (only end-of-year), or "comprehensive" (all)
  const [printExamType, setPrintExamType] = useState<"midterm" | "final" | "comprehensive">("midterm");

  // Certificate Heading Title as requested by user
  const [certificateTitle, setCertificateTitle] = useState<string>(
    "نتائج امتحانات نصف السنة"
  );

  // Handler for printing single student with guaranteed auto-return
  const handlePrintStudentAndAutoReturn = (student: StudentMultiSubjectGrade) => {
    const examTypeLabel =
      printExamType === "midterm"
        ? "نصف السنة"
        : printExamType === "final"
        ? "نهاية السنة"
        : "النتيجة الشاملة";
    const originalTitle = document.title;
    document.title = " ";
    window.print();
    // Fallback timer to guarantee auto-return if afterprint event is delayed
    setTimeout(() => {
      document.title = originalTitle;
      setPrintSingleStudent(null);
      setSelectedStudentId(student.studentId);
      onNotify(`تمت طباعة نتيجة (${examTypeLabel}) للطالب (${student.studentName}) والرجوع تلقائياً`);
    }, 450);
  };

  // Handler for printing current student and directly moving to next student in the class
  const handlePrintAndNextStudent = (
    currentStudent: StudentMultiSubjectGrade,
    nextStudent: StudentMultiSubjectGrade | null
  ) => {
    const examTypeLabel =
      printExamType === "midterm"
        ? "نصف السنة"
        : printExamType === "final"
        ? "نهاية السنة"
        : "النتيجة الشاملة";
    const originalTitle = document.title;
    document.title = " ";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
      if (nextStudent) {
        setPrintSingleStudent(nextStudent);
        setSelectedStudentId(nextStudent.studentId);
        onNotify(
          `تمت طباعة نتيجة (${examTypeLabel}) للطالب (${currentStudent.studentName}) والانتقال تلقائياً للطالب التالي (${nextStudent.studentName})`
        );
      } else {
        setPrintSingleStudent(null);
        onNotify(`تمت طباعة آخر طالب في الصف والرجوع تلقائياً لسجل الدرجات`);
      }
    }, 450);
  };

  // Modal for Class Master Results Sheet Print (استمارة 44)
  const [showClassPrintModal, setShowClassPrintModal] = useState<boolean>(false);

  // Audit modal
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Save status notification
  const [saveStatus, setSaveStatus] = useState<{
    text: string;
    state: "synced" | "unsaved" | "saving" | "saved";
  }>({
    text: "تمت المزامنة وحفظ السجلات",
    state: "synced",
  });

  // Cascading Stage -> Grade
  const availableGrades = STAGE_GRADES[stage];
  const stageSubjects = SUBJECTS_BY_STAGE[stage] || [];

  const handleStageChange = (nextStage: StageKey) => {
    setStage(nextStage);
    const firstGrade = STAGE_GRADES[nextStage][0]?.code || "";
    setGradeCode(firstGrade);
  };

  const currentGradeLabel =
    STAGE_GRADES[stage].find((g) => g.code === gradeCode)?.label || "الخامس العلمي";

  // Merge students from prop if they are not already in studentGradesList for this stage & grade
  const effectiveStudentsGrades = useMemo(() => {
    const list = [...studentGradesList];

    // Check if any prop students in this grade are missing from studentGradesList
    students.forEach((st) => {
      const exists = list.some(
        (sg) =>
          sg.studentId === st.id ||
          (sg.adminId && sg.adminId === st.adminId) ||
          (sg.ministryId && sg.ministryId === st.ministryId)
      );
      if (!exists && st.stageCode === stage && st.gradeCode === gradeCode) {
        // synthesize multi-subject record for newly added student
        const defaultSubjects = generateDefaultSubjectsForStudent(stage, "good");
        list.push({
          studentId: st.id,
          ministryId: st.ministryId,
          adminId: st.adminId,
          studentName: st.fullName,
          stage: st.stageCode,
          gradeCode: st.gradeCode,
          gradeClass: currentGradeLabel,
          section: st.gradeSection.includes("ب") ? "الشعبة (ب)" : "الشعبة (أ)",
          subjects: defaultSubjects,
          notes: "طالب مسجل حديثاً",
        });
      }
    });

    return list;
  }, [studentGradesList, students, stage, gradeCode, currentGradeLabel]);

  // Filter students by active Stage, Grade, Section, and Search Query
  const classStudents = useMemo(() => {
    return effectiveStudentsGrades.filter((record) => {
      if (record.stage !== stage) return false;
      if (record.gradeCode !== gradeCode) return false;
      if (section && record.section !== section) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = record.studentName.toLowerCase().includes(q);
        const matchesAdmin = record.adminId.toLowerCase().includes(q);
        const matchesMin = record.ministryId.toLowerCase().includes(q);
        if (!matchesName && !matchesAdmin && !matchesMin) return false;
      }
      return true;
    });
  }, [effectiveStudentsGrades, stage, gradeCode, section, searchQuery]);

  // Make sure selectedStudentId points to a valid student in current class if possible
  const activeStudent = useMemo(() => {
    if (classStudents.length === 0) return null;
    const found = classStudents.find((s) => s.studentId === selectedStudentId);
    return found || classStudents[0];
  }, [classStudents, selectedStudentId]);

  // Auto-return & title-suppression listener: when system print window closes, automatically restore title and return
  useEffect(() => {
    let originalTitle = document.title;
    const handleBeforePrint = () => {
      originalTitle = document.title;
      document.title = " "; // Strip title so browser doesn't print system name in top header
      if (!printSingleStudent && activeStudent && activeTab === "student_tables") {
        setPrintSingleStudent(activeStudent);
      }
    };

    const handleAfterPrint = () => {
      document.title = originalTitle;
      if (printSingleStudent) {
        const studentName = printSingleStudent.studentName;
        const examTypeLabel =
          printExamType === "midterm"
            ? "نصف السنة"
            : printExamType === "final"
            ? "نهاية السنة"
            : "النتيجة الشاملة";
        setPrintSingleStudent(null);
        onNotify(`تمت طباعة نتيجة (${examTypeLabel}) للطالب (${studentName}) والرجوع تلقائياً للسجل`);
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printSingleStudent, printExamType, activeStudent, activeTab, onNotify]);

  // Global Ctrl+P / Cmd+P listener: cleanly launch official certificate print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        const originalTitle = document.title;
        document.title = " ";
        if (activeTab === "class_sheet") {
          setShowClassPrintModal(true);
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              document.title = originalTitle;
            }, 600);
          }, 150);
        } else if (activeStudent) {
          setPrintSingleStudent(activeStudent);
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              document.title = originalTitle;
            }, 600);
          }, 150);
        } else {
          window.print();
          setTimeout(() => {
            document.title = originalTitle;
          }, 600);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, activeStudent]);

  // Class Summary Statistics
  const classStats = useMemo(() => {
    let totalPass = 0;
    let totalDecision = 0; // مكمل
    let totalFail = 0;
    let totalMarksSum = 0;
    let totalSubjectsCount = 0;

    classStudents.forEach((student) => {
      const summary = computeStudentSummary(student);
      totalMarksSum += summary.totalScore;
      totalSubjectsCount += student.subjects.length;

      if (summary.failedCount === 0) {
        totalPass++;
      } else if (summary.failedCount <= 2) {
        totalDecision++;
      } else {
        totalFail++;
      }
    });

    const totalStudents = classStudents.length;
    const passRate =
      totalStudents > 0 ? Math.round(((totalPass + totalDecision) / totalStudents) * 100) : 0;
    const purePassRate =
      totalStudents > 0 ? Math.round((totalPass / totalStudents) * 100) : 0;

    return {
      totalStudents,
      totalPass,
      totalDecision,
      totalFail,
      passRate,
      purePassRate,
      totalMarksSum,
    };
  }, [classStudents]);

  // Handler: Edit specific mark inside a student's subject row
  const handleUpdateStudentMark = (
    studentId: string,
    subjectName: string,
    field: "month1" | "month2" | "midterm" | "course2Month1" | "course2Month2" | "finalExam",
    rawVal: string
  ) => {
    const num = rawVal === "" ? 0 : Math.max(0, Math.min(100, parseInt(rawVal, 10) || 0));

    setStudentGradesList((prevList) => {
      return prevList.map((st) => {
        if (st.studentId !== studentId) return st;
        const updatedSubjects = st.subjects.map((sub) => {
          if (sub.subjectName !== subjectName) return sub;
          return {
            ...sub,
            [field]: num,
          };
        });
        return {
          ...st,
          subjects: updatedSubjects,
        };
      });
    });

    setSaveStatus({
      text: "يوجد تعديلات غير محفوظة بالدرجات...",
      state: "unsaved",
    });
  };

  // Handler: Save grades
  const handleSaveAllGrades = async () => {
    setSaveStatus({
      text: "جاري حفظ وتدقيق السجلات سحابياً في Firebase...",
      state: "saving",
    });
    try {
      for (const record of effectiveStudentsGrades) {
        await saveMultiGradeDb(record);
      }
      setSaveStatus({
        text: "تم حفظ واعتماد السجلات سحابياً",
        state: "saved",
      });
      onNotify("تم اعتماد وحفظ سجل الدرجات الوزاري سحابياً وتحديث الجداول بنجاح ☁️");
    } catch (err) {
      console.error(err);
      setSaveStatus({
        text: "حدث خطأ في الحفظ السحابي",
        state: "unsaved",
      });
    }
  };

  // Handler: Export Single Student Result to Excel
  const handleExportStudentToExcel = (student: StudentMultiSubjectGrade) => {
    let headers: string[] = [];
    let data: (string | number)[][] = [];
    let titleLine = "";

    if (printExamType === "midterm") {
      const summary = computeMidtermSummary(student);
      titleLine = `نتائج امتحانات نصف السنة للطالب: ${student.studentName}`;
      headers = [
        "ت",
        "المادة الدراسية",
        "الشهر الأول (فصل أول)",
        "الشهر الثاني (فصل أول)",
        "معدل الفصل الأول",
        "امتحان نصف السنة",
        "التقدير",
        "النتيجة والحالة",
      ];
      data = summary.evaluatedSubjects.map((sub, idx) => [
        idx + 1,
        sub.subjectName,
        sub.month1,
        sub.month2,
        sub.term1Avg,
        sub.midterm,
        sub.gradeWord,
        sub.status,
      ]);
      data.push([]);
      data.push(["", "المجموع الكلي لنصف السنة", "", "", "", summary.totalScore, "", ""]);
      data.push(["", "معدل نصف السنة", "", "", "", `${summary.average}%`, "", ""]);
      data.push(["", "نتيجة نصف السنة", "", "", "", summary.decision, "", ""]);
    } else if (printExamType === "final") {
      const summary = computeFinalSummary(student);
      titleLine = `النتائج النهائية (الدور الأول) للطالب: ${student.studentName}`;
      headers = [
        "ت",
        "المادة الدراسية",
        "السعي السنوي",
        "الامتحان النهائي (الفاينل)",
        "الدرجة النهائية",
        "التقدير",
        "القرار الوزاري",
      ];
      data = summary.evaluatedSubjects.map((sub, idx) => [
        idx + 1,
        sub.subjectName,
        sub.annualEffort,
        sub.finalExam,
        sub.finalScore,
        sub.gradeWord,
        sub.status,
      ]);
      data.push([]);
      data.push(["", "المجموع الكلي النهائي", "", "", summary.totalScore, "", ""]);
      data.push(["", "المعدل العام النهائي", "", "", `${summary.average}%`, "", ""]);
      data.push(["", "القرار النهائي", "", "", summary.decision, "", ""]);
    } else {
      const summary = computeStudentSummary(student);
      titleLine = `كشف درجات ونتائج الطالب الشامل: ${student.studentName}`;
      headers = [
        "ت",
        "المادة الدراسية",
        "الشهر الأول (فصل أول)",
        "الشهر الثاني (فصل أول)",
        "معدل الفصل الأول",
        "امتحان نصف السنة",
        "الشهر الأول (كورس ثاني)",
        "الشهر الثاني (كورس ثاني)",
        "معدل الكورس الثاني",
        "السعي السنوي",
        "الامتحان النهائي (الفاينل)",
        "الدرجة النهائية",
        "التقدير والحالة",
      ];
      data = summary.evaluatedSubjects.map((sub, idx) => [
        idx + 1,
        sub.subjectName,
        sub.month1,
        sub.month2,
        sub.term1Avg,
        sub.midterm,
        sub.course2Month1,
        sub.course2Month2,
        sub.course2Avg,
        sub.annualEffort,
        sub.finalExam,
        sub.finalScore,
        sub.status,
      ]);
      data.push([]);
      data.push(["", "المجموع الكلي", "", "", "", "", "", "", "", "", "", summary.totalScore, ""]);
      data.push(["", "المعدل العام", "", "", "", "", "", "", "", "", "", `${summary.average}%`, ""]);
      data.push(["", "القرار النهائي", "", "", "", "", "", "", "", "", "", summary.decision, ""]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`جمهورية العراق - وزارة التربية`],
      [titleLine],
      [`الرقم الإحصائي: ${student.ministryId} | الرقم الإداري: ${student.adminId}`],
      [`المرحلة: ${STAGE_LABELS[student.stage]} | الصف: ${student.gradeClass} - ${student.section}`],
      [],
      headers,
      ...data,
    ]);

    const workbook = XLSX.utils.book_new();
    const sheetName =
      printExamType === "midterm"
        ? "نصف_السنة"
        : printExamType === "final"
        ? "النهائية"
        : "شامل";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(
      workbook,
      `درجات_${sheetName}_${student.studentName.replace(/\s+/g, "_")}.xlsx`
    );
    onNotify(`تم تصدير كشف درجات (${student.studentName}) إلى ملف Excel بنجاح`);
  };

  // Handler: Export Entire Class Results to Excel (ضوابط وزارة التربية - استمارة 44)
  const handleExportClassToExcel = () => {
    if (classStudents.length === 0) {
      onNotify("لا يوجد طلاب في هذا الصف لتصدير النتائج");
      return;
    }

    // Dynamic headers: student info + each subject's final mark + total + avg + decision
    const allSubjects = stageSubjects;
    const headers = [
      "ت",
      "الرقم الإحصائي الوزاري",
      "الرقم الإداري",
      "اسم الطالب الرباعي واللقب",
      ...allSubjects,
      "المجموع الكلي",
      "المعدل العام",
      "القرار الوزاري",
      "الملاحظات",
    ];

    const rows = classStudents.map((st, idx) => {
      const summary = computeStudentSummary(st);
      const subjectScores = allSubjects.map((subName) => {
        const found = summary.evaluatedSubjects.find((s) => s.subjectName === subName);
        return found ? found.finalScore : "-";
      });

      return [
        idx + 1,
        st.ministryId,
        st.adminId,
        st.studentName,
        ...subjectScores,
        summary.totalScore,
        `${summary.average}%`,
        summary.decision,
        st.notes || "",
      ];
    });

    // Add stats summary rows
    rows.push([]);
    rows.push([
      "",
      "الإحصائية العامة للصف",
      `العدد الكلي: ${classStats.totalStudents}`,
      `الناجحون: ${classStats.totalPass}`,
      `المكملون: ${classStats.totalDecision}`,
      `الراسبون: ${classStats.totalFail}`,
      `نسبة النجاح: ${classStats.passRate}%`,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["جمهورية العراق - وزارة التربية - المديرية العامة للتربية"],
      [`شيت سجل درجات ونتائج الامتحانات النهائية (استمارة ٤٤ الوزارية)`],
      [`الصف: ${currentGradeLabel} | الشعبة: ${section} | العام الدراسي: 2024-2025`],
      [],
      headers,
      ...rows,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "شيت نتائج الصف");
    XLSX.writeFile(
      workbook,
      `نتائج_الصف_${currentGradeLabel.replace(/\s+/g, "_")}_${section.replace(/\s+/g, "_")}.xlsx`
    );
    onNotify(`تم تصدير شيت نتائج الصف (${currentGradeLabel} - ${section}) إلى Excel بنجاح`);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg print:p-0">
      {/* 1. Official Ministry Document Header */}
      <div className="no-print bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border-r-4 border-primary">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md p-1.5 shrink-0">
              <img
                src={MINISTRY_LOGO_URL}
                alt="شعار وزارة التربية"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg text-primary font-bold">
                  سجل تقويم الامتحانات ورصد الدرجات الموحد (استمارة ٤٤)
                </h1>
                <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full border border-primary/20">
                  العام الدراسي 2024 - 2025
                </span>
                {userRole === "teacher" && (
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2.5 py-0.5 rounded">
                    مدرس التخصص: {teacherSubject}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                نظام الدرجات التفاعلي المعتمد — جداول تفصيلية لكل طالب بجميع المواد وإمكانية التعديل
                والطباعة وتصدير النتائج للصفوف حسب ضوابط وزارة التربية
              </p>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Active Student Clean Print Button (Immediate Result Print) */}
            {activeStudent && (
              <button
                type="button"
                onClick={() => setPrintSingleStudent(activeStudent)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-label-md shadow-sm transition-all cursor-pointer border border-emerald-600"
                title={`طباعة وثيقة النتيجة الرسمية للطالب: ${activeStudent.studentName} (A4)`}
              >
                <span className="material-symbols-outlined text-[19px]">print</span>
                <span>طباعة نتيجة الطالب ({activeStudent.studentName.split(" ")[0]})</span>
              </button>
            )}

            {/* Whole Class Print Button */}
            <button
              type="button"
              onClick={() => setShowClassPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-bold text-label-md shadow-sm transition-all cursor-pointer"
              title="طباعة نتائج الصف كاملاً وفق ضوابط وزارة التربية (شيت استمارة ٤٤)"
            >
              <span className="material-symbols-outlined text-[19px]">print</span>
              <span>طباعة شيت نتائج الصف (A4)</span>
            </button>

            {/* Whole Class Excel Export */}
            <button
              type="button"
              onClick={handleExportClassToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white rounded-lg font-bold text-label-md shadow-sm transition-all cursor-pointer"
              title="تصدير نتائج الصف بالكامل إلى جدول إكسل"
            >
              <span className="material-symbols-outlined text-[19px]">table_view</span>
              <span>تصدير الصف إلى Excel</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveAllGrades}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-white hover:bg-secondary/90 rounded-lg font-bold text-label-md shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">save</span>
              <span>حفظ السجل</span>
            </button>

            {/* Audit Log */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md text-label-md border border-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>التدقيق الوزاري</span>
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="mt-4 pt-3 border-t border-surface-container-high flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("student_tables")}
              className={`px-3 py-1.5 rounded-md font-bold text-label-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "student_tables"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>جداول درجات الطلاب الفردية (لكل طالب جدول خاص بجميع المواد)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("class_sheet")}
              className={`px-3 py-1.5 rounded-md font-bold text-label-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "class_sheet"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              <span>شيت نتائج الصف المجمع الوزاري (سجل ٤٤ لجميع طلاب الصف)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                saveStatus.state === "unsaved"
                  ? "bg-amber-500 animate-pulse"
                  : saveStatus.state === "saving"
                  ? "bg-blue-500 animate-spin"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-on-surface-variant font-medium">{saveStatus.text}</span>
          </div>
        </div>
      </div>

      {/* 2. Cascading Class Filters & Search Bar */}
      <div className="no-print bg-surface-container-lowest p-space-md rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface mb-1">
            المرحلة الدراسية
          </label>
          <select
            value={stage}
            onChange={(e) => handleStageChange(e.target.value as StageKey)}
            className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-medium cursor-pointer"
          >
            <option value="primary">المرحلة الابتدائية (من الأول إلى السادس)</option>
            <option value="intermediate">المرحلة المتوسطة (من الأول إلى الثالث)</option>
            <option value="preparatory">المرحلة الإعدادية (العلمي والأدبي)</option>
          </select>
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface mb-1">
            الصف الدراسي ({STAGE_LABELS[stage]})
          </label>
          <select
            value={gradeCode}
            onChange={(e) => setGradeCode(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-medium cursor-pointer"
          >
            {availableGrades.map((g) => (
              <option key={g.code} value={g.code}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface mb-1">الشعبة</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-medium cursor-pointer"
          >
            <option value="الشعبة (أ)">الشعبة (أ)</option>
            <option value="الشعبة (ب)">الشعبة (ب)</option>
            <option value="الشعبة (ج)">الشعبة (ج)</option>
          </select>
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface mb-1">
            بحث عن طالب في الصف
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم الطالب أو الرقم الإداري..."
              className="w-full h-10 pr-9 pl-3 bg-surface-container-low border border-surface-container-high rounded-lg outline-none text-body-sm font-medium focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 3. Class Quick KPI Stats Ribbon */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-5 gap-3 bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-surface-container-high text-center">
        <div className="p-2 bg-surface-container-low rounded-lg">
          <span className="text-xs text-on-surface-variant block">عدد طلاب الصف</span>
          <span className="font-bold text-lg text-primary">{classStats.totalStudents} طالب</span>
        </div>
        <div className="p-2 bg-[#E8F5E9] rounded-lg">
          <span className="text-xs text-[#2E7D32] block">الناجحون (بدون إكمال)</span>
          <span className="font-bold text-lg text-[#1B5E20]">{classStats.totalPass}</span>
        </div>
        <div className="p-2 bg-[#FFF3E0] rounded-lg">
          <span className="text-xs text-[#E65100] block">المكملون (قرار/إكمال)</span>
          <span className="font-bold text-lg text-[#B25000]">{classStats.totalDecision}</span>
        </div>
        <div className="p-2 bg-[#FFEBEE] rounded-lg">
          <span className="text-xs text-[#C62828] block">الراسبون بالدور الأول</span>
          <span className="font-bold text-lg text-[#B71C1C]">{classStats.totalFail}</span>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg col-span-2 sm:col-span-1">
          <span className="text-xs text-primary block">نسبة النجاح العامة</span>
          <span className="font-bold text-lg text-primary">{classStats.passRate}%</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: DEDICATED STUDENT TABLES (لكل طالب جدول خاص بجميع المواد) */}
      {/* ======================================================== */}
      {activeTab === "student_tables" && (
        <div className="space-y-6">
          {/* Student Selector Toolbar */}
          <div className="no-print bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  view_carousel
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  اختر طالباً لاستعراض وتعديل جدول درجاته:
                </span>
              </div>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded">
                المعروض: {classStudents.length} طالب في {currentGradeLabel} - {section}
              </span>
            </div>

            {/* Student Chips Horizontal Scroller */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {classStudents.map((st) => {
                const summary = computeStudentSummary(st);
                const isSelected = activeStudent?.studentId === st.studentId;
                return (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(st.studentId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-right shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary shadow-md"
                        : "bg-surface-container-low hover:bg-surface-container border-surface-container-high text-on-surface"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? "bg-white text-primary"
                          : "bg-primary-container text-on-primary"
                      }`}
                    >
                      {st.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs truncate max-w-[140px]">
                        {st.studentName}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-on-primary/80" : "text-on-surface-variant"
                        }`}
                      >
                        {summary.average}% • {summary.decision}
                      </div>
                    </div>
                  </button>
                );
              })}
              {classStudents.length === 0 && (
                <div className="text-xs text-on-surface-variant p-2">
                  لا يوجد طلاب مطابقون في هذا الصف أو البحث. يرجى اختيار صف آخر أو إضافة طلاب.
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Table for the Active Student */}
          {activeStudent ? (
            (() => {
              const studentSummary = computeStudentSummary(activeStudent);
              return (
                <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
                  {/* Student Dedicated Header Card */}
                  <div className="p-space-lg bg-surface-container-low/80 border-b border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                        {activeStudent.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-headline-md text-headline-md text-primary font-bold">
                            {activeStudent.studentName}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                              studentSummary.failedCount === 0
                                ? "bg-[#E8F5E9] text-[#1B5E20]"
                                : studentSummary.failedCount <= 2
                                ? "bg-[#FFF3E0] text-[#B25000]"
                                : "bg-[#FFEBEE] text-[#B71C1C]"
                            }`}
                          >
                            {studentSummary.decision}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 font-mono">
                          <span>
                            الرقم الإحصائي: <strong>{activeStudent.ministryId}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            الرقم الإداري: <strong>{activeStudent.adminId}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {activeStudent.gradeClass} - {activeStudent.section}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Student Actions: Print Midterm / Final / Comprehensive, Excel, Save */}
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Master Prominent Result Print Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPrintSingleStudent(activeStudent);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer border border-emerald-600"
                        title="فتح وثيقة النتيجة الرسمية وطباعتها مباشرة (A4)"
                      >
                        <span className="material-symbols-outlined text-[19px]">print</span>
                        <span>طباعة النتيجة الرسمية (A4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPrintExamType("midterm");
                          setCertificateTitle("نتائج امتحانات نصف السنة");
                          setPrintSingleStudent(activeStudent);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                        title="عرض وطباعة نتيجة امتحانات نصف السنة فقط لهذا الطالب"
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        <span>طباعة نصف السنة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPrintExamType("final");
                          setCertificateTitle("النتائج النهائية (الدور الأول)");
                          setPrintSingleStudent(activeStudent);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white hover:bg-secondary/90 rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                        title="عرض وطباعة النتيجة النهائية فقط (نهاية السنة) لهذا الطالب"
                      >
                        <span className="material-symbols-outlined text-[18px]">school</span>
                        <span>طباعة نهاية السنة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPrintExamType("comprehensive");
                          setCertificateTitle("نتائج الامتحانات (نصف السنة والنتائج النهائية)");
                          setPrintSingleStudent(activeStudent);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer border border-primary/20"
                        title="عرض وطباعة كشف الدرجات الشامل لكافة الفصول"
                      >
                        <span className="material-symbols-outlined text-[18px]">table_chart</span>
                        <span>طباعة شاملة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportStudentToExcel(activeStudent)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                        title="تصدير كشف درجات هذا الطالب إلى ملف إكسل"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>تصدير إكسل</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAllGrades}
                        className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white hover:bg-secondary/90 rounded-lg text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>حفظ درجات الطالب</span>
                      </button>
                    </div>
                  </div>

                  {/* Editing instructions banner */}
                  <div className="bg-primary/5 px-space-lg py-2 text-xs text-primary flex items-center justify-between border-b border-primary/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>
                        يمكنك تعديل أي درجة مباشرة داخل الحقول أدناه؛ يتم احتساب السعي الفصلي والسنوي والدرجة
                        النهائية والقرار تلقائياً في الوقت الفعلي.
                      </span>
                    </div>
                    <span className="font-bold">مجموع الدرجات: {studentSummary.totalScore} / {studentSummary.maxScore}</span>
                  </div>

                  {/* The Dedicated Full Table of Subjects & Grades */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-primary text-on-primary font-bold h-11 border-b border-primary-container">
                          <th className="px-3 border-l border-white/15 w-12 text-center">ت</th>
                          <th className="px-4 border-l border-white/15 min-w-[150px]">المادة الدراسية</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/5">ش1 (ف1)</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/5">ش2 (ف1)</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/15 font-bold">معدل ف1</th>
                          <th className="px-2 text-center border-l border-white/15 bg-secondary-container text-on-secondary-container font-bold">
                            نصف السنة
                          </th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/5">ش1 (ك2)</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/5">ش2 (ك2)</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/15 font-bold">معدل ك2</th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/20 font-bold">السعي السنوي</th>
                          <th className="px-2 text-center border-l border-white/15 bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                            الفاينل (النهائي)
                          </th>
                          <th className="px-2 text-center border-l border-white/15 bg-white/25 font-bold">الدرجة النهائية</th>
                          <th className="px-3 text-center border-l border-white/15">النتيجة والتقدير</th>
                          <th className="px-3 text-right">ملاحظات المادة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container font-mono">
                        {studentSummary.evaluatedSubjects.map((sub, idx) => (
                          <tr
                            key={sub.subjectName}
                            className="hover:bg-surface-container-low transition-colors"
                          >
                            <td className="px-3 py-2.5 text-center text-on-surface-variant font-bold border-l border-surface-container">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-2.5 font-Cairo font-bold text-primary border-l border-surface-container">
                              {sub.subjectName}
                            </td>

                            {/* Editable: Month 1 (Term 1) */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.month1}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "month1",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-surface-container-high rounded text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Editable: Month 2 (Term 1) */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.month2}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "month2",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-surface-container-high rounded text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Auto Calculated: Term 1 Avg */}
                            <td className="px-2 py-2.5 text-center font-bold bg-surface-container-low border-l border-surface-container text-on-surface">
                              {sub.term1Avg}
                            </td>

                            {/* Editable: Midterm Exam */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container bg-secondary-container/10">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.midterm}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "midterm",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-secondary/40 rounded text-xs font-bold text-secondary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                              />
                            </td>

                            {/* Editable: Course 2 Month 1 */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.course2Month1}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "course2Month1",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-surface-container-high rounded text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Editable: Course 2 Month 2 */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.course2Month2}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "course2Month2",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-surface-container-high rounded text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Auto Calculated: Course 2 Avg */}
                            <td className="px-2 py-2.5 text-center font-bold bg-surface-container-low border-l border-surface-container text-on-surface">
                              {sub.course2Avg}
                            </td>

                            {/* Auto Calculated: Annual Effort */}
                            <td className="px-2 py-2.5 text-center font-bold text-primary bg-primary/5 border-l border-surface-container">
                              {sub.annualEffort}
                            </td>

                            {/* Editable: Final Exam */}
                            <td className="px-1.5 py-1.5 text-center border-l border-surface-container bg-tertiary-fixed/10">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.finalExam}
                                onChange={(e) =>
                                  handleUpdateStudentMark(
                                    activeStudent.studentId,
                                    sub.subjectName,
                                    "finalExam",
                                    e.target.value
                                  )
                                }
                                className="w-14 h-8 text-center bg-white border border-tertiary-fixed-dim rounded text-xs font-bold text-on-tertiary-fixed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Auto Calculated: Final Grade */}
                            <td
                              className={`px-2 py-2.5 text-center font-bold text-sm border-l border-surface-container ${
                                sub.finalScore < 50
                                  ? "text-error bg-error/10"
                                  : "text-primary bg-primary/10"
                              }`}
                            >
                              {sub.finalScore}
                            </td>

                            {/* Status Badge */}
                            <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  sub.finalScore >= 50
                                    ? "bg-[#E8F5E9] text-[#2E7D32]"
                                    : sub.finalScore >= 45
                                    ? "bg-[#FFF3E0] text-[#B25000]"
                                    : "bg-[#FFEBEE] text-[#B71C1C]"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>

                            {/* Note */}
                            <td className="px-3 py-2.5 font-Cairo text-on-surface-variant text-[11px]">
                              {sub.note || (sub.finalScore < 50 ? "يحتاج دور ثاني" : "مجتاز")}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Summary Row */}
                      <tfoot>
                        <tr className="bg-surface-container-high/60 font-bold border-t-2 border-primary text-on-surface">
                          <td colSpan={2} className="px-4 py-3 text-right font-Cairo text-primary">
                            المحصلة العامة للطالب:
                          </td>
                          <td colSpan={7} className="px-3 py-3 text-on-surface-variant font-Cairo">
                            عدد المواد: {studentSummary.evaluatedSubjects.length} • المواد المكملة:{" "}
                            <span className={studentSummary.failedCount > 0 ? "text-error" : "text-emerald-700"}>
                              {studentSummary.failedCount}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center text-primary font-mono text-sm">
                            المجموع:
                          </td>
                          <td className="px-2 py-3 text-center text-primary font-mono text-base font-bold bg-primary/10">
                            {studentSummary.totalScore}
                          </td>
                          <td className="px-2 py-3 text-center text-primary font-mono text-base font-bold bg-primary/20">
                            {studentSummary.average}%
                          </td>
                          <td className="px-3 py-3 text-center font-Cairo font-bold text-sm">
                            <span
                              className={`px-3 py-1 rounded-md text-xs font-bold ${
                                studentSummary.failedCount === 0
                                  ? "bg-[#E8F5E9] text-[#1B5E20]"
                                  : studentSummary.failedCount <= 2
                                  ? "bg-[#FFF3E0] text-[#B25000]"
                                  : "bg-[#FFEBEE] text-[#B71C1C]"
                              }`}
                            >
                              {studentSummary.decision}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-on-surface-variant font-Cairo">
                            معتمد وفق ضوابط وزارة التربية
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-surface-container-lowest p-8 text-center rounded-xl shadow-sm border border-surface-container-high">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
                person_search
              </span>
              <p className="font-bold text-primary">لا يوجد طلاب مطابقون في هذا الصف.</p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                اختر مرحلة وصفاً آخر أو قم بتسجيل طلاب جدد في شؤون الطلبة ليتم إنشاء جداول درجاتهم
                تلقائياً.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: WHOLE CLASS MASTER RESULTS SHEET (استمارة ٤٤ الوزارية) */}
      {/* ======================================================== */}
      {activeTab === "class_sheet" && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
          {/* Header Action Bar */}
          <div className="no-print p-space-md bg-surface-container-low border-b border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                سجل فحص وتدقيق درجات الصف العام (شيت استمارة ٤٤)
              </h2>
              <span className="text-xs text-on-surface-variant">
                {currentGradeLabel} • {section} • العام الدراسي 2024 - 2025
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClassPrintModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-bold text-label-sm shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>طباعة شيت نتائج الصف كاملاً (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleExportClassToExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white rounded-lg font-bold text-label-sm shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                <span>تصدير إلى Excel</span>
              </button>
            </div>
          </div>

          {/* Master Sheet Table for Entire Class */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-primary text-on-primary font-bold h-11">
                  <th className="px-3 text-center border-l border-white/15 w-10">ت</th>
                  <th className="px-3 border-l border-white/15 w-28">الرقم الإحصائي</th>
                  <th className="px-3 border-l border-white/15 w-28">الرقم الإداري</th>
                  <th className="px-4 border-l border-white/15 min-w-[160px]">اسم الطالب الرباعي</th>
                  {stageSubjects.map((subName) => (
                    <th
                      key={subName}
                      className="px-2 text-center border-l border-white/15 min-w-[70px] text-[11px]"
                    >
                      {subName}
                    </th>
                  ))}
                  <th className="px-3 text-center border-l border-white/15 bg-white/15 font-bold">
                    المجموع
                  </th>
                  <th className="px-3 text-center border-l border-white/15 bg-white/20 font-bold">
                    المعدل
                  </th>
                  <th className="px-3 text-center border-l border-white/15">القرار الوزاري</th>
                  <th className="px-3 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-mono">
                {classStudents.map((st, idx) => {
                  const summary = computeStudentSummary(st);
                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center text-on-surface-variant font-bold border-l border-surface-container">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 text-primary font-bold border-l border-surface-container text-[11px]">
                        {st.ministryId}
                      </td>
                      <td className="px-3 py-2.5 text-secondary font-bold border-l border-surface-container text-[11px]">
                        {st.adminId}
                      </td>
                      <td className="px-4 py-2.5 font-Cairo font-bold text-on-surface border-l border-surface-container">
                        {st.studentName}
                      </td>

                      {/* Grades for each subject in this stage */}
                      {stageSubjects.map((subName) => {
                        const sub = summary.evaluatedSubjects.find(
                          (s) => s.subjectName === subName
                        );
                        const score = sub ? sub.finalScore : "-";
                        const isFail = typeof score === "number" && score < 50;
                        return (
                          <td
                            key={subName}
                            className={`px-2 py-2.5 text-center font-bold border-l border-surface-container ${
                              isFail ? "text-error bg-error/5" : "text-on-surface"
                            }`}
                          >
                            {score}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-2.5 text-center font-bold text-primary bg-primary/5 border-l border-surface-container">
                        {summary.totalScore}
                      </td>

                      {/* Average */}
                      <td className="px-3 py-2.5 text-center font-bold text-primary bg-primary/10 border-l border-surface-container">
                        {summary.average}%
                      </td>

                      {/* Ministry Decision */}
                      <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            summary.failedCount === 0
                              ? "bg-[#E8F5E9] text-[#1B5E20]"
                              : summary.failedCount <= 2
                              ? "bg-[#FFF3E0] text-[#B25000]"
                              : "bg-[#FFEBEE] text-[#B71C1C]"
                          }`}
                        >
                          {summary.decision}
                        </span>
                      </td>

                      {/* Quick Print Action per row */}
                      <td className="px-2 py-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPrintExamType("midterm");
                              setCertificateTitle("نتائج امتحانات نصف السنة");
                              setPrintSingleStudent(st);
                            }}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary hover:text-white text-primary text-[11px] font-bold rounded transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                            title="عرض وطباعة وثيقة نتيجة نصف السنة لهذا الطالب"
                          >
                            <span className="material-symbols-outlined text-[13px]">print</span>
                            <span>طباعة نصف السنة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrintExamType("final");
                              setCertificateTitle("النتائج النهائية (الدور الأول)");
                              setPrintSingleStudent(st);
                            }}
                            className="px-2.5 py-1 bg-secondary/15 hover:bg-secondary hover:text-white text-secondary text-[11px] font-bold rounded transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                            title="عرض وطباعة وثيقة النتيجة النهائية لهذا الطالب"
                          >
                            <span className="material-symbols-outlined text-[13px]">print</span>
                            <span>طباعة نهاية السنة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: INDIVIDUAL STUDENT OFFICIAL CERTIFICATE (A4) */}
      {/* ======================================================== */}
      {printSingleStudent && (() => {
        const currentStudentIndex = classStudents.findIndex(
          (s) => s.studentId === printSingleStudent.studentId
        );
        const prevStudent =
          currentStudentIndex > 0 ? classStudents[currentStudentIndex - 1] : null;
        const nextStudent =
          currentStudentIndex >= 0 && currentStudentIndex < classStudents.length - 1
            ? classStudents[currentStudentIndex + 1]
            : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
            <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden print:w-full print:shadow-none print:rounded-none">
              {/* Modal Controls (Hidden when printing) */}
              <div className="no-print bg-primary text-on-primary px-space-lg py-space-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                  <span className="font-headline-sm text-headline-sm font-bold">
                    وثيقة النتيجة: {printSingleStudent.studentName}
                  </span>
                  <span className="bg-white/15 px-2 py-0.5 rounded text-[11px] font-mono">
                    (طالب {currentStudentIndex + 1} من {classStudents.length})
                  </span>

                  {/* Mode Selector Buttons: Midterm vs Final vs Comprehensive */}
                  <div className="flex items-center gap-1 bg-black/25 p-1 rounded-lg mr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintExamType("midterm");
                        setCertificateTitle("نتائج امتحانات نصف السنة");
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        printExamType === "midterm"
                          ? "bg-white text-primary shadow-xs"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                      title="عرض وطباعة نتائج نصف السنة فقط دون نهاية السنة"
                    >
                      <span className="material-symbols-outlined text-[15px]">menu_book</span>
                      <span>نتائج نصف السنة فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintExamType("final");
                        setCertificateTitle("النتائج النهائية (الدور الأول)");
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        printExamType === "final"
                          ? "bg-white text-secondary shadow-xs font-black"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                      title="عرض وطباعة النتائج النهائية فقط (نهاية السنة)"
                    >
                      <span className="material-symbols-outlined text-[15px]">school</span>
                      <span>النتائج النهائية فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintExamType("comprehensive");
                        setCertificateTitle("نتائج الامتحانات (نصف السنة والنتائج النهائية)");
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        printExamType === "comprehensive"
                          ? "bg-white text-primary shadow-xs"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      title="كشف درجات سنوي شامل لكافة الفصول"
                    >
                      <span className="material-symbols-outlined text-[15px]">table_chart</span>
                      <span>شامل</span>
                    </button>
                  </div>

                  {/* Quick Select for Certificate Title */}
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="text-[11px] text-white/80">العنوان:</span>
                    <select
                      value={certificateTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCertificateTitle(val);
                        if (val.includes("نصف السنة") && !val.includes("النهائية")) {
                          setPrintExamType("midterm");
                        } else if (val.includes("النهائية") && !val.includes("نصف السنة")) {
                          setPrintExamType("final");
                        }
                      }}
                      className="bg-white text-primary text-xs font-bold px-2 py-1 rounded cursor-pointer outline-none border border-white/30"
                    >
                      <option value="نتائج امتحانات نصف السنة">نتائج امتحانات نصف السنة</option>
                      <option value="النتائج النهائية (الدور الأول)">النتائج النهائية (الدور الأول)</option>
                      <option value="النتائج النهائية (الدور الثاني)">النتائج النهائية (الدور الثاني)</option>
                      <option value="نتائج الامتحانات (نصف السنة أو النتائج النهائية)">
                        نتائج الامتحانات (نصف السنة أو النتائج النهائية)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Prev / Next Student Switcher */}
                  <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                    <button
                      type="button"
                      disabled={!prevStudent}
                      onClick={() => prevStudent && setPrintSingleStudent(prevStudent)}
                      className="p-0.5 rounded text-white disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                      title="الطالب السابق"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <span className="text-[11px] px-1 font-mono">
                      {currentStudentIndex + 1} / {classStudents.length}
                    </span>
                    <button
                      type="button"
                      disabled={!nextStudent}
                      onClick={() => nextStudent && setPrintSingleStudent(nextStudent)}
                      className="p-0.5 rounded text-white disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                      title="الطالب التالي"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                  </div>

                  {/* Primary Print Button with Automatic Return */}
                  <button
                    type="button"
                    onClick={() => handlePrintStudentAndAutoReturn(printSingleStudent)}
                    className="px-3.5 py-1.5 bg-secondary text-white font-bold rounded-lg text-label-sm flex items-center gap-1.5 cursor-pointer hover:bg-secondary/90 shadow-sm"
                    title="طباعة النتيجة والرجوع تلقائياً إلى جدول الصف لطباعة طالب ثانٍ"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    <span>
                      طباعة {printExamType === "midterm" ? "نصف السنة" : printExamType === "final" ? "نهاية السنة" : "النتيجة"} والرجوع التلقائي
                    </span>
                    <span className="material-symbols-outlined text-[16px]">reply</span>
                  </button>

                  {/* Print and Auto Advance to Next Student */}
                  {nextStudent && (
                    <button
                      type="button"
                      onClick={() => handlePrintAndNextStudent(printSingleStudent, nextStudent)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg text-label-sm flex items-center gap-1 cursor-pointer border border-white/25"
                      title={`طباعة نتيجة هذا الطالب والانتقال التلقائي للطالب التالي: (${nextStudent.studentName})`}
                    >
                      <span className="material-symbols-outlined text-[18px]">skip_next</span>
                      <span>طباعة والتالي تلقائياً</span>
                    </button>
                  )}

                  {/* Export Excel */}
                  <button
                    type="button"
                    onClick={() => handleExportStudentToExcel(printSingleStudent)}
                    className="px-2.5 py-1.5 bg-[#1B5E20] text-white font-bold rounded-lg text-label-sm flex items-center gap-1 cursor-pointer hover:bg-[#2E7D32]"
                    title="تصدير بيانات هذا الطالب إلى Excel"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>إكسل</span>
                  </button>

                  {/* Manual Close / Return */}
                  <button
                    type="button"
                    onClick={() => setPrintSingleStudent(null)}
                    className="p-1 rounded hover:bg-white/10 cursor-pointer text-white flex items-center"
                    title="إغلاق والرجوع لسجل الطلاب"
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>
              </div>

              {/* Guidance Bar for Principal (Clean Print Tips - Hidden when printing) */}
              <div className="no-print bg-emerald-50 border-b border-emerald-200 px-space-lg py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0">verified</span>
                  <span>
                    <strong>توجيه مهم للمدير (طباعة رسمية نظيفة خالية من الروابط):</strong> تم إعداد هذه الوثيقة تلقائياً بمقاس A4 رسمي بدون أي روابط أو تواريخ متصفح. إذا ظهر رابط الموقع أو اسم النظام، يرجى إزالة علامة الصح عن خيار <strong>(الرؤوس والتذييلات / Headers and footers)</strong> من إعدادات الطباعة.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrintStudentAndAutoReturn(printSingleStudent)}
                  className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>طباعة الآن (Ctrl + P)</span>
                </button>
              </div>

              {/* Official Printable Certificate Body */}
              {(() => {
                const midtermSummary = computeMidtermSummary(printSingleStudent);
                const finalSummary = computeFinalSummary(printSingleStudent);
                const comprehensiveSummary = computeStudentSummary(printSingleStudent);

                return (
                  <div className="official-print-document p-8 space-y-4 bg-white text-on-surface">
                    {/* Ministry Header */}
                    <div className="flex items-center justify-between border-b-2 border-primary pb-4">
                      <div className="text-right space-y-0.5 text-xs font-bold text-primary">
                        <div>جمهورية العراق - وزارة التربية</div>
                        <div>{schoolConfig?.directorate || "المديرية العامة لتربية بغداد / الكرخ الأولى"}</div>
                        <div>إدارة {schoolConfig?.schoolName || "ثانوية المتميزين للبنين"}</div>
                        <div>العام الدراسي: {schoolConfig?.academicYear || "2024 - 2025"}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <img
                          src={schoolConfig?.ministryLogoUrl || MINISTRY_LOGO_URL}
                          alt="شعار وزارة التربية"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-contain mb-1"
                        />
                        <h2 className="font-headline-md text-headline-md text-primary font-bold">
                          {certificateTitle}
                        </h2>
                      </div>
                      <div className="text-left font-mono text-xs space-y-1 bg-surface-container-low p-2.5 rounded-lg border border-surface-container-high">
                        {schoolConfig?.schoolLogoUrl && (
                          <img
                            src={schoolConfig.schoolLogoUrl}
                            alt="شعار المدرسة"
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-contain ml-auto mb-1 rounded"
                          />
                        )}
                        <div>
                          الرقم الإحصائي:{" "}
                          <strong className="text-primary">{printSingleStudent.ministryId}</strong>
                        </div>
                        <div>
                          الرقم الإداري:{" "}
                          <strong className="text-secondary">{printSingleStudent.adminId}</strong>
                        </div>
                        <div>تاريخ الإصدار: 2025/05/20</div>
                      </div>
                    </div>

                    {/* Student Identity Metadata Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3.5 rounded-lg border border-surface-container-high text-xs">
                      <div>
                        <span className="text-on-surface-variant block">اسم الطالب الرباعي واللقب:</span>
                        <span className="font-bold text-primary text-sm">
                          {printSingleStudent.studentName}
                        </span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">المرحلة الدراسية:</span>
                        <span className="font-bold text-on-surface">
                          {STAGE_LABELS[printSingleStudent.stage]}
                        </span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">الصف والشعبة:</span>
                        <span className="font-bold text-on-surface">
                          {printSingleStudent.gradeClass} - {printSingleStudent.section}
                        </span>
                      </div>
                      <div>
                        {printExamType === "midterm" ? (
                          <>
                            <span className="text-on-surface-variant block">معدل وقرار نصف السنة:</span>
                            <span
                              className={`font-bold text-sm ${
                                midtermSummary.failedCount === 0 ? "text-[#1B5E20]" : "text-[#B71C1C]"
                              }`}
                            >
                              {midtermSummary.average}% ({midtermSummary.decision})
                            </span>
                          </>
                        ) : printExamType === "final" ? (
                          <>
                            <span className="text-on-surface-variant block">المعدل العام والقرار النهائي:</span>
                            <span
                              className={`font-bold text-sm ${
                                finalSummary.failedCount === 0 ? "text-[#1B5E20]" : "text-[#B71C1C]"
                              }`}
                            >
                              {finalSummary.average}% ({finalSummary.decision})
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-on-surface-variant block">المعدل السنوي والقرار:</span>
                            <span
                              className={`font-bold text-sm ${
                                comprehensiveSummary.failedCount === 0 ? "text-[#1B5E20]" : "text-[#B71C1C]"
                              }`}
                            >
                              {comprehensiveSummary.average}% ({comprehensiveSummary.decision})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 1. MIDTERM ONLY TABLE: Exactly mid-year results without end of year */}
                    {printExamType === "midterm" && (
                      <div className="border border-surface-container-highest rounded-lg overflow-hidden">
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className="bg-primary text-on-primary font-bold h-9">
                              <th className="px-3 text-center border-l border-white/15 w-10">ت</th>
                              <th className="px-4 border-l border-white/15">المادة الدراسية</th>
                              <th className="px-3 text-center border-l border-white/15">الشهر الأول (ف1)</th>
                              <th className="px-3 text-center border-l border-white/15">الشهر الثاني (ف1)</th>
                              <th className="px-3 text-center border-l border-white/15 bg-white/10 font-bold">
                                معدل الفصل الأول
                              </th>
                              <th className="px-4 text-center border-l border-white/15 bg-secondary-container text-on-secondary-container font-bold text-sm">
                                امتحان نصف السنة (من 100)
                              </th>
                              <th className="px-3 text-center border-l border-white/15">التقدير</th>
                              <th className="px-3 text-center border-l border-white/15">النتيجة</th>
                              <th className="px-3 text-center">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high font-mono">
                            {midtermSummary.evaluatedSubjects.map((sub, i) => (
                              <tr key={i} className="even:bg-surface-container-low/40">
                                <td className="px-3 py-2.5 text-center text-on-surface-variant font-bold border-l border-surface-container-high">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-2.5 font-Cairo font-bold text-primary border-l border-surface-container-high">
                                  {sub.subjectName}
                                </td>
                                <td className="px-3 py-2.5 text-center border-l border-surface-container-high">
                                  {sub.month1}
                                </td>
                                <td className="px-3 py-2.5 text-center border-l border-surface-container-high">
                                  {sub.month2}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold bg-surface-container/40 border-l border-surface-container-high">
                                  {sub.term1Avg}
                                </td>
                                <td
                                  className={`px-4 py-2.5 text-center font-bold text-sm bg-secondary-container/20 border-l border-surface-container-high ${
                                    sub.midterm < 50 ? "text-error font-black" : "text-secondary font-black"
                                  }`}
                                >
                                  {sub.midterm}
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container-high">
                                  {sub.gradeWord}
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container-high">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      sub.isPassing
                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                        : "bg-[#FFEBEE] text-[#B71C1C]"
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo text-[11px] text-on-surface-variant">
                                  {sub.isPassing ? "مستوفٍ" : "غير مستوفٍ"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-surface-container-high font-bold">
                              <td colSpan={5} className="px-4 py-2.5 font-Cairo text-primary">
                                مجموع درجات امتحان نصف السنة والمعدل العام:
                              </td>
                              <td className="px-4 py-2.5 text-center text-primary font-bold text-sm font-mono border-l border-surface-container">
                                {midtermSummary.totalScore}
                                <span className="text-[10px] text-on-surface-variant mr-1">
                                  / {midtermSummary.maxScore}
                                </span>
                              </td>
                              <td colSpan={3} className="px-4 py-2.5 font-Cairo text-primary text-sm">
                                معدل نصف السنة:{" "}
                                <strong className="font-mono text-base ml-2">{midtermSummary.average}%</strong>
                                — نتيجة نصف السنة:{" "}
                                <span
                                  className={`font-bold mr-1 ${
                                    midtermSummary.failedCount === 0 ? "text-[#1B5E20]" : "text-[#B71C1C]"
                                  }`}
                                >
                                  {midtermSummary.decision}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* 2. FINAL ONLY TABLE: Exactly end-of-year results without midterm breakdown */}
                    {printExamType === "final" && (
                      <div className="border border-surface-container-highest rounded-lg overflow-hidden">
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className="bg-primary text-on-primary font-bold h-9">
                              <th className="px-3 text-center border-l border-white/15 w-10">ت</th>
                              <th className="px-4 border-l border-white/15">المادة الدراسية</th>
                              <th className="px-3 text-center border-l border-white/15 bg-white/10 font-bold">
                                السعي السنوي (من 100)
                              </th>
                              <th className="px-3 text-center border-l border-white/15 bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                                الامتحان النهائي (الفاينل)
                              </th>
                              <th className="px-4 text-center border-l border-white/15 bg-white/25 font-bold text-sm">
                                الدرجة النهائية (من 100)
                              </th>
                              <th className="px-3 text-center border-l border-white/15">التقدير</th>
                              <th className="px-3 text-center border-l border-white/15">القرار النهائي</th>
                              <th className="px-3 text-center">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high font-mono">
                            {finalSummary.evaluatedSubjects.map((sub, i) => (
                              <tr key={i} className="even:bg-surface-container-low/40">
                                <td className="px-3 py-2.5 text-center text-on-surface-variant font-bold border-l border-surface-container-high">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-2.5 font-Cairo font-bold text-primary border-l border-surface-container-high">
                                  {sub.subjectName}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-primary bg-white/5 border-l border-surface-container-high">
                                  {sub.annualEffort}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold bg-tertiary-fixed/30 text-on-tertiary-fixed border-l border-surface-container-high">
                                  {sub.finalExam}
                                </td>
                                <td
                                  className={`px-4 py-2.5 text-center font-bold text-sm border-l border-surface-container-high ${
                                    sub.finalScore < 50 ? "text-error font-black" : "text-primary font-black"
                                  }`}
                                >
                                  {sub.finalScore}
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container-high">
                                  {sub.gradeWord}
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo border-l border-surface-container-high">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      sub.finalScore >= 50
                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                        : sub.finalScore >= 45
                                        ? "bg-[#FFF3E0] text-[#B25000]"
                                        : "bg-[#FFEBEE] text-[#B71C1C]"
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-Cairo text-[11px] text-on-surface-variant">
                                  {sub.note || (sub.isPassing ? "مستوفٍ رسمياً" : "إعادة بالدور الثاني")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-surface-container-high font-bold">
                              <td colSpan={4} className="px-4 py-2.5 font-Cairo text-primary">
                                المجموع الكلي والمعدل العام النهائي:
                              </td>
                              <td className="px-4 py-2.5 text-center text-primary font-bold text-sm font-mono border-l border-surface-container">
                                {finalSummary.totalScore}
                                <span className="text-[10px] text-on-surface-variant mr-1">
                                  / {finalSummary.maxScore}
                                </span>
                              </td>
                              <td colSpan={3} className="px-4 py-2.5 font-Cairo text-primary text-sm">
                                المعدل العام:{" "}
                                <strong className="font-mono text-base ml-2">{finalSummary.average}%</strong>
                                — القرار الوزاري:{" "}
                                <span
                                  className={`font-bold mr-1 ${
                                    finalSummary.failedCount === 0 ? "text-[#1B5E20]" : "text-[#B71C1C]"
                                  }`}
                                >
                                  {finalSummary.decision}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* 3. COMPREHENSIVE TABLE: Full ledger for archive when explicitly chosen */}
                    {printExamType === "comprehensive" && (
                      <div className="border border-surface-container-highest rounded-lg overflow-hidden">
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className="bg-primary text-on-primary font-bold h-9">
                              <th className="px-3 border-l border-white/15">المادة الدراسية</th>
                              <th className="px-2 text-center">ش1 (ف1)</th>
                              <th className="px-2 text-center">ش2 (ف1)</th>
                              <th className="px-2 text-center bg-white/10">معدل ف1</th>
                              <th className="px-2 text-center bg-secondary-container text-on-secondary-container">
                                نصف السنة
                              </th>
                              <th className="px-2 text-center">ش1 (ك2)</th>
                              <th className="px-2 text-center">ش2 (ك2)</th>
                              <th className="px-2 text-center bg-white/10">معدل ك2</th>
                              <th className="px-2 text-center bg-white/20">السعي السنوي</th>
                              <th className="px-2 text-center bg-tertiary-fixed text-on-tertiary-fixed">
                                الفاينل
                              </th>
                              <th className="px-2 text-center bg-white/25 font-bold">الدرجة النهائية</th>
                              <th className="px-3 text-center">التقدير</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high font-mono">
                            {comprehensiveSummary.evaluatedSubjects.map((sub, i) => (
                              <tr key={i} className="even:bg-surface-container-low/40">
                                <td className="px-3 py-2 font-Cairo font-bold text-primary border-l border-surface-container-high">
                                  {sub.subjectName}
                                </td>
                                <td className="px-2 py-2 text-center">{sub.month1}</td>
                                <td className="px-2 py-2 text-center">{sub.month2}</td>
                                <td className="px-2 py-2 text-center font-bold bg-surface-container/40">
                                  {sub.term1Avg}
                                </td>
                                <td className="px-2 py-2 text-center font-bold text-secondary bg-secondary-container/20">
                                  {sub.midterm}
                                </td>
                                <td className="px-2 py-2 text-center">{sub.course2Month1}</td>
                                <td className="px-2 py-2 text-center">{sub.course2Month2}</td>
                                <td className="px-2 py-2 text-center font-bold bg-surface-container/40">
                                  {sub.course2Avg}
                                </td>
                                <td className="px-2 py-2 text-center font-bold text-primary">
                                  {sub.annualEffort}
                                </td>
                                <td className="px-2 py-2 text-center font-bold bg-tertiary-fixed/30 text-on-tertiary-fixed">
                                  {sub.finalExam}
                                </td>
                                <td
                                  className={`px-2 py-2 text-center font-bold text-sm ${
                                    sub.finalScore < 50 ? "text-error" : "text-primary"
                                  }`}
                                >
                                  {sub.finalScore}
                                </td>
                                <td className="px-3 py-2 text-center font-Cairo">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      sub.finalScore >= 50
                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                        : sub.finalScore >= 45
                                        ? "bg-[#FFF3E0] text-[#B25000]"
                                        : "bg-[#FFEBEE] text-[#B71C1C]"
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-surface-container-high font-bold">
                              <td colSpan={10} className="px-4 py-2 font-Cairo text-primary">
                                المجموع الكلي والمعدل العام:
                              </td>
                              <td className="px-2 py-2 text-center text-primary font-bold text-sm">
                                {comprehensiveSummary.totalScore}
                              </td>
                              <td className="px-3 py-2 text-center text-primary font-bold text-sm">
                                {comprehensiveSummary.average}%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* Official Signatures & Seal */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-container-high text-center text-xs font-bold text-primary">
                      {printExamType === "midterm" ? (
                        <>
                          <div>
                            <div>مرشد الصف والتدقيق</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              أ. حامد جاسم الشمري
                            </div>
                          </div>
                          <div>
                            <div>لجنة امتحانات نصف السنة</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              أ. مازن طارق الكرخي
                            </div>
                          </div>
                          <div>
                            <div>مدير المدرسة (المصادقة الرسمية)</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              {schoolConfig?.principalName || "مدير المدرسة"}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div>رئيس اللجنة الامتحانية والتدقيق</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              {schoolConfig?.examCommitteeHead || schoolConfig?.principalName || "رئيس اللجنة الامتحانية"}
                            </div>
                          </div>
                          <div>
                            <div>المعاون العلمي ولجنة الامتحانات</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              {schoolConfig?.vicePrincipalName || "المعاون العلمي"}
                            </div>
                          </div>
                          <div>
                            <div>مدير المدرسة (الختم والمصادقة الوزارية)</div>
                            <div className="text-on-surface-variant font-normal mt-1">
                              {schoolConfig?.principalName || "مدير المدرسة"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 5. MODAL: FULL CLASS RESULTS SHEET PRINT (استمارة ٤٤ الوزارية) */}
      {/* ======================================================== */}
      {showClassPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden print:w-full print:shadow-none print:rounded-none">
            {/* Modal Controls (Hidden when printing) */}
            <div className="no-print bg-primary text-on-primary px-space-lg py-space-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">print</span>
                <span className="font-headline-sm text-headline-sm font-bold">
                  شيت سجل درجات ونتائج الصف العام (استمارة ٤٤ الوزارية الرسمية)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = " ";
                    window.print();
                    setTimeout(() => {
                      document.title = originalTitle;
                    }, 600);
                    onNotify(
                      `تم إرسال شيت نتائج الصف (${currentGradeLabel} - ${section}) للطباعة الرسمية`
                    );
                  }}
                  className="px-4 py-1.5 bg-secondary text-white font-bold rounded-lg text-label-sm flex items-center gap-1 cursor-pointer hover:bg-secondary/90"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>طباعة شيت الصف (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportClassToExcel}
                  className="px-3 py-1.5 bg-[#1B5E20] text-white font-bold rounded-lg text-label-sm flex items-center gap-1 cursor-pointer hover:bg-[#2E7D32]"
                >
                  <span className="material-symbols-outlined text-[18px]">table_view</span>
                  <span>تصدير إكسل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClassPrintModal(false)}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
            </div>

            {/* Guidance Bar for Principal (Clean Print Tips - Hidden when printing) */}
            <div className="no-print bg-emerald-50 border-b border-emerald-200 px-space-lg py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0">verified</span>
                <span>
                  <strong>توجيه مهم للمدير (طباعة رسمية نظيفة خالية من الروابط):</strong> تم إعداد هذا الشيت تلقائياً بمقاس A4 أفقي رسمي بدون أي روابط أو تواريخ متصفح. إذا ظهر رابط الموقع أو اسم النظام، يرجى إزالة علامة الصح عن خيار <strong>(الرؤوس والتذييلات / Headers and footers)</strong> من إعدادات الطباعة.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = " ";
                  window.print();
                  setTimeout(() => {
                    document.title = originalTitle;
                  }, 600);
                }}
                className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>طباعة الآن (Ctrl + P)</span>
              </button>
            </div>

            {/* Official Printable Class Sheet Document */}
            <div className="official-print-document p-8 space-y-4 bg-white text-on-surface">
              {/* MoE Official Header */}
              <div className="flex items-center justify-between border-b-2 border-primary pb-4">
                <div className="text-right space-y-0.5 text-xs font-bold text-primary">
                  <div>جمهورية العراق - وزارة التربية</div>
                  <div>{schoolConfig?.directorate || "المديرية العامة لتربية بغداد / الكرخ الأولى"}</div>
                  <div>إدارة {schoolConfig?.schoolName || "ثانوية المتميزين للبنين"}</div>
                  <div>اللجنة الامتحانية المركزية</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={schoolConfig?.ministryLogoUrl || MINISTRY_LOGO_URL}
                    alt="شعار وزارة التربية"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain mb-1"
                  />
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">
                    سجل فحص وتدقيق الدرجات والنتائج النهائية (استمارة ٤٤)
                  </h2>
                  <div className="text-xs font-bold text-secondary">
                    الصف: {currentGradeLabel} — {section} • العام الدراسي: {schoolConfig?.academicYear || "2024 - 2025"}
                  </div>
                </div>
                <div className="text-left text-xs font-mono bg-surface-container-low p-2.5 rounded-lg border border-surface-container-high space-y-1">
                  {schoolConfig?.schoolLogoUrl && (
                    <img
                      src={schoolConfig.schoolLogoUrl}
                      alt="شعار المدرسة"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain ml-auto mb-1 rounded"
                    />
                  )}
                  <div>المرحلة: {STAGE_LABELS[stage]}</div>
                  <div>العدد الكلي: {classStats.totalStudents} طالب</div>
                  <div>نسبة النجاح: {classStats.passRate}%</div>
                </div>
              </div>

              {/* Master Ledger Table */}
              <div className="border border-surface-container-highest rounded-lg overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-primary text-on-primary font-bold h-10">
                      <th className="px-2 text-center border-l border-white/15 w-8">ت</th>
                      <th className="px-3 border-l border-white/15 w-24">الرقم الإحصائي</th>
                      <th className="px-3 border-l border-white/15 w-24">الرقم الإداري</th>
                      <th className="px-4 border-l border-white/15 min-w-[150px]">اسم الطالب الرباعي</th>
                      {stageSubjects.map((sub) => (
                        <th key={sub} className="px-2 text-center border-l border-white/15 text-[11px]">
                          {sub}
                        </th>
                      ))}
                      <th className="px-2 text-center border-l border-white/15 bg-white/15 font-bold">
                        المجموع
                      </th>
                      <th className="px-2 text-center border-l border-white/15 bg-white/20 font-bold">
                        المعدل
                      </th>
                      <th className="px-3 text-center">القرار الوزاري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high font-mono text-[11px]">
                    {classStudents.map((st, idx) => {
                      const summary = computeStudentSummary(st);
                      return (
                        <tr key={st.studentId} className="even:bg-surface-container-low/40">
                          <td className="px-2 py-2 text-center font-bold border-l border-surface-container-high">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 text-primary font-bold border-l border-surface-container-high">
                            {st.ministryId}
                          </td>
                          <td className="px-3 py-2 text-secondary font-bold border-l border-surface-container-high">
                            {st.adminId}
                          </td>
                          <td className="px-4 py-2 font-Cairo font-bold text-on-surface border-l border-surface-container-high">
                            {st.studentName}
                          </td>
                          {stageSubjects.map((subName) => {
                            const sub = summary.evaluatedSubjects.find(
                              (s) => s.subjectName === subName
                            );
                            const score = sub ? sub.finalScore : "-";
                            const isFail = typeof score === "number" && score < 50;
                            return (
                              <td
                                key={subName}
                                className={`px-2 py-2 text-center font-bold border-l border-surface-container-high ${
                                  isFail ? "text-error bg-error/5" : "text-on-surface"
                                }`}
                              >
                                {score}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center font-bold text-primary bg-primary/5 border-l border-surface-container-high">
                            {summary.totalScore}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-primary bg-primary/10 border-l border-surface-container-high">
                            {summary.average}%
                          </td>
                          <td className="px-3 py-2 text-center font-Cairo font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                summary.failedCount === 0
                                  ? "bg-[#E8F5E9] text-[#1B5E20]"
                                  : summary.failedCount <= 2
                                  ? "bg-[#FFF3E0] text-[#B25000]"
                                  : "bg-[#FFEBEE] text-[#B71C1C]"
                              }`}
                            >
                              {summary.decision}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statistical Summary Box */}
              <div className="grid grid-cols-4 gap-3 bg-surface-container-low p-3 rounded-lg border border-surface-container-high text-center text-xs">
                <div>
                  <span className="text-on-surface-variant block">عدد الطلاب الكلي:</span>
                  <span className="font-bold text-primary text-sm">{classStats.totalStudents}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">عدد الناجحين:</span>
                  <span className="font-bold text-[#1B5E20] text-sm">{classStats.totalPass}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">عدد المكملين:</span>
                  <span className="font-bold text-[#B25000] text-sm">{classStats.totalDecision}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">نسبة النجاح العامة:</span>
                  <span className="font-bold text-primary text-sm">{classStats.passRate}%</span>
                </div>
              </div>

              {/* Official Signatures Block */}
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-surface-container-high text-center text-xs font-bold text-primary">
                <div>
                  <div>عضو لجنة الامتحانات</div>
                  <div className="text-on-surface-variant font-normal mt-1">
                    أ. حامد جاسم الشمري
                  </div>
                </div>
                <div>
                  <div>مدقق الدرجات والسجل</div>
                  <div className="text-on-surface-variant font-normal mt-1">
                    أ. سعدون كاظم العبيدي
                  </div>
                </div>
                <div>
                  <div>المعاون العلمي</div>
                  <div className="text-on-surface-variant font-normal mt-1">
                    أ. مازن طارق الكرخي
                  </div>
                </div>
                <div>
                  <div>مدير المدرسة والختم الرسمي</div>
                  <div className="text-on-surface-variant font-normal mt-1">
                    {schoolConfig?.principalName || "مدير المدرسة"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: AUDIT LOG */}
      {/* ======================================================== */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-bold">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
                <span>سجل التدقيق والمصادقة الرقمية (استمارة ٤٤)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-space-lg space-y-3 text-body-sm font-body-sm">
              <div className="p-3 bg-surface-container-low rounded-lg flex items-start justify-between">
                <div>
                  <div className="font-bold text-primary">
                    مصادقة المشرف الاختصاصي (د. رياض خليل العاني)
                  </div>
                  <div className="text-on-surface-variant text-xs">
                    مطابقة الدفتر الامتحاني مع القوائم المركزية - تربية الكرخ الأولى
                  </div>
                </div>
                <span className="font-mono text-secondary font-bold text-xs">2025/02/16</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg flex items-start justify-between">
                <div>
                  <div className="font-bold text-primary">
                    إدخال وتدقيق مدرس المادة ولجنة التدقيق
                  </div>
                  <div className="text-on-surface-variant text-xs">
                    رصد درجات الفصول ونصف السنة والنهائي وفق المعايير الوزارية
                  </div>
                </div>
                <span className="font-mono text-secondary font-bold text-xs">2025/02/14</span>
              </div>
            </div>
            <div className="bg-surface-container-low px-space-lg py-space-sm flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-space-md py-1.5 bg-primary text-on-primary rounded-lg font-bold text-label-md cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
