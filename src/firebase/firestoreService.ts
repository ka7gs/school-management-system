import {
  collection,
  doc,
  getDoc,
  getDocs,
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
  DEFAULT_SCHOOL_CONFIG,
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  INITIAL_STAFF_MEMBERS,
  INITIAL_WEEKLY_SCHEDULES,
  INITIAL_USER_ACCOUNTS,
  INITIAL_SYSTEM_NOTIFICATIONS,
} from '../data/mockData';

export const MAIN_SCHOOL_ID = 'main';

// 1. School Config
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
        // Initialize if not present
        setDoc(schoolDocRef, DEFAULT_SCHOOL_CONFIG).catch((err) => {
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
    await setDoc(schoolDocRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Students Collection
export function subscribeToStudents(
  onData: (students: StudentRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const studentsCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'students');
  return onSnapshot(
    studentsCol,
    async (snap) => {
      if (snap.empty) {
        // Seed default students if empty
        const batch = writeBatch(db);
        INITIAL_STUDENTS.forEach((st) => {
          const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'students', st.id);
          batch.set(ref, st);
        });
        try {
          await batch.commit();
        } catch (e) {
          console.warn('Initial student batch seeding notice:', e);
        }
        onData(INITIAL_STUDENTS);
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
    await setDoc(ref, student, { merge: true });
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

// 3. Grades Collection
export function subscribeToGrades(
  onData: (grades: GradeRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const gradesCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'grades');
  return onSnapshot(
    gradesCol,
    async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_GRADES.forEach((g) => {
          const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'grades', String(g.id));
          batch.set(ref, g);
        });
        try {
          await batch.commit();
        } catch (e) {
          console.warn('Grades seeding notice:', e);
        }
        onData(INITIAL_GRADES);
        return;
      }
      const list: GradeRecord[] = [];
      snap.forEach((d) => list.push(d.data() as GradeRecord));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `schools/${MAIN_SCHOOL_ID}/grades`);
    }
  );
}

export async function saveGradeDb(grade: GradeRecord): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/grades/${grade.id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'grades', String(grade.id));
    await setDoc(ref, grade, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteGradeDb(gradeId: number | string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/grades/${gradeId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'grades', String(gradeId));
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 4. Staff Registry
export function subscribeToStaff(
  onData: (staff: StaffMember[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const staffCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'staff');
  return onSnapshot(
    staffCol,
    async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_STAFF_MEMBERS.forEach((m) => {
          const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'staff', m.id);
          batch.set(ref, m);
        });
        try {
          await batch.commit();
        } catch (e) {
          console.warn('Staff seeding notice:', e);
        }
        onData(INITIAL_STAFF_MEMBERS);
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
    await setDoc(ref, member, { merge: true });
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

// 5. User Accounts
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
          batch.set(ref, acc);
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
    await setDoc(ref, acc, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteUserAccountDb(userId: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/userAccounts/${userId}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts', userId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 6. Notifications
export function subscribeToNotifications(
  onData: (notifications: SystemNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const notifCol = collection(db, 'schools', MAIN_SCHOOL_ID, 'notifications');
  return onSnapshot(
    notifCol,
    async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_SYSTEM_NOTIFICATIONS.forEach((n) => {
          const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'notifications', n.id);
          batch.set(ref, n);
        });
        try {
          await batch.commit();
        } catch (e) {
          console.warn('Notifications seeding notice:', e);
        }
        onData(INITIAL_SYSTEM_NOTIFICATIONS);
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

export async function markNotificationAsReadDb(id: string): Promise<void> {
  const path = `schools/${MAIN_SCHOOL_ID}/notifications/${id}`;
  try {
    const ref = doc(db, 'schools', MAIN_SCHOOL_ID, 'notifications', id);
    await updateDoc(ref, { isRead: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// 7. Seed All Initial Data to Firestore in one click
export async function seedCompleteSchoolDatabase(): Promise<boolean> {
  try {
    const schoolRef = doc(db, 'schools', MAIN_SCHOOL_ID);
    await setDoc(schoolRef, DEFAULT_SCHOOL_CONFIG, { merge: true });

    const batch = writeBatch(db);

    INITIAL_STUDENTS.forEach((st) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'students', st.id), st, { merge: true });
    });

    INITIAL_GRADES.forEach((g) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'grades', String(g.id)), g, { merge: true });
    });

    INITIAL_STAFF_MEMBERS.forEach((m) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'staff', m.id), m, { merge: true });
    });

    INITIAL_USER_ACCOUNTS.forEach((acc) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'userAccounts', acc.id), acc, { merge: true });
    });

    INITIAL_WEEKLY_SCHEDULES.forEach((sched) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'schedules', sched.classId), sched, { merge: true });
    });

    INITIAL_SYSTEM_NOTIFICATIONS.forEach((n) => {
      batch.set(doc(db, 'schools', MAIN_SCHOOL_ID, 'notifications', n.id), n, { merge: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Failed to seed complete school database:', error);
    return false;
  }
}
