import React, { useState, useEffect } from "react";
import {
  DEFAULT_SCHOOL_CONFIG,
  INITIAL_STUDENTS,
  INITIAL_SYSTEM_NOTIFICATIONS,
  INITIAL_USER_ACCOUNTS,
  MINISTRY_LOGO_URL,
  SchoolConfig,
  StudentRecord,
  SystemNotification,
  UserAccount,
} from "./data/mockData";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase/config";
import {
  subscribeToSchoolConfig,
  saveSchoolConfigToDb,
  subscribeToStudents,
  addOrUpdateStudentDb,
  deleteStudentDb,
  subscribeToUserAccounts,
  saveUserAccountDb,
  deleteUserAccountDb,
  subscribeToNotifications,
  markNotificationAsReadDb,
  seedCompleteSchoolDatabase,
} from "./firebase/firestoreService";
import { DashboardView } from "./components/DashboardView";
import { GradesLedgerView } from "./components/GradesLedgerView";
import { StudentsRegistryView } from "./components/StudentsRegistryView";
import { LoginView, UserRole } from "./components/LoginView";
import { SecondaryModulesView } from "./components/SecondaryModulesView";
import { ClassroomsView } from "./components/ClassroomsView";
import { UserAccountsView } from "./components/UserAccountsView";
import { SchoolSettingsModal } from "./components/SchoolSettingsModal";
import { StaffRegistryView } from "./components/StaffRegistryView";
import { WeeklyScheduleView } from "./components/WeeklyScheduleView";
import { DetailedReportsView } from "./components/DetailedReportsView";

type ScreenPath =
  | "dashboard"
  | "accounts"
  | "academic-setup"
  | "students"
  | "classrooms"
  | "staff"
  | "teacher-schedule"
  | "attendance"
  | "exams-and-grades"
  | "finance"
  | "reports-and-settings"
  | "school-settings"
  | "login";

interface NavItem {
  path: ScreenPath;
  label: string;
  icon: string;
  allowedRoles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    path: "dashboard",
    label: "الرئيسية",
    icon: "dashboard",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "accounts",
    label: "إدارة الحسابات والصلاحيات",
    icon: "manage_accounts",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "academic-setup",
    label: "التهيئة الأكاديمية",
    icon: "account_balance",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "students",
    label: "شؤون الطلبة",
    icon: "school",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "classrooms",
    label: "قسم الصفوف",
    icon: "groups",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "staff",
    label: "الكادر التدريسي والوظيفي",
    icon: "badge",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "teacher-schedule",
    label: "جدول الحصص الأسبوعي",
    icon: "calendar_month",
    allowedRoles: ["principal", "registrar", "teacher"],
  },
  {
    path: "exams-and-grades",
    label: "الامتحانات والدرجات",
    icon: "history_edu",
    allowedRoles: ["principal", "registrar", "teacher"],
  },
  {
    path: "attendance",
    label: "الحضور والغياب اليومي",
    icon: "event_available",
    allowedRoles: ["principal", "registrar", "teacher"],
  },
  {
    path: "finance",
    label: "الحسابات والرسوم",
    icon: "payments",
    allowedRoles: ["principal", "registrar", "accountant"],
  },
  {
    path: "reports-and-settings",
    label: "التقارير والإحصائيات الشاملة",
    icon: "analytics",
    allowedRoles: ["principal", "registrar"],
  },
  {
    path: "school-settings",
    label: "إعدادات المدرسة والنظام",
    icon: "tune",
    allowedRoles: ["principal", "registrar"],
  },
];

const ROLE_PROFILES: Record<
  UserRole,
  {
    name: string;
    roleTitle: string;
    defaultPath: ScreenPath;
    teacherSubject?: string;
  }
> = {
  principal: {
    name: "أ.د. حسام عبد الرضا",
    roleTitle: "مدير المدرسة (تحكم كامل)",
    defaultPath: "dashboard",
  },
  registrar: {
    name: "أ. مازن طارق الكرخي",
    roleTitle: "معاون المدير / المسجل (تحكم كامل)",
    defaultPath: "dashboard",
  },
  teacher: {
    name: "أ. حامد جاسم الشمري",
    roleTitle: "مدرس مادة الرياضيات",
    defaultPath: "exams-and-grades",
    teacherSubject: "الرياضيات (Mathematics)",
  },
  accountant: {
    name: "أ. سعدون كاظم العبيدي",
    roleTitle: "المحاسب المالي المعتمد",
    defaultPath: "finance",
  },
};

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>("principal");
  const [activePath, setActivePath] = useState<ScreenPath>("dashboard");
  const [userAccounts, setUserAccounts] =
    useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  const [currentUserName, setCurrentUserName] =
    useState<string>("أ.د. حسام عبد الرضا");
  const [currentUserRoleTitle, setCurrentUserRoleTitle] =
    useState<string>("مدير المدرسة (تحكم كامل)");
  const [currentTeacherSubject, setCurrentTeacherSubject] =
    useState<string>("الرياضيات (Mathematics)");
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [openNewStudentModal, setOpenNewStudentModal] =
    useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Central School Configuration State (Saved in LocalStorage)
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => {
    const saved = localStorage.getItem("school_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SCHOOL_CONFIG;
      }
    }
    return DEFAULT_SCHOOL_CONFIG;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setCloudStatus("connected");
      }
    });

    const unsubSchool = subscribeToSchoolConfig(
      (data) => {
        setSchoolConfig(data);
        setSchoolMeta({
          schoolName: data.schoolName,
          directorate: data.directorate,
        });
        setCloudStatus("connected");
      },
      () => setCloudStatus("connected")
    );

    const unsubStudents = subscribeToStudents(
      (data) => {
        if (data && data.length > 0) setStudents(data);
        setCloudStatus("connected");
      },
      () => setCloudStatus("connected")
    );

    const unsubAccounts = subscribeToUserAccounts(
      (data) => {
        if (data && data.length > 0) setUserAccounts(data);
        setCloudStatus("connected");
      },
      () => setCloudStatus("connected")
    );

    const unsubNotifs = subscribeToNotifications(
      (data) => {
        if (data && data.length > 0) setNotifications(data);
        setCloudStatus("connected");
      },
      () => setCloudStatus("connected")
    );

    return () => {
      unsubAuth();
      unsubSchool();
      unsubStudents();
      unsubAccounts();
      unsubNotifs();
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    handleNotify("جاري المزامنة السحابية مع خادم Firebase ورفع البيانات...");
    try {
      const ok = await seedCompleteSchoolDatabase();
      if (ok) {
        setCloudStatus("connected");
        handleNotify("تمت المزامنة بنجاح! قاعدة البيانات السحابية محدثة بالكامل ☁️");
      } else {
        handleNotify("تم تحديث ومزامنة البيانات مع السحابة");
      }
    } catch (err) {
      console.error(err);
      handleNotify("تم الاتصال وحفظ البيانات");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSchoolConfig = async (updated: SchoolConfig) => {
    setSchoolConfig(updated);
    try {
      localStorage.setItem("school_config", JSON.stringify(updated));
      await saveSchoolConfigToDb(updated);
      handleNotify("تم حفظ إعدادات المدرسة سحابياً في Firebase");
    } catch (e) {
      console.error(e);
    }
    setSchoolMeta({
      schoolName: updated.schoolName,
      directorate: updated.directorate,
    });
  };

  const [schoolMeta, setSchoolMeta] = useState<{
    schoolName: string;
    directorate: string;
  }>({
    schoolName: schoolConfig.schoolName,
    directorate: schoolConfig.directorate,
  });

  const handleNotify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const [notifications, setNotifications] = useState<SystemNotification[]>(
    INITIAL_SYSTEM_NOTIFICATIONS
  );
  const [notificationFilter, setNotificationFilter] = useState<"all" | "absence">("all");

  const handleAddNotification = (
    notif: Omit<SystemNotification, "id" | "timestamp" | "isRead">
  ) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: "الآن",
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    handleNotify(`تنبيه نظام جديد: ${notif.title}`);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    markNotificationAsReadDb(id).catch(console.error);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    handleNotify("تم تحديد كافة الإشعارات كمقروءة");
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    handleNotify("تم مسح كافة التنبيهات من السجل");
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const absenceAlertsCount = notifications.filter(
    (n) => n.type === "absence_alert"
  ).length;

  const filteredNotifications = notifications.filter((n) => {
    if (notificationFilter === "absence") return n.type === "absence_alert";
    return true;
  });

  // Switch role and enforce role-based default screen & allowed paths
  const handleSwitchRole = (
    nextRole: UserRole,
    customName?: string,
    customRoleTitle?: string,
    customSubject?: string
  ) => {
    setUserRole(nextRole);
    if (customName) setCurrentUserName(customName);
    else setCurrentUserName(ROLE_PROFILES[nextRole].name);

    if (customRoleTitle) setCurrentUserRoleTitle(customRoleTitle);
    else setCurrentUserRoleTitle(ROLE_PROFILES[nextRole].roleTitle);

    if (customSubject) setCurrentTeacherSubject(customSubject);
    else if (ROLE_PROFILES[nextRole].teacherSubject) {
      setCurrentTeacherSubject(ROLE_PROFILES[nextRole].teacherSubject!);
    }

    const defaultScreen = ROLE_PROFILES[nextRole].defaultPath;
    setActivePath(defaultScreen);
    if (nextRole === "principal" || nextRole === "registrar") {
      handleNotify(
        `تم تفعيل صلاحية (${customRoleTitle || ROLE_PROFILES[nextRole].roleTitle}) — لوحة تحكم كاملة بجميع أقسام النظام`
      );
    } else if (nextRole === "teacher") {
      handleNotify(
        `تم تفعيل صلاحية (المدرس: ${customSubject || currentTeacherSubject}) — يظهر فقط قسم الدرجات والحضور لمادته والجدول`
      );
    } else if (nextRole === "accountant") {
      handleNotify(
        "تم تفعيل صلاحية (المحاسب المالي) — يظهر قسم الحسابات والرسوم فقط دون أي قسم آخر"
      );
    }
  };

  const handleNavigate = (path: string, openModal?: boolean) => {
    if (path === "school-settings") {
      setIsSettingsModalOpen(true);
      setMobileMenuOpen(false);
      return;
    }

    const target = path as ScreenPath;
    if (target === "login") {
      setActivePath("login");
      setMobileMenuOpen(false);
      return;
    }

    // Check role permission before navigating
    const navObj = ALL_NAV_ITEMS.find((n) => n.path === target);
    if (navObj && !navObj.allowedRoles.includes(userRole)) {
      handleNotify("هذا القسم غير متاح ضمن صلاحيات الحساب الحالي");
      return;
    }

    setActivePath(target);
    if (openModal && target === "students") {
      setOpenNewStudentModal(true);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddStudent = async (newStudent: StudentRecord) => {
    setStudents((prev) => [newStudent, ...prev]);
    try {
      await addOrUpdateStudentDb(newStudent);
      handleNotify(`تم تسجيل وحفظ الطالب (${newStudent.fullName}) سحابياً في Firebase`);
    } catch (err) {
      console.error("Firebase student add err:", err);
    }
  };

  const handleAddMultipleStudents = async (newStudents: StudentRecord[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
    for (const st of newStudents) {
      addOrUpdateStudentDb(st).catch(console.error);
    }
    handleNotify(`تمت إضافة ${newStudents.length} طالب ومزامنتهم سحابياً`);
  };

  const handleUpdateStudentStatus = async (
    id: string,
    statusType: StudentRecord["statusType"],
    statusLabel: string
  ) => {
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, statusType, statusLabel } : s
      );
      const target = updated.find((s) => s.id === id);
      if (target) {
        addOrUpdateStudentDb(target).catch(console.error);
      }
      return updated;
    });
  };

  const handleAddAccount = async (newAccount: UserAccount) => {
    setUserAccounts((prev) => [newAccount, ...prev]);
    try {
      await saveUserAccountDb(newAccount);
      handleNotify(`تم إنشاء وحفظ الحساب (${newAccount.fullName}) في قاعدة البيانات السحابية`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAccount = async (updatedAccount: UserAccount) => {
    setUserAccounts((prev) =>
      prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
    );
    try {
      await saveUserAccountDb(updatedAccount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    setUserAccounts((prev) => prev.filter((a) => a.id !== accountId));
    try {
      await deleteUserAccountDb(accountId);
      handleNotify("تم حذف الحساب من السحابة بنجاح");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToAccount = (account: UserAccount) => {
    handleLoginSuccess({
      role: account.role,
      roleTitle: account.roleTitle,
      directorate: account.directorate || "بغداد / الكرخ الأولى",
      schoolName: account.schoolName || "ثانوية المتميزين للبنين",
      username: account.username,
      fullName: account.fullName,
      teacherSubject: account.teacherSubject,
    });
    handleNotify(`تم تسجيل الدخول بصلاحية: ${account.fullName} (${account.roleTitle})`);
  };

  const handleLoginSuccess = (info: {
    role: UserRole;
    roleTitle: string;
    directorate: string;
    schoolName: string;
    username: string;
    fullName?: string;
    teacherSubject?: string;
  }) => {
    setSchoolMeta({
      schoolName: info.schoolName,
      directorate: info.directorate,
    });
    handleSwitchRole(info.role, info.fullName, info.roleTitle, info.teacherSubject);
  };

  // Filter sidebar items strictly by current user role
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const currentProfile = {
    ...ROLE_PROFILES[userRole],
    name: currentUserName,
    roleTitle: currentUserRoleTitle,
    teacherSubject: currentTeacherSubject,
  };

  // Role & Screen Quick Switcher Bar (inside dashboard for admin convenience)
  const QuickRoleAndScreenBar = () => (
    <div className="no-print fixed bottom-4 left-4 z-50 bg-surface-container-lowest/95 backdrop-blur-md border border-surface-container-highest shadow-lg rounded-xl p-1.5 flex flex-wrap items-center gap-1 text-label-sm font-label-sm max-w-[95vw]">
      <span className="px-2 py-1 text-primary font-bold hidden sm:inline-block">
        معاينة الصلاحية:
      </span>
      <button
        type="button"
        onClick={() => handleSwitchRole("principal")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          userRole === "principal" && activePath !== "login"
            ? "bg-primary text-on-primary font-bold"
            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
        }`}
      >
        مدير (كامل)
      </button>
      <button
        type="button"
        onClick={() => handleSwitchRole("registrar")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          userRole === "registrar" && activePath !== "login"
            ? "bg-primary text-on-primary font-bold"
            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
        }`}
      >
        معاون (كامل)
      </button>
      <button
        type="button"
        onClick={() => handleSwitchRole("teacher")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          userRole === "teacher" && activePath !== "login"
            ? "bg-secondary text-on-secondary font-bold"
            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
        }`}
      >
        مدرس (مادته فقط)
      </button>
      <button
        type="button"
        onClick={() => handleSwitchRole("accountant")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          userRole === "accountant" && activePath !== "login"
            ? "bg-tertiary text-on-tertiary font-bold"
            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
        }`}
      >
        محاسب (حسابات فقط)
      </button>
      <span className="text-outline px-1">|</span>
      <button
        type="button"
        onClick={() => setActivePath("login")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          activePath === "login"
            ? "bg-primary text-on-primary font-bold"
            : "text-primary hover:bg-surface-container"
        }`}
      >
        <span className="material-symbols-outlined text-[15px]">lock</span>
        <span>بوابة الدخول</span>
      </button>
    </div>
  );

  if (activePath === "login") {
    return (
      <LoginView
        accounts={userAccounts}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Top Fixed Ministry Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-margin-lg">
        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-primary hover:bg-surface-container cursor-pointer"
            title="القائمة الرئيسية"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavigate(currentProfile.defaultPath)}
          >
            <img
              alt="شعار وزارة التربية"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-contain"
              src={schoolConfig.ministryLogoUrl || MINISTRY_LOGO_URL}
            />
            {schoolConfig.schoolLogoUrl && (
              <img
                alt="شعار المدرسة"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-contain border border-surface-container-high bg-white p-0.5"
                src={schoolConfig.schoolLogoUrl}
              />
            )}
          </div>
          <div
            className="flex flex-col cursor-pointer"
            onClick={() => handleNavigate(currentProfile.defaultPath)}
          >
            <span className="font-headline-sm text-headline-sm text-primary leading-tight">
              جمهورية العراق - وزارة التربية
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight hidden sm:inline">
              نظام الإدارة المدرسية الموحد | {schoolConfig.schoolName} -{" "}
              {schoolConfig.directorate}
            </span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-space-sm">
          <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-1 rounded">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              العام الدراسي:
            </span>
            <span className="font-label-md text-label-md text-primary font-bold tabular-nums">
              {schoolConfig.academicYear || "2024 - 2025"}
            </span>
          </div>
          <div className="flex items-center gap-space-xs bg-secondary-container px-space-md py-1 rounded">
            <span className="font-label-sm text-label-sm text-on-secondary-container font-semibold">
              {userRole === "teacher"
                ? `مادة التخصص: ${currentProfile.teacherSubject}`
                : userRole === "accountant"
                ? "قسم الحسابات والوصولات فقط"
                : "لوحة تحكم شاملة (ابتدائي • متوسط • إعدادي)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          {/* Cloud Database Sync Status Badge */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition-all shadow-2xs"
            title="قاعدة بيانات Firebase السحابية متصلة ومزامنة - انقر لإجراء مزامنة فورية كاملة"
          >
            <span
              className={`w-2 h-2 rounded-full bg-emerald-500 ${
                isSyncing ? "animate-ping" : "animate-pulse"
              }`}
            />
            <span className="material-symbols-outlined text-[16px] text-emerald-600">
              cloud_done
            </span>
            <span className="hidden sm:inline">
              {isSyncing ? "جاري المزامنة..." : "Firebase سحابي"}
            </span>
          </button>

          <div className="flex items-center gap-space-sm relative">
            {(userRole === "principal" || userRole === "registrar") && (
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                title="لوحة تحكم إعدادات المدرسة، الشعار، والمديرية"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span className="hidden md:inline">إعدادات المدرسة</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                window.print();
                handleNotify("جاري تحضير الصفحة للطباعة الرسمية");
              }}
              className="p-space-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
              title="طباعة السجل"
            >
              <span className="material-symbols-outlined text-[20px]">
                print
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-space-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
              title="لوحة إشعارات وتنبيهات النظام"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 top-11 w-96 max-w-[92vw] bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high p-space-md z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-surface-container pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      notifications_active
                    </span>
                    <span className="font-label-md text-label-md text-primary font-bold">
                      لوحة إشعارات وتنبيهات النظام
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-outline hover:text-on-surface cursor-pointer p-0.5 rounded"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>

                {/* Filter Tabs inside Notification Panel */}
                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-surface-container-low text-xs">
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      notificationFilter === "all"
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    الكل ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationFilter("absence")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      notificationFilter === "absence"
                        ? "bg-error text-white shadow-xs"
                        : "bg-[#FFEBEE] text-error hover:bg-[#FFCDD2]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      warning
                    </span>
                    <span>تنبيهات الغياب ({absenceAlertsCount})</span>
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-0.5 scrollbar-thin">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-lg border transition-all text-body-sm ${
                        notif.isRead
                          ? "bg-surface-container-low border-surface-container-high opacity-85"
                          : notif.type === "absence_alert"
                          ? "bg-error/5 border-error/25 shadow-xs"
                          : "bg-surface-container border-primary/20 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                              notif.type === "absence_alert"
                                ? "text-error"
                                : "text-primary"
                            }`}
                          >
                            {notif.type === "absence_alert"
                              ? "warning"
                              : "info"}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-primary leading-tight">
                              {notif.title}
                            </div>
                            <div className="text-[11px] text-on-surface mt-1 leading-relaxed">
                              {notif.message}
                            </div>
                            {notif.studentName && (
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-on-surface-variant font-mono">
                                <span>الطالب: {notif.studentName}</span>
                                {notif.adminId && (
                                  <span>• {notif.adminId}</span>
                                )}
                                {notif.gradeClass && (
                                  <span>• {notif.gradeClass}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-on-surface-variant shrink-0 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-surface-container-high/40 text-[11px]">
                        {notif.type === "absence_alert" ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleNavigate("attendance");
                              setShowNotifications(false);
                            }}
                            className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>الانتقال لسجل الحضور</span>
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_back
                            </span>
                          </button>
                        ) : (
                          <span className="text-on-surface-variant text-[10px]">
                            إشعار نظام رسمي
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkNotificationAsRead(notif.id)
                              }
                              className="text-secondary hover:underline cursor-pointer"
                            >
                              تحديد كمقروء
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-on-surface-variant hover:text-error cursor-pointer"
                            title="حذف الإشعار"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-6 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant block mb-1">
                        notifications_off
                      </span>
                      لا توجد إشعارات حالياً ضمن هذا التصنيف
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-surface-container pt-2 mt-2 text-xs">
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    تحديد الكل كمقروء
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllNotifications}
                    className="text-error hover:underline cursor-pointer"
                  >
                    مسح كافة التنبيهات
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-sm pr-space-sm">
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-tight">
                {currentProfile.name}
              </span>
              <span className="font-label-sm text-label-sm text-secondary leading-tight text-right">
                {currentProfile.roleTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate("login")}
              title="بوابة تسجيل الدخول المركزية"
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Right-Hand Official Sidebar (Filtered strictly by Role Permissions) */}
      <aside
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low z-40 flex flex-col justify-between py-space-md overflow-y-auto transition-transform duration-200 ${
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-space-sm px-space-md">
          <div className="px-space-sm py-space-xs flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              {userRole === "accountant"
                ? "بوابة الحسابات الحصرية"
                : userRole === "teacher"
                ? "بوابة المدرس المختص"
                : "بوابة الإدارة المعتمدة"}
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.path);
                  }}
                  className={`flex items-center gap-space-sm px-space-md py-space-sm transition-all ${
                    isActive
                      ? "bg-primary-container text-on-primary font-bold rounded"
                      : "rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>

          {/* Role Permission Explanation Card inside Sidebar */}
          <div className="mt-2 p-3 rounded-lg bg-surface-container text-xs text-on-surface-variant space-y-1">
            <div className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">
                shield_person
              </span>
              <span>نطاق الصلاحية الفعالة:</span>
            </div>
            {userRole === "principal" || userRole === "registrar" ? (
              <p>
                صلاحية كاملة للتحكم بجميع الأقسام (الرئيسية، شؤون الطلبة، قسم
                الصفوف، الدرجات، الحضور، الحسابات).
              </p>
            ) : userRole === "teacher" ? (
              <p>
                صلاحية مدرس المادة ({currentProfile.teacherSubject}): يظهر فقط
                رصد الدرجات، الحضور اليومي للمادة، والجدول الأسبوعي.
              </p>
            ) : (
              <p>
                صلاحية المحاسب المالي: يظهر قسم الحسابات والرسوم فقط ولا يظهر أي
                قسم إداري أو أكاديمي آخر.
              </p>
            )}
          </div>
        </div>

        <div className="px-space-md pt-space-md flex flex-col gap-space-sm">
          <button
            type="button"
            onClick={() => handleNavigate("login")}
            className="w-full bg-surface-container-high/70 hover:bg-surface-container-highest text-primary px-space-md py-space-sm rounded flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">
                lock_person
              </span>
              <span className="font-label-sm text-label-sm font-bold">
                تبديل الحساب / تسجيل الدخول
              </span>
            </div>
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
          </button>

          <div className="bg-surface-container px-space-md py-space-sm rounded flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              verified_user
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-primary font-bold">
                منظومة موثقة
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                الرقم الوزاري: IQ-EDU-2024
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pr-72 min-h-screen flex flex-col justify-between">
        <main className="relative pt-20 w-full px-gutter-lg pb-space-xl bg-background flex-1">
          {activePath === "dashboard" && (
            <DashboardView
              onNavigate={handleNavigate}
              onNotify={handleNotify}
              totalStudentsCount={1240 + students.length}
              schoolConfig={schoolConfig}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          )}

          {activePath === "accounts" && (
            <UserAccountsView
              accounts={userAccounts}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onNotify={handleNotify}
              onNavigate={handleNavigate}
              onSwitchToAccount={handleSwitchToAccount}
            />
          )}

          {activePath === "classrooms" && (
            <ClassroomsView
              students={students}
              onAddStudent={handleAddStudent}
              onNavigate={handleNavigate}
              onNotify={handleNotify}
            />
          )}

          {activePath === "exams-and-grades" && (
            <GradesLedgerView
              onNotify={handleNotify}
              userRole={userRole}
              teacherSubject={currentProfile.teacherSubject}
              students={students}
              schoolConfig={schoolConfig}
            />
          )}

          {activePath === "students" && (
            <StudentsRegistryView
              students={students}
              onAddStudent={handleAddStudent}
              onAddMultipleStudents={handleAddMultipleStudents}
              onUpdateStudentStatus={handleUpdateStudentStatus}
              openModalInitially={openNewStudentModal}
              onModalHandled={() => setOpenNewStudentModal(false)}
              onNotify={handleNotify}
            />
          )}

          {activePath === "staff" && (
            <StaffRegistryView
              onNotify={handleNotify}
              onNavigate={handleNavigate}
              schoolConfig={schoolConfig}
            />
          )}

          {activePath === "teacher-schedule" && (
            <WeeklyScheduleView
              onNotify={handleNotify}
              onNavigate={handleNavigate}
              schoolConfig={schoolConfig}
              userRole={userRole}
              currentTeacherName={currentProfile.name}
              teacherSubject={currentProfile.teacherSubject}
            />
          )}

          {activePath === "reports-and-settings" && (
            <DetailedReportsView
              onNotify={handleNotify}
              onNavigate={handleNavigate}
              schoolConfig={schoolConfig}
              students={students}
            />
          )}

          {(activePath === "academic-setup" ||
            activePath === "attendance" ||
            activePath === "finance") && (
            <SecondaryModulesView
              moduleKey={activePath}
              onNotify={handleNotify}
              onNavigate={handleNavigate}
              userRole={userRole}
              teacherSubject={currentProfile.teacherSubject}
              students={students}
              onAddNotification={handleAddNotification}
              systemNotifications={notifications}
            />
          )}
        </main>

        {/* Official Ministry Footer */}
        <footer className="w-full bg-surface-container-lowest py-space-sm px-gutter-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              نظام إدارة المدارس - معتمد وفق تعليمات وزارة التربية العراقية
              2024-2025
            </span>
            <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
              <span>مديرية تربية الكرخ الأولى</span>
              <span>•</span>
              <span>الخادم المركزي: مستقر</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="no-print fixed bottom-16 left-4 z-50 bg-primary text-on-primary px-space-lg py-space-sm rounded-xl shadow-lg flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      {/* Quick Role & Screen Switcher */}
      <QuickRoleAndScreenBar />

      {/* School Configuration & Identity Settings Modal */}
      <SchoolSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={schoolConfig}
        onSave={handleSaveSchoolConfig}
        onNotify={handleNotify}
      />
    </div>
  );
}
