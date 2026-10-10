export const MINISTRY_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1V33bKW5bKrkfhXFoemLjGRlVyX2kI1daVBjkmOdghh5MnhWdZ36P5dL_ETsUDXlq8wyq7yVumBXr6Zl-4_UDEKfMsrIfMVjn-e3Q62syNDI5TLUeFKStSDP7WDWvH0KnANLSR4K8jEX-VSgsQE1RCdhyTZ3N1EkqWN2x1zNiLOjh38BRsqMY7NX-HHNiDL7_zpsLTKmAEK1PmLGeeiCUhogM42MsBIhNpiK8osSfD20I-IQeT7xk8mH2Y";

export type StageKey = "primary" | "intermediate" | "preparatory";

export const STAGE_LABELS: Record<StageKey, string> = {
  primary: "المرحلة الابتدائية",
  intermediate: "المرحلة المتوسطة",
  preparatory: "المرحلة الإعدادية",
};

export interface GradeOption {
  code: string;
  label: string;
  stage: StageKey;
}

export const STAGE_GRADES: Record<StageKey, GradeOption[]> = {
  primary: [
    { code: "p1", label: "الأول الابتدائي", stage: "primary" },
    { code: "p2", label: "الثاني الابتدائي", stage: "primary" },
    { code: "p3", label: "الثالث الابتدائي", stage: "primary" },
    { code: "p4", label: "الرابع الابتدائي", stage: "primary" },
    { code: "p5", label: "الخامس الابتدائي", stage: "primary" },
    { code: "p6", label: "السادس الابتدائي", stage: "primary" },
  ],
  intermediate: [
    { code: "m1", label: "الأول المتوسط", stage: "intermediate" },
    { code: "m2", label: "الثاني المتوسط", stage: "intermediate" },
    { code: "m3", label: "الثالث المتوسط", stage: "intermediate" },
  ],
  preparatory: [
    { code: "4s", label: "الرابع العلمي", stage: "preparatory" },
    { code: "4l", label: "الرابع الأدبي", stage: "preparatory" },
    { code: "5s", label: "الخامس العلمي", stage: "preparatory" },
    { code: "5l", label: "الخامس الأدبي", stage: "preparatory" },
    { code: "6s", label: "السادس العلمي", stage: "preparatory" },
    { code: "6l", label: "السادس الأدبي", stage: "preparatory" },
  ],
};

export const ALL_GRADES: GradeOption[] = [
  ...STAGE_GRADES.primary,
  ...STAGE_GRADES.intermediate,
  ...STAGE_GRADES.preparatory,
];

export const SUBJECTS_BY_STAGE: Record<StageKey, string[]> = {
  primary: [
    "التربية الإسلامية",
    "القراءة العربية",
    "اللغة الإنجليزية",
    "الرياضيات",
    "العلوم",
    "الاجتماعيات",
  ],
  intermediate: [
    "التربية الإسلامية",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "الرياضيات",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "الاجتماعيات",
  ],
  preparatory: [
    "الرياضيات (Mathematics)",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التربية الإسلامية",
  ],
};

export interface GradeRecord {
  id: number;
  ministryId: string;
  adminId: string;
  studentName: string;
  month1: number;
  month2: number;
  midterm: number;
  course2Month1: number;
  course2Month2: number;
  finalExam: number;
  note: string;
  stage: StageKey;
  gradeCode: string;
  gradeClass: string;
  section: string;
  subject: string;
}

export interface SubjectGradeItem {
  subjectName: string;
  month1: number;
  month2: number;
  midterm: number;
  course2Month1: number;
  course2Month2: number;
  finalExam: number;
  note?: string;
}

export interface StudentMultiSubjectGrade {
  studentId: string;
  ministryId: string;
  adminId: string;
  studentName: string;
  stage: StageKey;
  gradeCode: string;
  gradeClass: string;
  section: string;
  subjects: SubjectGradeItem[];
  notes?: string;
}

export function computeSubjectRow(sub: SubjectGradeItem) {
  const term1Avg = Math.round((sub.month1 + sub.month2) / 2);
  const course2Avg = Math.round((sub.course2Month1 + sub.course2Month2) / 2);
  const annualEffort = Math.round((term1Avg + sub.midterm + course2Avg) / 3);
  const finalScore = Math.round((annualEffort + sub.finalExam) / 2);
  const isPassing = finalScore >= 50;
  const isDecision = finalScore >= 45 && finalScore < 50;
  const status = isPassing ? "ناجح" : isDecision ? "مكمل (قرار)" : "راسب";
  return {
    term1Avg,
    course2Avg,
    annualEffort,
    finalScore,
    isPassing,
    status,
  };
}

export function computeStudentSummary(record: StudentMultiSubjectGrade) {
  const evaluatedSubjects = record.subjects.map((s) => ({
    ...s,
    ...computeSubjectRow(s),
  }));
  const totalScore = evaluatedSubjects.reduce((acc, curr) => acc + curr.finalScore, 0);
  const maxScore = evaluatedSubjects.length * 100;
  const average =
    evaluatedSubjects.length > 0
      ? parseFloat((totalScore / evaluatedSubjects.length).toFixed(1))
      : 0;
  const failedSubjects = evaluatedSubjects.filter((s) => s.finalScore < 50);
  const failedCount = failedSubjects.length;

  let decision = "ناجح";
  if (failedCount === 0) {
    decision = average >= 85 ? "ناجح بتفوق" : "ناجح";
  } else if (failedCount === 1) {
    decision = "مكمل (درس واحد)";
  } else if (failedCount === 2) {
    decision = "مكمل (درسين)";
  } else {
    decision = "راسب (الدور الأول)";
  }

  return {
    evaluatedSubjects,
    totalScore,
    maxScore,
    average,
    failedCount,
    decision,
  };
}

// Compute Midterm (نصف السنة) Specific Summary
export function computeMidtermSummary(record: StudentMultiSubjectGrade) {
  const evaluatedSubjects = record.subjects.map((s) => {
    const term1Avg = Math.round((s.month1 + s.month2) / 2);
    const midtermScore = s.midterm;
    const isPassing = midtermScore >= 50;
    let gradeWord = "راسب";
    if (midtermScore >= 90) gradeWord = "امتياز";
    else if (midtermScore >= 80) gradeWord = "جيد جداً";
    else if (midtermScore >= 70) gradeWord = "جيد";
    else if (midtermScore >= 60) gradeWord = "متوسط";
    else if (midtermScore >= 50) gradeWord = "مقبول";

    return {
      subjectName: s.subjectName,
      month1: s.month1,
      month2: s.month2,
      term1Avg,
      midterm: midtermScore,
      isPassing,
      status: isPassing ? "ناجح" : "راسب",
      gradeWord,
      note: s.note || "",
    };
  });

  const totalScore = evaluatedSubjects.reduce((acc, curr) => acc + curr.midterm, 0);
  const maxScore = evaluatedSubjects.length * 100;
  const average =
    evaluatedSubjects.length > 0
      ? parseFloat((totalScore / evaluatedSubjects.length).toFixed(1))
      : 0;
  const failedSubjects = evaluatedSubjects.filter((s) => !s.isPassing);
  const failedCount = failedSubjects.length;

  let decision = "ناجح في نصف السنة";
  if (failedCount === 0) {
    decision = average >= 85 ? "ناجح بتفوق (نصف السنة)" : "ناجح في نصف السنة";
  } else if (failedCount === 1) {
    decision = "مكمل في نصف السنة (درس واحد)";
  } else if (failedCount === 2) {
    decision = "مكمل في نصف السنة (درسين)";
  } else {
    decision = `راسب في نصف السنة (${failedCount} دروس)`;
  }

  return {
    evaluatedSubjects,
    totalScore,
    maxScore,
    average,
    failedCount,
    decision,
  };
}

// Compute End-of-Year / Final (نهاية السنة / الدور الأول) Specific Summary
export function computeFinalSummary(record: StudentMultiSubjectGrade) {
  const evaluatedSubjects = record.subjects.map((s) => {
    const term1Avg = Math.round((s.month1 + s.month2) / 2);
    const course2Avg = Math.round((s.course2Month1 + s.course2Month2) / 2);
    const annualEffort = Math.round((term1Avg + s.midterm + course2Avg) / 3);
    const finalScore = Math.round((annualEffort + s.finalExam) / 2);
    const isPassing = finalScore >= 50;
    const isDecision = finalScore >= 45 && finalScore < 50;
    const status = isPassing ? "ناجح" : isDecision ? "مكمل (قرار)" : "راسب";

    let gradeWord = "راسب";
    if (finalScore >= 90) gradeWord = "امتياز";
    else if (finalScore >= 80) gradeWord = "جيد جداً";
    else if (finalScore >= 70) gradeWord = "جيد";
    else if (finalScore >= 60) gradeWord = "متوسط";
    else if (finalScore >= 50) gradeWord = "مقبول";

    return {
      subjectName: s.subjectName,
      annualEffort,
      finalExam: s.finalExam,
      finalScore,
      isPassing,
      status,
      gradeWord,
      note: s.note || "",
    };
  });

  const totalScore = evaluatedSubjects.reduce((acc, curr) => acc + curr.finalScore, 0);
  const maxScore = evaluatedSubjects.length * 100;
  const average =
    evaluatedSubjects.length > 0
      ? parseFloat((totalScore / evaluatedSubjects.length).toFixed(1))
      : 0;
  const failedSubjects = evaluatedSubjects.filter((s) => s.finalScore < 50);
  const failedCount = failedSubjects.length;

  let decision = "ناجح";
  if (failedCount === 0) {
    decision = average >= 85 ? "ناجح بتفوق" : "ناجح";
  } else if (failedCount === 1) {
    decision = "مكمل (درس واحد)";
  } else if (failedCount === 2) {
    decision = "مكمل (درسين)";
  } else {
    decision = "راسب (الدور الأول)";
  }

  return {
    evaluatedSubjects,
    totalScore,
    maxScore,
    average,
    failedCount,
    decision,
  };
}

export function generateDefaultSubjectsForStudent(
  stage: StageKey,
  basePerformance: "excellent" | "good" | "medium" | "weak" = "good"
): SubjectGradeItem[] {
  const subjectNames = SUBJECTS_BY_STAGE[stage] || SUBJECTS_BY_STAGE.preparatory;

  const offsets: Record<string, number> = {
    excellent: 92,
    good: 78,
    medium: 64,
    weak: 42,
  };
  const base = offsets[basePerformance] || 75;

  return subjectNames.map((name, i) => {
    // slight variation per subject
    const delta = ((i * 7) % 11) - 4;
    const m1 = Math.min(100, Math.max(30, base + delta));
    const m2 = Math.min(100, Math.max(30, base + delta - 2));
    const mid = Math.min(100, Math.max(30, base + delta + 1));
    const c2m1 = Math.min(100, Math.max(30, base + delta + 3));
    const c2m2 = Math.min(100, Math.max(30, base + delta));
    const fin = Math.min(100, Math.max(30, base + delta + 2));

    return {
      subjectName: name,
      month1: m1,
      month2: m2,
      midterm: mid,
      course2Month1: c2m1,
      course2Month2: c2m2,
      finalExam: fin,
      note: basePerformance === "excellent" ? "متفوق" : "",
    };
  });
}

export const INITIAL_STUDENT_MULTI_GRADES: StudentMultiSubjectGrade[] = [
  {
    studentId: "st-7",
    ministryId: "IQ-2024-51001",
    adminId: "ADM-24-101",
    studentName: "علي حسين كريم الدليمي",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    notes: "متميز - مرشح للإعفاء العام",
    subjects: [
      { subjectName: "الرياضيات (Mathematics)", month1: 92, month2: 88, midterm: 94, course2Month1: 95, course2Month2: 91, finalExam: 96, note: "متميز" },
      { subjectName: "الفيزياء", month1: 89, month2: 91, midterm: 90, course2Month1: 94, course2Month2: 92, finalExam: 95 },
      { subjectName: "الكيمياء", month1: 93, month2: 90, midterm: 92, course2Month1: 96, course2Month2: 95, finalExam: 94 },
      { subjectName: "الأحياء", month1: 88, month2: 86, midterm: 91, course2Month1: 90, course2Month2: 89, finalExam: 92 },
      { subjectName: "اللغة العربية", month1: 85, month2: 87, midterm: 89, course2Month1: 88, course2Month2: 86, finalExam: 90 },
      { subjectName: "اللغة الإنجليزية", month1: 94, month2: 92, midterm: 95, course2Month1: 96, course2Month2: 94, finalExam: 98 },
      { subjectName: "التربية الإسلامية", month1: 98, month2: 96, midterm: 99, course2Month1: 97, course2Month2: 98, finalExam: 100 },
    ],
  },
  {
    studentId: "st-8",
    ministryId: "IQ-2024-51004",
    adminId: "ADM-24-104",
    studentName: "كرار عمار فاضل الزيدي",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    notes: "مستوى جيد جداً",
    subjects: [
      { subjectName: "الرياضيات (Mathematics)", month1: 88, month2: 84, midterm: 89, course2Month1: 86, course2Month2: 90, finalExam: 91 },
      { subjectName: "الفيزياء", month1: 82, month2: 85, midterm: 84, course2Month1: 88, course2Month2: 86, finalExam: 87 },
      { subjectName: "الكيمياء", month1: 85, month2: 81, midterm: 83, course2Month1: 86, course2Month2: 87, finalExam: 89 },
      { subjectName: "الأحياء", month1: 80, month2: 82, midterm: 85, course2Month1: 84, course2Month2: 83, finalExam: 86 },
      { subjectName: "اللغة العربية", month1: 78, month2: 80, midterm: 82, course2Month1: 81, course2Month2: 79, finalExam: 84 },
      { subjectName: "اللغة الإنجليزية", month1: 89, month2: 91, midterm: 88, course2Month1: 92, course2Month2: 90, finalExam: 93 },
      { subjectName: "التربية الإسلامية", month1: 95, month2: 94, midterm: 96, course2Month1: 95, course2Month2: 97, finalExam: 98 },
    ],
  },
  {
    studentId: "st-7-2",
    ministryId: "IQ-2024-51002",
    adminId: "ADM-24-102",
    studentName: "محمد باقر جاسم الربيعي",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    notes: "مستوى جيد ومستقر",
    subjects: [
      { subjectName: "الرياضيات (Mathematics)", month1: 78, month2: 72, midterm: 80, course2Month1: 76, course2Month2: 82, finalExam: 84 },
      { subjectName: "الفيزياء", month1: 74, month2: 76, midterm: 78, course2Month1: 80, course2Month2: 75, finalExam: 79 },
      { subjectName: "الكيمياء", month1: 76, month2: 74, midterm: 79, course2Month1: 78, course2Month2: 81, finalExam: 82 },
      { subjectName: "الأحياء", month1: 72, month2: 70, midterm: 75, course2Month1: 77, course2Month2: 74, finalExam: 78 },
      { subjectName: "اللغة العربية", month1: 70, month2: 73, midterm: 74, course2Month1: 75, course2Month2: 72, finalExam: 76 },
      { subjectName: "اللغة الإنجليزية", month1: 82, month2: 80, midterm: 84, course2Month1: 85, course2Month2: 83, finalExam: 86 },
      { subjectName: "التربية الإسلامية", month1: 90, month2: 88, midterm: 92, course2Month1: 91, course2Month2: 93, finalExam: 94 },
    ],
  },
  {
    studentId: "st-7-3",
    ministryId: "IQ-2024-51003",
    adminId: "ADM-24-103",
    studentName: "سجاد حيدر عبد الأمير الجبوري",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    notes: "مستحق لمعالجة القرار (مكمل بدرس واحد)",
    subjects: [
      { subjectName: "الرياضيات (Mathematics)", month1: 46, month2: 48, midterm: 51, course2Month1: 50, course2Month2: 46, finalExam: 49, note: "مكمل بقرار" },
      { subjectName: "الفيزياء", month1: 55, month2: 58, midterm: 60, course2Month1: 62, course2Month2: 59, finalExam: 61 },
      { subjectName: "الكيمياء", month1: 52, month2: 50, midterm: 54, course2Month1: 56, course2Month2: 53, finalExam: 55 },
      { subjectName: "الأحياء", month1: 60, month2: 63, midterm: 62, course2Month1: 65, course2Month2: 61, finalExam: 64 },
      { subjectName: "اللغة العربية", month1: 58, month2: 55, midterm: 59, course2Month1: 60, course2Month2: 57, finalExam: 62 },
      { subjectName: "اللغة الإنجليزية", month1: 64, month2: 66, midterm: 68, course2Month1: 70, course2Month2: 67, finalExam: 69 },
      { subjectName: "التربية الإسلامية", month1: 85, month2: 82, midterm: 88, course2Month1: 86, course2Month2: 89, finalExam: 90 },
    ],
  },
  {
    studentId: "st-7-5",
    ministryId: "IQ-2024-51005",
    adminId: "ADM-24-105",
    studentName: "زيد رافد محمود السامرائي",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    notes: "مكمل بدرسين (الرياضيات والفيزياء)",
    subjects: [
      { subjectName: "الرياضيات (Mathematics)", month1: 38, month2: 35, midterm: 40, course2Month1: 42, course2Month2: 36, finalExam: 39, note: "إكمال" },
      { subjectName: "الفيزياء", month1: 42, month2: 40, midterm: 45, course2Month1: 44, course2Month2: 41, finalExam: 43, note: "إكمال" },
      { subjectName: "الكيمياء", month1: 55, month2: 58, midterm: 60, course2Month1: 62, course2Month2: 59, finalExam: 61 },
      { subjectName: "الأحياء", month1: 52, month2: 54, midterm: 56, course2Month1: 58, course2Month2: 55, finalExam: 57 },
      { subjectName: "اللغة العربية", month1: 50, month2: 52, midterm: 54, course2Month1: 55, course2Month2: 51, finalExam: 53 },
      { subjectName: "اللغة الإنجليزية", month1: 56, month2: 58, midterm: 60, course2Month1: 62, course2Month2: 59, finalExam: 61 },
      { subjectName: "التربية الإسلامية", month1: 78, month2: 80, midterm: 82, course2Month1: 85, course2Month2: 81, finalExam: 84 },
    ],
  },
  {
    studentId: "st-1",
    ministryId: "IQ-2024-8841",
    adminId: "ADM-2024-1001",
    studentName: "علي حيدر كاظم الخفاجي",
    stage: "preparatory",
    gradeCode: "6s",
    gradeClass: "السادس العلمي",
    section: "الشعبة (أ)",
    notes: "أول على الشعبة - متفوق",
    subjects: [
      { subjectName: "التربية الإسلامية", month1: 98, month2: 99, midterm: 100, course2Month1: 99, course2Month2: 100, finalExam: 100, note: "درجة كاملة" },
      { subjectName: "اللغة العربية", month1: 92, month2: 94, midterm: 95, course2Month1: 96, course2Month2: 93, finalExam: 97 },
      { subjectName: "اللغة الإنجليزية", month1: 96, month2: 95, midterm: 98, course2Month1: 97, course2Month2: 99, finalExam: 99 },
      { subjectName: "الرياضيات (Mathematics)", month1: 95, month2: 98, midterm: 97, course2Month1: 99, course2Month2: 96, finalExam: 98 },
      { subjectName: "الفيزياء", month1: 94, month2: 93, midterm: 96, course2Month1: 97, course2Month2: 95, finalExam: 98 },
      { subjectName: "الكيمياء", month1: 93, month2: 96, midterm: 95, course2Month1: 98, course2Month2: 94, finalExam: 97 },
      { subjectName: "الأحياء", month1: 91, month2: 93, midterm: 94, course2Month1: 95, course2Month2: 92, finalExam: 96 },
    ],
  },
  {
    studentId: "st-2",
    ministryId: "IQ-2024-8842",
    adminId: "ADM-2024-1002",
    studentName: "مصطفى عمار فاضل الزيدي",
    stage: "preparatory",
    gradeCode: "6s",
    gradeClass: "السادس العلمي",
    section: "الشعبة (ب)",
    notes: "ناجح بتفوق",
    subjects: [
      { subjectName: "التربية الإسلامية", month1: 95, month2: 96, midterm: 98, course2Month1: 97, course2Month2: 96, finalExam: 98 },
      { subjectName: "اللغة العربية", month1: 88, month2: 86, midterm: 90, course2Month1: 89, course2Month2: 87, finalExam: 92 },
      { subjectName: "اللغة الإنجليزية", month1: 92, month2: 90, midterm: 94, course2Month1: 95, course2Month2: 93, finalExam: 96 },
      { subjectName: "الرياضيات (Mathematics)", month1: 90, month2: 88, midterm: 92, course2Month1: 94, course2Month2: 91, finalExam: 95 },
      { subjectName: "الفيزياء", month1: 87, month2: 89, midterm: 91, course2Month1: 93, course2Month2: 90, finalExam: 94 },
      { subjectName: "الكيمياء", month1: 89, month2: 87, midterm: 90, course2Month1: 92, course2Month2: 89, finalExam: 93 },
      { subjectName: "الأحياء", month1: 86, month2: 88, midterm: 89, course2Month1: 91, course2Month2: 88, finalExam: 92 },
    ],
  },
  {
    studentId: "st-9",
    ministryId: "IQ-2024-6210",
    adminId: "ADM-2024-2011",
    studentName: "الحسن علي محمود الكبيسي",
    stage: "intermediate",
    gradeCode: "m3",
    gradeClass: "الثالث المتوسط",
    section: "الشعبة (أ)",
    notes: "ناجح ومؤهل للامتحان الوزاري",
    subjects: [
      { subjectName: "التربية الإسلامية", month1: 92, month2: 95, midterm: 96, course2Month1: 94, course2Month2: 96, finalExam: 98 },
      { subjectName: "اللغة العربية", month1: 84, month2: 82, midterm: 86, course2Month1: 88, course2Month2: 85, finalExam: 89 },
      { subjectName: "اللغة الإنجليزية", month1: 88, month2: 86, midterm: 90, course2Month1: 92, course2Month2: 89, finalExam: 93 },
      { subjectName: "الرياضيات", month1: 80, month2: 78, midterm: 82, course2Month1: 85, course2Month2: 81, finalExam: 86 },
      { subjectName: "الفيزياء", month1: 82, month2: 85, midterm: 84, course2Month1: 87, course2Month2: 83, finalExam: 88 },
      { subjectName: "الكيمياء", month1: 85, month2: 82, midterm: 86, course2Month1: 88, course2Month2: 84, finalExam: 89 },
      { subjectName: "الأحياء", month1: 78, month2: 80, midterm: 83, course2Month1: 84, course2Month2: 80, finalExam: 85 },
      { subjectName: "الاجتماعيات", month1: 90, month2: 92, midterm: 94, course2Month1: 95, course2Month2: 93, finalExam: 96 },
    ],
  },
  {
    studentId: "st-11",
    ministryId: "IQ-2024-3104",
    adminId: "ADM-2024-3005",
    studentName: "أمير ياسر قحطان العبيدي",
    stage: "primary",
    gradeCode: "p6",
    gradeClass: "السادس الابتدائي",
    section: "الشعبة (أ)",
    notes: "تلميذ متفوق في المرحلة الابتدائية",
    subjects: [
      { subjectName: "التربية الإسلامية", month1: 98, month2: 100, midterm: 99, course2Month1: 100, course2Month2: 98, finalExam: 100 },
      { subjectName: "القراءة العربية", month1: 92, month2: 94, midterm: 95, course2Month1: 96, course2Month2: 93, finalExam: 97 },
      { subjectName: "اللغة الإنجليزية", month1: 90, month2: 92, midterm: 94, course2Month1: 95, course2Month2: 92, finalExam: 96 },
      { subjectName: "الرياضيات", month1: 94, month2: 92, midterm: 96, course2Month1: 97, course2Month2: 95, finalExam: 98 },
      { subjectName: "العلوم", month1: 91, month2: 93, midterm: 94, course2Month1: 96, course2Month2: 92, finalExam: 95 },
      { subjectName: "الاجتماعيات", month1: 95, month2: 96, midterm: 98, course2Month1: 97, course2Month2: 96, finalExam: 99 },
    ],
  },
  {
    studentId: "st-12",
    ministryId: "IQ-2024-3190",
    adminId: "ADM-2024-3006",
    studentName: "عباس فلاح حسن الشمري",
    stage: "primary",
    gradeCode: "p1",
    gradeClass: "الأول الابتدائي",
    section: "الشعبة (أ)",
    notes: "تلميذ نشط ومواظب",
    subjects: [
      { subjectName: "التربية الإسلامية", month1: 95, month2: 98, midterm: 97, course2Month1: 99, course2Month2: 96, finalExam: 98 },
      { subjectName: "القراءة العربية", month1: 90, month2: 92, midterm: 94, course2Month1: 95, course2Month2: 91, finalExam: 96 },
      { subjectName: "اللغة الإنجليزية", month1: 88, month2: 90, midterm: 92, course2Month1: 94, course2Month2: 89, finalExam: 93 },
      { subjectName: "الرياضيات", month1: 92, month2: 94, midterm: 95, course2Month1: 96, course2Month2: 93, finalExam: 97 },
      { subjectName: "العلوم", month1: 89, month2: 91, midterm: 93, course2Month1: 94, course2Month2: 90, finalExam: 95 },
      { subjectName: "الاجتماعيات", month1: 93, month2: 95, midterm: 96, course2Month1: 97, course2Month2: 94, finalExam: 98 },
    ],
  },
];

export const INITIAL_GRADES: GradeRecord[] = [
  {
    id: 1,
    ministryId: "IQ-2024-51001",
    adminId: "ADM-24-101",
    studentName: "علي حسين كريم الدليمي",
    month1: 92,
    month2: 88,
    midterm: 94,
    course2Month1: 95,
    course2Month2: 91,
    finalExam: 96,
    note: "متميز - مؤهل للإعفاء الفردي",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 2,
    ministryId: "IQ-2024-51002",
    adminId: "ADM-24-102",
    studentName: "محمد باقر جاسم الربيعي",
    month1: 78,
    month2: 72,
    midterm: 80,
    course2Month1: 76,
    course2Month2: 82,
    finalExam: 84,
    note: "مستوى جيد ومستقر",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 3,
    ministryId: "IQ-2024-51003",
    adminId: "ADM-24-103",
    studentName: "سجاد حيدر عبد الأمير الجبوري",
    month1: 46,
    month2: 48,
    midterm: 51,
    course2Month1: 50,
    course2Month2: 46,
    finalExam: 49,
    note: "مستحق لمعالجة القرار (الدرجات المضافة)",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 4,
    ministryId: "IQ-2024-51004",
    adminId: "ADM-24-104",
    studentName: "كرار عمار فاضل الزيدي",
    month1: 88,
    month2: 84,
    midterm: 89,
    course2Month1: 86,
    course2Month2: 90,
    finalExam: 91,
    note: "ملتزم بالواجبات الصفية",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 5,
    ministryId: "IQ-2024-51005",
    adminId: "ADM-24-105",
    studentName: "زيد رافد محمود السامرائي",
    month1: 38,
    month2: 35,
    midterm: 40,
    course2Month1: 42,
    course2Month2: 36,
    finalExam: 39,
    note: "غيابات متكررة غير مبررة",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 6,
    ministryId: "IQ-2024-51006",
    adminId: "ADM-24-106",
    studentName: "مصطفى أحمد رشيد العبيدي",
    month1: 95,
    month2: 98,
    midterm: 96,
    course2Month1: 99,
    course2Month2: 97,
    finalExam: 99,
    note: "المرتبة الأولى على الشعبة",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 7,
    ministryId: "IQ-2024-51007",
    adminId: "ADM-24-107",
    studentName: "عمر فاروق طه المشهداني",
    month1: 81,
    month2: 79,
    midterm: 82,
    course2Month1: 84,
    course2Month2: 80,
    finalExam: 85,
    note: "مشاركة نشطة في الأنشطة الصفية",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
  {
    id: 8,
    ministryId: "IQ-2024-51008",
    adminId: "ADM-24-108",
    studentName: "حيدر ليث سلمان الخفاجي",
    month1: 52,
    month2: 54,
    midterm: 50,
    course2Month1: 56,
    course2Month2: 52,
    finalExam: 58,
    note: "يحتاج إلى دروس تقوية إضافية",
    stage: "preparatory",
    gradeCode: "5s",
    gradeClass: "الخامس العلمي",
    section: "الشعبة (أ)",
    subject: "الرياضيات (Mathematics)",
  },
];

export interface StudentRecord {
  id: string;
  seq: string;
  avatar: string;
  avatarAlt: string;
  fullName: string;
  birthInfo: string;
  ministryId: string;
  adminId: string;
  nationalId: string;
  gradeSection: string;
  stageCode: StageKey;
  gradeCode: string;
  sectionCode: string;
  guardianName: string;
  guardianPhone: string;
  statusLabel: string;
  statusType: "active" | "transferred" | "deferred" | "withdrawn" | "dismissed";
  registrationDate: string;
  address?: string;
}

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "st-1",
    seq: "01",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHqdYtc2K2BXKuwq5KbL3Bfoq9K_-5HuNOiLPNZc0vkrjVSiDSDTtfgVt82uYcG5R8EzudmJdjJ9z6LlK5nyk0M8qbiFvxpdk2gAmMp851YYoO5oolmDW6vj-qrErbqpoVw8Zjd9Jc73ZepRBWlQoQJSZeBGmMkRoaLQlPP2H5VOEkX8Ocl67xAtc-Kz6DCFu3Wuv1Qs4oysgDGfiPlaWCgsMogXMfb5idIGvYVq3s4KUZL-UbDsQS",
    avatarAlt:
      "Official identification portrait photograph of an Iraqi male teenage student in school uniform.",
    fullName: "علي حيدر كاظم الخفاجي",
    birthInfo: "تولد: 2007/04/12 - بغداد/المنصور",
    ministryId: "IQ-2024-8841",
    adminId: "ADM-2024-1001",
    nationalId: "19042308119",
    gradeSection: "السادس العلمي (أ)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "a",
    guardianName: "حيدر كاظم (الأب)",
    guardianPhone: "+964 771 234 5678",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2021/09/20",
    address: "بغداد، الكرخ، المنصور، محلة 609، زقاق 14",
  },
  {
    id: "st-2",
    seq: "02",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_bbwbv5QEWpWbgF48Yrfa-kR10BF1NimyNBxZTHomawgndw5XtDdJA4hDlbBhtlq5P1HUwt4MNQpRgCZ5zdkZXaoeoUPRxqWFoFrgvSyhZqJTin-9Zvj610WrfWiEROADrnmpSd12c6bHLdsK40r7c1R6jjfxZxBskX0Y7Bo4bBquW4WuymGyQ_oUvbFFZeVmGiFoDsg7G8OY5R8TAjfCArDArILz8lerEpx9kGjZdObPU_-_dbU",
    avatarAlt:
      "Formal school passport photograph of a young Iraqi boy with neat black hair in school uniform.",
    fullName: "مصطفى عمار فاضل الزيدي",
    birthInfo: "تولد: 2007/08/25 - بغداد/اليرموك",
    ministryId: "IQ-2024-8842",
    adminId: "ADM-2024-1002",
    nationalId: "19048821093",
    gradeSection: "السادس العلمي (ب)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "b",
    guardianName: "عمار فاضل (الأب)",
    guardianPhone: "+964 780 987 6543",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2021/09/21",
    address: "بغداد، الكرخ، اليرموك، الأربع شوارع",
  },
  {
    id: "st-3",
    seq: "03",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWvz35MH9LGM19fIyDLSVxtkMyfR7oM6dxjNbA2VwJQZCUGM22eqfqvFFnuCU16YYw27QqGIVezDKRpGFlXRuwsU305KmomNuvevYVsZUlcqucY5xG6aHOeiVLMWY_q8qyoxk40Ph8y7Lfgk_lczAmq6EtSfMzdu0gOoaaVueYmiSL6IDnfvBEM7RUfqhFad-MwP3LQk7WPKyFswgzlbc4_gxgUTq_c1zJSTtUN5zjlDHq3o_sC2zn",
    avatarAlt:
      "Government ID photograph of a high school student in Iraq.",
    fullName: "زيد فراس عبد الكريم الجبوري",
    birthInfo: "تولد: 2006/11/03 - بغداد/الدورة",
    ministryId: "IQ-2024-8799",
    adminId: "ADM-2024-1003",
    nationalId: "19036712044",
    gradeSection: "السادس العلمي (أ)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "a",
    guardianName: "فراس عبد الكريم (الأب)",
    guardianPhone: "+964 770 112 3344",
    statusLabel: "منقول (تربية الرصافة 2)",
    statusType: "transferred",
    registrationDate: "2020/10/05",
    address: "بغداد، الكرخ، الدورة، حي الميكانيك",
  },
  {
    id: "st-4",
    seq: "04",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS0IAqm32YxERSuSfQzQRCTrcH21Bt-DGI9tHBBKSIqaXjy6YuhWEIRYrzJ32JF4bjc3yGCZV0SoHeQFfwlzZAhtlVxPJdaQXyczOVTeaERTF0CgXcSbF3u-_tJl5LGWR9jMbt_qIwUZfFDvTbtjDfi9p-5mno2Y8zEyaabn8kK_56WCkIo6o0jUGKoaoiuytSIFZN6JDracJMmSbAshbpBcDhKiqFCPQbijE15QwYC_ECkMQAH7KL",
    avatarAlt:
      "School ID headshot portrait of an Iraqi boy with short hair and glasses.",
    fullName: "محمد باقر وسام طارق التميمي",
    birthInfo: "تولد: 2007/02/19 - بغداد/الجامعة",
    ministryId: "IQ-2024-8850",
    adminId: "ADM-2024-1004",
    nationalId: "19041289441",
    gradeSection: "السادس العلمي (ج)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "c",
    guardianName: "د. وسام طارق (الأب)",
    guardianPhone: "+964 772 555 8899",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2021/09/25",
    address: "بغداد، الكرخ، حي الجامعة، محلة 635",
  },
  {
    id: "st-5",
    seq: "05",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWIL45ZWofr762pPOHyj_8bSsOnD5j6p9Pa-eX9BjgF0kNYutwEez6TSTrSydQbe3lRlCon6ORSroJYm6RZFM74RLlkSHNYWBFseqd_2D9PVVvdL7rnNF6Tmt9wM1hlmoxVZoXqmrwkCN5d7hrL5IzGpivSOElhMatqCocoAs7OoaSmUXwmhE-7AhUNymVZZov8VLCuPwPnpuykFvNk1ytHCK0XgJvIJFAvnsavfa3-geWUnGLx3fA",
    avatarAlt:
      "Student identification card style portrait of an Iraqi young male student.",
    fullName: "يوسف رائد صفاء الدين السعدي",
    birthInfo: "تولد: 2006/07/14 - بغداد/العامرية",
    ministryId: "IQ-2024-8710",
    adminId: "ADM-2024-1005",
    nationalId: "19035548123",
    gradeSection: "السادس العلمي (ب)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "b",
    guardianName: "رائد صفاء الدين (الأب)",
    guardianPhone: "+964 781 443 2211",
    statusLabel: "مؤجل بعذر مرضي",
    statusType: "deferred",
    registrationDate: "2020/09/18",
    address: "بغداد، الكرخ، العامرية، العمل الشعبي",
  },
  {
    id: "st-6",
    seq: "06",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDC91zTnlnDqPigbbpAtB-2bam_NMkjYn6p3TSprTRYFUbPzpC3Jsdqrz_wvHOhSruYSteP9T0SdAzBIvyqYQen6jLq3xskMTNipr2wIOu_VGB84Y5yTXRQ8AoMSEmjl7T9AoOnyd7jOKO0KbwqwffgXP8lFvYGPLz3L8Q0uKddCg4TqS4LKtporLTpJZYbXEIZcTtiYaRw5IeecdkGOy55zeAEGP3DncpXB9YAjle9zuHfuqvkcjmw",
    avatarAlt:
      "Academic profile photograph of a teenage male student from Baghdad.",
    fullName: "أحمد سرمد غازي المشهداني",
    birthInfo: "تولد: 2007/09/30 - بغداد/الغزالية",
    ministryId: "IQ-2024-8894",
    adminId: "ADM-2024-1006",
    nationalId: "19047712903",
    gradeSection: "السادس العلمي (د)",
    stageCode: "preparatory",
    gradeCode: "6s",
    sectionCode: "d",
    guardianName: "م. سرمد غازي (الأب)",
    guardianPhone: "+964 773 889 0012",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2021/09/22",
    address: "بغداد، الكرخ، الغزالية، الكفاءات",
  },
  {
    id: "st-7",
    seq: "07",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_bbwbv5QEWpWbgF48Yrfa-kR10BF1NimyNBxZTHomawgndw5XtDdJA4hDlbBhtlq5P1HUwt4MNQpRgCZ5zdkZXaoeoUPRxqWFoFrgvSyhZqJTin-9Zvj610WrfWiEROADrnmpSd12c6bHLdsK40r7c1R6jjfxZxBskX0Y7Bo4bBquW4WuymGyQ_oUvbFFZeVmGiFoDsg7G8OY5R8TAjfCArDArILz8lerEpx9kGjZdObPU_-_dbU",
    avatarAlt: "صورة طالب الخامس العلمي",
    fullName: "علي حسين كريم الدليمي",
    birthInfo: "تولد: 2008/02/14 - بغداد/المنصور",
    ministryId: "IQ-2024-51001",
    adminId: "ADM-2024-1007",
    nationalId: "19081123490",
    gradeSection: "الخامس العلمي (أ)",
    stageCode: "preparatory",
    gradeCode: "5s",
    sectionCode: "a",
    guardianName: "حسين كريم (الأب)",
    guardianPhone: "+964 771 445 8821",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2022/09/15",
    address: "بغداد، الكرخ، المنصور",
  },
  {
    id: "st-8",
    seq: "08",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS0IAqm32YxERSuSfQzQRCTrcH21Bt-DGI9tHBBKSIqaXjy6YuhWEIRYrzJ32JF4bjc3yGCZV0SoHeQFfwlzZAhtlVxPJdaQXyczOVTeaERTF0CgXcSbF3u-_tJl5LGWR9jMbt_qIwUZfFDvTbtjDfi9p-5mno2Y8zEyaabn8kK_56WCkIo6o0jUGKoaoiuytSIFZN6JDracJMmSbAshbpBcDhKiqFCPQbijE15QwYC_ECkMQAH7KL",
    avatarAlt: "صورة طالب الخامس العلمي",
    fullName: "كرار عمار فاضل الزيدي",
    birthInfo: "تولد: 2008/06/22 - بغداد/اليرموك",
    ministryId: "IQ-2024-51004",
    adminId: "ADM-2024-1008",
    nationalId: "19084451209",
    gradeSection: "الخامس العلمي (أ)",
    stageCode: "preparatory",
    gradeCode: "5s",
    sectionCode: "a",
    guardianName: "عمار فاضل (الأب)",
    guardianPhone: "+964 780 119 4432",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2022/09/16",
    address: "بغداد، الكرخ، اليرموك",
  },
  {
    id: "st-9",
    seq: "09",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_bbwbv5QEWpWbgF48Yrfa-kR10BF1NimyNBxZTHomawgndw5XtDdJA4hDlbBhtlq5P1HUwt4MNQpRgCZ5zdkZXaoeoUPRxqWFoFrgvSyhZqJTin-9Zvj610WrfWiEROADrnmpSd12c6bHLdsK40r7c1R6jjfxZxBskX0Y7Bo4bBquW4WuymGyQ_oUvbFFZeVmGiFoDsg7G8OY5R8TAjfCArDArILz8lerEpx9kGjZdObPU_-_dbU",
    avatarAlt: "صورة طالب المرحلة المتوسطة",
    fullName: "الحسن علي محمود الكبيسي",
    birthInfo: "تولد: 2010/03/18 - بغداد/الحارثية",
    ministryId: "IQ-2024-6210",
    adminId: "ADM-2024-2011",
    nationalId: "19103321984",
    gradeSection: "الثالث المتوسط (أ)",
    stageCode: "intermediate",
    gradeCode: "m3",
    sectionCode: "a",
    guardianName: "علي محمود (الأب)",
    guardianPhone: "+964 770 881 9922",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2022/09/15",
    address: "بغداد، الكرخ، الحارثية، محلة 213",
  },
  {
    id: "st-10",
    seq: "10",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDC91zTnlnDqPigbbpAtB-2bam_NMkjYn6p3TSprTRYFUbPzpC3Jsdqrz_wvHOhSruYSteP9T0SdAzBIvyqYQen6jLq3xskMTNipr2wIOu_VGB84Y5yTXRQ8AoMSEmjl7T9AoOnyd7jOKO0KbwqwffgXP8lFvYGPLz3L8Q0uKddCg4TqS4LKtporLTpJZYbXEIZcTtiYaRw5IeecdkGOy55zeAEGP3DncpXB9YAjle9zuHfuqvkcjmw",
    avatarAlt: "صورة طالب المرحلة المتوسطة",
    fullName: "حذيفة قاسم محمد الدليمي",
    birthInfo: "تولد: 2011/07/09 - بغداد/البياع",
    ministryId: "IQ-2024-6215",
    adminId: "ADM-2024-2012",
    nationalId: "19117732019",
    gradeSection: "الأول المتوسط (أ)",
    stageCode: "intermediate",
    gradeCode: "m1",
    sectionCode: "a",
    guardianName: "قاسم محمد (الأب)",
    guardianPhone: "+964 771 665 4433",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2023/09/18",
    address: "بغداد، الكرخ، البياع",
  },
  {
    id: "st-11",
    seq: "11",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHqdYtc2K2BXKuwq5KbL3Bfoq9K_-5HuNOiLPNZc0vkrjVSiDSDTtfgVt82uYcG5R8EzudmJdjJ9z6LlK5nyk0M8qbiFvxpdk2gAmMp851YYoO5oolmDW6vj-qrErbqpoVw8Zjd9Jc73ZepRBWlQoQJSZeBGmMkRoaLQlPP2H5VOEkX8Ocl67xAtc-Kz6DCFu3Wuv1Qs4oysgDGfiPlaWCgsMogXMfb5idIGvYVq3s4KUZL-UbDsQS",
    avatarAlt: "صورة تلميذ المرحلة الابتدائية",
    fullName: "أمير ياسر قحطان العبيدي",
    birthInfo: "تولد: 2013/11/05 - بغداد/القادسية",
    ministryId: "IQ-2024-3104",
    adminId: "ADM-2024-3005",
    nationalId: "19139948210",
    gradeSection: "السادس الابتدائي (أ)",
    stageCode: "primary",
    gradeCode: "p6",
    sectionCode: "a",
    guardianName: "ياسر قحطان (الأب)",
    guardianPhone: "+964 781 334 5566",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2019/09/10",
    address: "بغداد، الكرخ، القادسية، محلة 602",
  },
  {
    id: "st-12",
    seq: "12",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWIL45ZWofr762pPOHyj_8bSsOnD5j6p9Pa-eX9BjgF0kNYutwEez6TSTrSydQbe3lRlCon6ORSroJYm6RZFM74RLlkSHNYWBFseqd_2D9PVVvdL7rnNF6Tmt9wM1hlmoxVZoXqmrwkCN5d7hrL5IzGpivSOElhMatqCocoAs7OoaSmUXwmhE-7AhUNymVZZov8VLCuPwPnpuykFvNk1ytHCK0XgJvIJFAvnsavfa3-geWUnGLx3fA",
    avatarAlt: "صورة تلميذ المرحلة الابتدائية",
    fullName: "عباس فلاح حسن الشمري",
    birthInfo: "تولد: 2018/01/25 - بغداد/العامرية",
    ministryId: "IQ-2024-3190",
    adminId: "ADM-2024-3006",
    nationalId: "19182210934",
    gradeSection: "الأول الابتدائي (أ)",
    stageCode: "primary",
    gradeCode: "p1",
    sectionCode: "a",
    guardianName: "فلاح حسن (الأب)",
    guardianPhone: "+964 772 331 9900",
    statusLabel: "مستمر بالدوام",
    statusType: "active",
    registrationDate: "2024/09/15",
    address: "بغداد، الكرخ، العامرية",
  },
];

export interface RecentMovementRecord {
  ministryId: string;
  name: string;
  gradeSection: string;
  date: string;
  schoolNote: string;
  statusLabel: string;
  statusStyle: "active" | "transferred" | "carryover";
}

export const INITIAL_MOVEMENTS: RecentMovementRecord[] = [
  {
    ministryId: "2024-IQ-09142",
    name: "زيد عمار باقر العامري",
    gradeSection: "الخامس العلمي - شعبة أ",
    date: "2024/10/14",
    schoolNote: "مستمر من الصف الرابع (متميزين)",
    statusLabel: "نشط",
    statusStyle: "active",
  },
  {
    ministryId: "2024-IQ-08311",
    name: "علي سيف الدين طارق الحيالي",
    gradeSection: "السادس العلمي - شعبة ج",
    date: "2024/10/11",
    schoolNote: "منقول إلى ثانوية كلية بغداد للبنين",
    statusLabel: "منقول",
    statusStyle: "transferred",
  },
  {
    ministryId: "2024-IQ-11029",
    name: "مصطفى كريم حميد الدليمي",
    gradeSection: "الرابع العلمي - شعبة د",
    date: "2024/10/08",
    schoolNote: "متأهل من الاختبار التنافسي الوزاري",
    statusLabel: "نشط",
    statusStyle: "active",
  },
  {
    ministryId: "2024-IQ-07619",
    name: "يحيى ضياء صادق الكرخي",
    gradeSection: "الخامس الأدبي - شعبة أ",
    date: "2024/10/03",
    schoolNote: "إعادة قيد بقرار الدور الثاني الوزاري",
    statusLabel: "مكمل",
    statusStyle: "carryover",
  },
];

export interface SystemNotification {
  id: string;
  type: "absence_alert" | "system" | "academic" | "finance";
  title: string;
  message: string;
  studentId?: string;
  studentName?: string;
  adminId?: string;
  absenceDays?: number;
  threshold?: number;
  gradeClass?: string;
  timestamp: string;
  isRead: boolean;
  severity: "warning" | "error" | "info";
}

export const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-1",
    type: "absence_alert",
    title: "تنبيه غياب متكرر: زيد رافد محمود",
    message: "تجاوز الطالب الحد المسموح للغياب (5 أيام غياب متتالية). يرجى توجيه إنذار رسمي لولي الأمر.",
    studentName: "زيد رافد محمود السامرائي",
    adminId: "ADM-24-105",
    gradeClass: "الخامس العلمي (أ)",
    absenceDays: 5,
    threshold: 3,
    timestamp: "منذ ساعتين",
    isRead: false,
    severity: "error",
  },
  {
    id: "notif-2",
    type: "system",
    title: "تحديث ومزامنة المنظومة المركزية",
    message: "تم تحديث واعتماد سجلات الطلبة والحسابات ومزامنتها بنجاح مع الخادم الوزاري.",
    timestamp: "منذ 3 ساعات",
    isRead: false,
    severity: "info",
  },
  {
    id: "notif-3",
    type: "absence_alert",
    title: "تنبيه غياب: مصطفى أحمد رشيد",
    message: "سجل الطالب 4 أيام غياب متفرقة خلال الشهر الحالي دون تقديم إجازة مرضية.",
    studentName: "مصطفى أحمد رشيد الحمداني",
    adminId: "ADM-24-108",
    gradeClass: "الرابع العلمي (أ)",
    absenceDays: 4,
    threshold: 3,
    timestamp: "منذ يوم واحد",
    isRead: true,
    severity: "warning",
  },
];

export type UserRole = "principal" | "registrar" | "teacher" | "accountant";

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  roleTitle: string;
  teacherSubject?: string;
  phoneNumber?: string;
  employeeId?: string;
  directorate?: string;
  schoolName?: string;
  isActive: boolean;
  createdAt: string;
}

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: "usr-1",
    fullName: "أ.د. حسام عبد الرضا",
    username: "principal",
    email: "principal@moedu.iq",
    password: "123",
    role: "principal",
    roleTitle: "مدير المدرسة (تحكم كامل)",
    employeeId: "EMP-2024-001",
    phoneNumber: "+964 770 123 4567",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/01",
  },
  {
    id: "usr-2",
    fullName: "أ. مازن طارق الكرخي",
    username: "registrar",
    email: "registrar@moedu.iq",
    password: "123",
    role: "registrar",
    roleTitle: "معاون المدير / المسجل (تحكم كامل)",
    employeeId: "EMP-2024-002",
    phoneNumber: "+964 771 234 5678",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/01",
  },
  {
    id: "usr-3",
    fullName: "أ. حامد جاسم الشمري",
    username: "teacher_math",
    email: "teacher_math@moedu.iq",
    password: "123",
    role: "teacher",
    roleTitle: "مدرس مادة الرياضيات",
    teacherSubject: "الرياضيات (Mathematics)",
    employeeId: "EMP-2024-015",
    phoneNumber: "+964 780 345 6789",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/05",
  },
  {
    id: "usr-4",
    fullName: "أ. ليث كريم الحمداني",
    username: "teacher_physics",
    email: "teacher_physics@moedu.iq",
    password: "123",
    role: "teacher",
    roleTitle: "مدرس مادة الفيزياء",
    teacherSubject: "الفيزياء",
    employeeId: "EMP-2024-018",
    phoneNumber: "+964 781 456 7890",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/05",
  },
  {
    id: "usr-5",
    fullName: "أ. عمار حسن التميمي",
    username: "teacher_arabic",
    email: "teacher_arabic@moedu.iq",
    password: "123",
    role: "teacher",
    roleTitle: "مدرس اللغة العربية",
    teacherSubject: "اللغة العربية",
    employeeId: "EMP-2024-022",
    phoneNumber: "+964 772 567 8901",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/06",
  },
  {
    id: "usr-6",
    fullName: "أ. سعدون كاظم العبيدي",
    username: "accountant",
    email: "accountant@moedu.iq",
    password: "123",
    role: "accountant",
    roleTitle: "المحاسب المالي المعتمد",
    employeeId: "EMP-2024-009",
    phoneNumber: "+964 773 678 9012",
    directorate: "بغداد / الكرخ الأولى",
    schoolName: "ثانوية المتميزين للبنين",
    isActive: true,
    createdAt: "2024/09/01",
  },
];

// ==========================================
// 1. School Information & System Config Types
// ==========================================

export interface SchoolConfig {
  schoolName: string;
  schoolLogoUrl: string;
  directorate: string;
  ministryLogoUrl: string;
  governorate: string;
  principalName: string;
  vicePrincipalName: string;
  examCommitteeHead: string;
  academicYear: string;
  schoolCode: string;
  phone: string;
  email: string;
  address: string;
}

export const PRESET_SCHOOL_LOGOS = [
  {
    id: "logo-crest-gold",
    label: "شعار الصرح التعليمي الذهبي",
    url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "logo-eagle",
    label: "شعار النسر والدرع الرسمي",
    url: "https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "logo-book-torch",
    label: "شعار مشعل المعرفة والكتاب",
    url: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "logo-ministry",
    label: "شعار وزارة التربية الرسمي",
    url: MINISTRY_LOGO_URL,
  },
];

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: "ثانوية المتميزين للبنين",
  schoolLogoUrl:
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80",
  directorate: "المديرية العامة لتربية بغداد / الكرخ الأولى",
  ministryLogoUrl: MINISTRY_LOGO_URL,
  governorate: "بغداد",
  principalName: "أ.د. حسام عبد الرضا الربيعي",
  vicePrincipalName: "أ. مازن طارق الكرخي",
  examCommitteeHead: "أ.د. حسام عبد الرضا",
  academicYear: "2024 - 2025",
  schoolCode: "IQ-EDU-10492",
  phone: "+964 770 123 4567",
  email: "info.mutamayizeen@moedu.iq",
  address: "بغداد - الكرخ - حي الجامعة - قرب ساحة اللقاء",
};

// ==========================================
// 2. Staff & Teachers Management Types
// ==========================================

export type StaffCategory = "teacher" | "administrative" | "service";

export interface StaffMember {
  id: string;
  employeeCode: string;
  fullName: string;
  category: StaffCategory;
  roleTitle: string; // مدرس، معلم، معاون مدير، كاتب حسابات، أمين مكتبة، موجه تربوي، موظف خدمة، حارس
  subjectSpecialization?: string; // مادة التخصص التدريسي
  qualification: string; // دكتوراه، ماجستير، بكالوريوس، دبلوم، إعدادية
  yearsOfService: number; // سنوات الخدمة
  weeklyQuotas?: number; // النصاب الأسبوعي للحصص
  phoneNumber: string;
  email?: string;
  assignedStages?: string[]; // الصفوف المكلف بها
  status: "active" | "on_leave" | "delegated"; // مستمر بالدوام، مجاز، منتدب
  joinedYear: string;
  notes?: string;
}

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "stf-1",
    employeeCode: "EMP-2024-001",
    fullName: "أ.د. حسام عبد الرضا الربيعي",
    category: "administrative",
    roleTitle: "مدير المدرسة",
    qualification: "دكتوراه في الإدارة التربوية",
    yearsOfService: 24,
    phoneNumber: "+964 770 123 4567",
    email: "principal@moedu.iq",
    status: "active",
    joinedYear: "2010",
    notes: "رئيس اللجنة الامتحانية المركزية",
  },
  {
    id: "stf-2",
    employeeCode: "EMP-2024-002",
    fullName: "أ. مازن طارق الكرخي",
    category: "administrative",
    roleTitle: "معاون المدير للشؤون العلمية",
    qualification: "ماجستير طرائق تدريس",
    yearsOfService: 19,
    phoneNumber: "+964 780 234 5678",
    email: "vp.academic@moedu.iq",
    status: "active",
    joinedYear: "2014",
    notes: "مسؤول التسجيل وشؤون الطلبة واللجنة الامتحانية",
  },
  {
    id: "stf-3",
    employeeCode: "EMP-2024-009",
    fullName: "أ. سعدون كاظم العبيدي",
    category: "administrative",
    roleTitle: "المحاسب المالي المعتمد",
    qualification: "بكالوريوس علوم محاسبية",
    yearsOfService: 15,
    phoneNumber: "+964 773 678 9012",
    email: "accountant@moedu.iq",
    status: "active",
    joinedYear: "2018",
    notes: "أمين الصندوق والوصولات المالية المعتمد",
  },
  {
    id: "stf-4",
    employeeCode: "EMP-2024-015",
    fullName: "أ. حامد جاسم الشمري",
    category: "teacher",
    roleTitle: "مدرس أول - رياضيات",
    subjectSpecialization: "الرياضيات (Mathematics)",
    qualification: "بكالوريوس رياضيات وتطبيقاتها",
    yearsOfService: 16,
    weeklyQuotas: 18,
    phoneNumber: "+964 780 345 6789",
    email: "teacher_math@moedu.iq",
    assignedStages: ["الخامس العلمي (أ)", "السادس العلمي (أ)", "الخامس العلمي (ب)"],
    status: "active",
    joinedYear: "2015",
    notes: "مسؤول شعبة الرياضيات والمشاريع الأولمبية",
  },
  {
    id: "stf-5",
    employeeCode: "EMP-2024-018",
    fullName: "أ. ليث كريم الحمداني",
    category: "teacher",
    roleTitle: "مدرس - فيزياء",
    subjectSpecialization: "الفيزياء",
    qualification: "ماجستير فيزياء نووية وتطبيقية",
    yearsOfService: 12,
    weeklyQuotas: 16,
    phoneNumber: "+964 781 456 7890",
    email: "teacher_physics@moedu.iq",
    assignedStages: ["السادس العلمي (أ)", "السادس العلمي (ب)"],
    status: "active",
    joinedYear: "2017",
    notes: "مشرف مختبر الفيزياء المدرسي",
  },
  {
    id: "stf-6",
    employeeCode: "EMP-2024-022",
    fullName: "أ. عمار حسن التميمي",
    category: "teacher",
    roleTitle: "مدرس - لغة عربية",
    subjectSpecialization: "اللغة العربية",
    qualification: "بكالوريوس آداب لغة عربية",
    yearsOfService: 14,
    weeklyQuotas: 18,
    phoneNumber: "+964 772 567 8901",
    email: "teacher_arabic@moedu.iq",
    assignedStages: ["الرابع العلمي (أ)", "الخامس العلمي (أ)", "السادس العلمي (أ)"],
    status: "active",
    joinedYear: "2016",
    notes: "مشرف النشاطات الأدبية والخطابة",
  },
  {
    id: "stf-7",
    employeeCode: "EMP-2024-025",
    fullName: "أ. زياد خلف الجبوري",
    category: "teacher",
    roleTitle: "مدرس - كيمياء",
    subjectSpecialization: "الكيمياء",
    qualification: "بكالوريوس كيمياء عامة",
    yearsOfService: 11,
    weeklyQuotas: 14,
    phoneNumber: "+964 782 678 9012",
    email: "teacher_chem@moedu.iq",
    assignedStages: ["الخامس العلمي (أ)", "السادس العلمي (أ)"],
    status: "active",
    joinedYear: "2019",
  },
  {
    id: "stf-8",
    employeeCode: "EMP-2024-030",
    fullName: "أ. عمر فاروق السعدي",
    category: "teacher",
    roleTitle: "مدرس - لغة إنجليزية",
    subjectSpecialization: "اللغة الإنجليزية",
    qualification: "بكالوريوس لغات وترجمة",
    yearsOfService: 9,
    weeklyQuotas: 16,
    phoneNumber: "+964 774 789 0123",
    email: "teacher_english@moedu.iq",
    assignedStages: ["الرابع العلمي (أ)", "الخامس العلمي (أ)"],
    status: "active",
    joinedYear: "2020",
  },
  {
    id: "stf-9",
    employeeCode: "EMP-2024-035",
    fullName: "أ. بلال سامي العاني",
    category: "teacher",
    roleTitle: "مدرس - علوم الحياة والأحياء",
    subjectSpecialization: "الأحياء",
    qualification: "بكالوريوس علوم حياة",
    yearsOfService: 8,
    weeklyQuotas: 14,
    phoneNumber: "+964 783 890 1234",
    email: "teacher_bio@moedu.iq",
    assignedStages: ["الخامس العلمي (أ)", "السادس العلمي (أ)"],
    status: "active",
    joinedYear: "2021",
  },
  {
    id: "stf-10",
    employeeCode: "EMP-2024-040",
    fullName: "أ. مصطفى رعد القيسي",
    category: "teacher",
    roleTitle: "مدرس - الحاسوب والذكاء الاصطناعي",
    subjectSpecialization: "الحاسوب",
    qualification: "بكالوريوس هندسة برمجيات",
    yearsOfService: 7,
    weeklyQuotas: 12,
    phoneNumber: "+964 771 901 2345",
    email: "teacher_cs@moedu.iq",
    assignedStages: ["الرابع العلمي (أ)", "الخامس العلمي (أ)"],
    status: "active",
    joinedYear: "2022",
  },
  {
    id: "stf-11",
    employeeCode: "EMP-2024-045",
    fullName: "أ. جاسم محمد الخزرجي",
    category: "administrative",
    roleTitle: "المرشد التربوي والنفسي",
    qualification: "بكالوريوس إرشاد نفسي وتوجيه",
    yearsOfService: 13,
    phoneNumber: "+964 780 012 3456",
    email: "counselor@moedu.iq",
    status: "active",
    joinedYear: "2017",
    notes: "مسؤول الإرشاد التربوي والشكاوى ومتابعة أولياء الأمور",
  },
  {
    id: "stf-12",
    employeeCode: "EMP-2024-050",
    fullName: "أ. فهد عبد الكريم السامرائي",
    category: "administrative",
    roleTitle: "أمين المكتبة المدرسية",
    qualification: "دبلوم مكتبات ومعلومات",
    yearsOfService: 18,
    phoneNumber: "+964 772 123 4568",
    status: "active",
    joinedYear: "2013",
  },
  {
    id: "stf-13",
    employeeCode: "EMP-2024-060",
    fullName: "السيد كريم عبد الله المشهداني",
    category: "service",
    roleTitle: "مسؤول الخدمات والحراسة المدرسية",
    qualification: "إعدادية",
    yearsOfService: 20,
    phoneNumber: "+964 781 234 5679",
    status: "active",
    joinedYear: "2011",
  },
];

// ==========================================
// 3. Weekly Schedule Types & Initial Data
// ==========================================

export type ScheduleDay = "الأحد" | "الإثنين" | "الثلاثاء" | "الأربعاء" | "الخميس";

export const SCHEDULE_DAYS: ScheduleDay[] = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

export interface PeriodSlot {
  periodIndex: number; // 1 to 6
  timeLabel: string; // "08:00 - 08:45"
  subject: string;
  teacherName: string;
  room: string;
  isBreak?: boolean;
  notes?: string;
}

export interface DaySchedule {
  day: ScheduleDay;
  periods: PeriodSlot[];
}

export interface ClassWeeklySchedule {
  classId: string;
  classroom: string; // "الخامس العلمي (أ)"
  stage: StageKey;
  gradeCode: string;
  days: DaySchedule[];
}

export const PERIOD_TIMES = [
  { index: 1, label: "الحصة الأولى", time: "08:00 - 08:45" },
  { index: 2, label: "الحصة الثانية", time: "08:50 - 09:35" },
  { index: 3, label: "الحصة الثالثة", time: "09:40 - 10:25" },
  { index: 4, label: "الحصة الرابعة", time: "10:45 - 11:30" },
  { index: 5, label: "الحصة الخامسة", time: "11:35 - 12:20" },
  { index: 6, label: "الحصة السادسة", time: "12:25 - 01:10" },
];

export const INITIAL_WEEKLY_SCHEDULES: ClassWeeklySchedule[] = [
  {
    classId: "cls-5s-a",
    classroom: "الخامس العلمي (أ)",
    stage: "preparatory",
    gradeCode: "5s",
    days: [
      {
        day: "الأحد",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "مختبر الفيزياء" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 101" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 101" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "التربية الإسلامية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
        ],
      },
      {
        day: "الإثنين",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "مختبر الكيمياء" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "مختبر الأحياء" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الحاسوب", teacherName: "أ. مصطفى رعد القيسي", room: "مختبر الحاسوب" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "استراحة / نشاط لا صفي", teacherName: "مشرف النشاط", room: "الساحة المركزية", isBreak: true },
        ],
      },
      {
        day: "الثلاثاء",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 101" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 101" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "قاعة 101" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "التربية الإسلامية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "مراجعة علمية وتدريب", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
        ],
      },
      {
        day: "الأربعاء",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "مختبر الأحياء" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 101" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "الحاسوب", teacherName: "أ. مصطفى رعد القيسي", room: "مختبر الحاسوب" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 101" },
        ],
      },
      {
        day: "الخميس",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 101" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 101" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 101" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "التربية الإسلامية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 101" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "التربية الرياضية والنشاط", teacherName: "مشرف النشاط", room: "القاعة الرياضية" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "اجتماع توجيهي إرشادي", teacherName: "أ. جاسم محمد الخزرجي", room: "قاعة 101" },
        ],
      },
    ],
  },
  {
    classId: "cls-6s-a",
    classroom: "السادس العلمي (أ)",
    stage: "preparatory",
    gradeCode: "6s",
    days: [
      {
        day: "الأحد",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 201" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 201" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 201" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 201" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "قاعة 201" },
        ],
      },
      {
        day: "الإثنين",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 201" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "مختبر الكيمياء" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "مختبر الفيزياء" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "قاعة 201" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 201" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "التربية الإسلامية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
        ],
      },
      {
        day: "الثلاثاء",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 201" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 201" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 201" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "قاعة 201" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "حل أسئلة وزارية ونماذج", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 201" },
        ],
      },
      {
        day: "الأربعاء",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 201" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "اللغة الإنجليزية", teacherName: "أ. عمر فاروق السعدي", room: "قاعة 201" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 201" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 201" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "التربية الإسلامية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
        ],
      },
      {
        day: "الخميس",
        periods: [
          { periodIndex: 1, timeLabel: "08:00 - 08:45", subject: "الأحياء", teacherName: "أ. بلال سامي العاني", room: "مختبر الأحياء" },
          { periodIndex: 2, timeLabel: "08:50 - 09:35", subject: "الرياضيات (Mathematics)", teacherName: "أ. حامد جاسم الشمري", room: "قاعة 201" },
          { periodIndex: 3, timeLabel: "09:40 - 10:25", subject: "الكيمياء", teacherName: "أ. زياد خلف الجبوري", room: "قاعة 201" },
          { periodIndex: 4, timeLabel: "10:45 - 11:30", subject: "الفيزياء", teacherName: "أ. ليث كريم الحمداني", room: "قاعة 201" },
          { periodIndex: 5, timeLabel: "11:35 - 12:20", subject: "اللغة العربية", teacherName: "أ. عمار حسن التميمي", room: "قاعة 201" },
          { periodIndex: 6, timeLabel: "12:25 - 01:10", subject: "تدريب على الدفتر الامتحاني", teacherName: "إدارة المدرسة", room: "قاعة 201" },
        ],
      },
    ],
  },
];

