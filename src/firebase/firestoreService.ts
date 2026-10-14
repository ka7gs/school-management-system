import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  SchoolConfig,
  StudentRecord,
  GradeRecord,
  StaffMember,
  ClassWeeklySchedule,
  UserAccount,
  SystemNotification,
  StudentMultiSubjectGrade,
  DEFAULT_SCHOOL_CONFIG,
  INITIAL_USER_ACCOUNTS,
} from '../data/mockData';

export const MAIN_SCHOOL_ID = 'main';

// Utility to recursively remove undefined fields so Firestore setDoc never throws
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

// 1. School Config - Live Save & Realtime Sync
export function subscribeToSchoolConfig(
  onData: (data: SchoolConfig) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const schoolDocRef = doc(db, 'schools', MAIN_SCHOOL_ID);
  return onSnapshot(
    schoolDocRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SchoolConfig);
      } else {
        setDoc(schoolDocRef, sanitizeForFirestore(DEFAULT_SCHOOL_CONFIG)).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `schools/${MAIN_SCHOOL_ID}`);
        });
        onData(DEFAULT_SCHOOL_CONFIG);
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, `schools/${MAIN_SCHOOL_ID}`);
    }
  );
}

export async function saveSchoolConfigToDb(config: SchoolConfig): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}`;
  try {
    const schoolDocRef = doc(db, 'schools', MAIN_SCHOOL_ID);
    await setDoc(schoolDocRef, sanitizeForFirestore({
      ...config,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Students Collection - Live Save & Realtime Sync
export function subscribeToStudents(
  onData: (students: StudentRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const studentsCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'students');
  return onSnapshot(
    studentsCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: StudentRecord[] = [];
      snap.forEach((d) => list.push(d.data() as StudentRecord));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/students`);
    }
  );
}

export async function addOrUpdateStudentDb(student: StudentRecord): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/students/${student.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'students', student.id);
    const sanitized = sanitizeForFirestore(student);
    await setDoc(ref, sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMultipleStudentsDb(studentsList: StudentRecord[]): Promise<void> {
  if (!studentsList || studentsList.length === 0) return;
  const path = `schools/${MAIN_SCHOOL_ID}/students`;
  try {
    const batch = writeBatch(db);
    for (const st of studentsList) {
      const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'students', st.id);
      batch.set(ref, sanitizeForFirestore(st), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStudentDb(studentId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/students/${studentId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'students', studentId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 3. Multi-Subject Student Grades - Live Save & Realtime Sync
export function subscribeToMultiGrades(
  onData: (grades: StudentMultiSubjectGrade[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const gradesCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'multiGrades');
  return onSnapshot(
    gradesCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: StudentMultiSubjectGrade[] = [];
      snap.forEach((d) => list.push(d.data() as StudentMultiSubjectGrade));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/multiGrades`);
    }
  );
}

export async function saveMultiGradeDb(gradeRecord: StudentMultiSubjectGrade): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/multiGrades/${gradeRecord.studentId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'multiGrades', gradeRecord.studentId);
    await setDoc(ref, sanitizeForFirestore(gradeRecord), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMultiGradeDb(studentId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/multiGrades/${studentId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'multiGrades', studentId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 4. Staff Registry - Live Save & Realtime Sync
export function subscribeToStaff(
  onData: (staff: StaffMember[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const staffCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'staff');
  return onSnapshot(
    staffCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: StaffMember[] = [];
      snap.forEach((d) => list.push(d.data() as StaffMember));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/staff`);
    }
  );
}

export async function saveStaffDb(member: StaffMember): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/staff/${member.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'staff', member.id);
    await setDoc(ref, sanitizeForFirestore(member), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStaffDb(memberId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/staff/${memberId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'staff', memberId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 5. Weekly Class Schedules - Live Save & Realtime Sync
export function subscribeToSchedules(
  onData: (schedules: ClassWeeklySchedule[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const schedCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'schedules');
  return onSnapshot(
    schedCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: ClassWeeklySchedule[] = [];
      snap.forEach((d) => list.push(d.data() as ClassWeeklySchedule));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/schedules`);
    }
  );
}

export async function saveScheduleDb(sched: ClassWeeklySchedule): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/schedules/${sched.classId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'schedules', sched.classId);
    await setDoc(ref, sanitizeForFirestore(sched), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 6. User Accounts - Live Save & Realtime Sync
export function subscribeToUserAccounts(
  onData: (accounts: UserAccount[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const accountsCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts');
  return onSnapshot(
    accountsCol,
    async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_USER_ACCOUNTS.forEach((acc) => {
          const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts', acc.id);
          batch.set(ref, sanitizeForFirestore(acc));
        });
        try {
          await batch.commit();
        } catch (e) {
          console.warn('Accounts seeding notice:', e);
        }
        onData(INITIAL_USER_ACCOUNTS);
        return;
      }
      const list: UserAccount[] = [];
      snap.forEach((d) => list.push(d.data() as UserAccount));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/userAccounts`);
    }
  );
}

export async function saveUserAccountDb(acc: UserAccount): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/userAccounts/${acc.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts', acc.id);
    await setDoc(ref, sanitizeForFirestore(acc), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteUserAccountDb(accId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/userAccounts/${accId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts', accId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 7. System Notifications - Live Save & Realtime Sync
export function subscribeToNotifications(
  onData: (notifs: SystemNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const notifCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'notifications');
  return onSnapshot(
    notifCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: SystemNotification[] = [];
      snap.forEach((d) => list.push(d.data() as SystemNotification));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/notifications`);
    }
  );
}

export async function saveNotificationDb(notif: SystemNotification): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/notifications/${notif.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'notifications', notif.id);
    await setDoc(ref, sanitizeForFirestore(notif), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function markNotificationAsReadDb(notifId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/notifications/${notifId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'notifications', notifId);
    await updateDoc(ref, { isRead: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// 8. Attendance Tracking - Live Save & Realtime Sync
export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  studentName: string;
  adminId: string;
  ministryId: string;
  gradeClass: string;
  stageCode: string;
  gradeCode: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  absenceDaysCount: number;
  note?: string;
}

export function subscribeToAttendance(
  onData: (records: AttendanceRecordItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const attCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'attendance');
  return onSnapshot(
    attCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: AttendanceRecordItem[] = [];
      snap.forEach((d) => list.push(d.data() as AttendanceRecordItem));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/attendance`);
    }
  );
}

export async function saveAttendanceItemDb(item: AttendanceRecordItem): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/attendance/${item.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'attendance', item.id);
    await setDoc(ref, sanitizeForFirestore(item), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 9. Finance & Tuition Receipts - Live Save & Realtime Sync
export interface FinanceReceiptItem {
  id: string;
  receiptNumber: string;
  studentName: string;
  gradeClass: string;
  amount: number;
  date: string;
  paymentType: string;
  accountantName: string;
  status: string;
  notes?: string;
}

export function subscribeToFinanceReceipts(
  onData: (receipts: FinanceReceiptItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const finCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'financeReceipts');
  return onSnapshot(
    finCol,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const list: FinanceReceiptItem[] = [];
      snap.forEach((d) => list.push(d.data() as FinanceReceiptItem));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/financeReceipts`);
    }
  );
}

export async function saveFinanceReceiptDb(receipt: FinanceReceiptItem): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/financeReceipts/${receipt.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'financeReceipts', receipt.id);
    await setDoc(ref, sanitizeForFirestore(receipt), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFinanceReceiptDb(receiptId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/financeReceipts/${receiptId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'financeReceipts', receiptId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Optional helper for seeding full database (kept for admin utility)
export async function seedCompleteSchoolDatabase(): Promise<void> {
  console.log('Database ready for school principal use.');
}
