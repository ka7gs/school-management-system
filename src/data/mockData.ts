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

export const INITIAL_STUDENT_MULTI_GRADES: StudentMultiSubjectGrade[] = [];

export const INITIAL_GRADES: GradeRecord[] = [];

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
  notes?: string;
}

export const INITIAL_STUDENTS: StudentRecord[] = [];

export interface RecentMovementRecord {
  ministryId: string;
  name: string;
  gradeSection: string;
  date: string;
  schoolNote: string;
  statusLabel: string;
  statusStyle: "active" | "transferred" | "carryover";
}

export const INITIAL_MOVEMENTS: RecentMovementRecord[] = [];

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

export const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = [];

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
    fullName: "أ.د. حسام عبد الرضا الربيعي",
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

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [];

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

export const INITIAL_WEEKLY_SCHEDULES: ClassWeeklySchedule[] = [];
