import React, { useState, useMemo } from "react";
import {
  MINISTRY_LOGO_URL,
  SUBJECTS_BY_STAGE,
  UserAccount,
  UserRole,
} from "../data/mockData";

interface UserAccountsViewProps {
  accounts: UserAccount[];
  onAddAccount: (newAccount: UserAccount) => void;
  onUpdateAccount: (updatedAccount: UserAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onNotify: (msg: string) => void;
  onNavigate: (path: string) => void;
  onSwitchToAccount?: (account: UserAccount) => void;
}

export const UserAccountsView: React.FC<UserAccountsViewProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onNotify,
  onNavigate,
  onSwitchToAccount,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // New Account Form State
  // Form state - exactly the 5 fields requested by user
  const [fullName, setFullName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("123456");
  const [role, setRole] = useState<UserRole>("teacher");
  const [teacherSubject, setTeacherSubject] = useState<string>("الرياضيات");

  // Standard Iraqi Ministry of Education curriculum subjects
  const allSubjects = [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنكليزية",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "العلوم العامة",
    "التربية الإسلامية",
    "الاجتماعيات",
    "الحاسوب وتكنولوجيا المعلومات",
    "الاقتصاد",
    "التربية الفنية",
    "التربية الرياضية",
  ];

  const roleStats = useMemo(() => {
    const total = accounts.length;
    const teachers = accounts.filter((a) => a.role === "teacher").length;
    const accountants = accounts.filter((a) => a.role === "accountant").length;
    const management = accounts.filter(
      (a) => a.role === "principal" || a.role === "registrar"
    ).length;
    const active = accounts.filter((a) => a.isActive).length;
    return { total, teachers, accountants, management, active };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (roleFilter !== "all" && acc.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = acc.fullName.toLowerCase().includes(q);
        const matchesUser = acc.username.toLowerCase().includes(q);
        const matchesSubject = (acc.teacherSubject || "").toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesSubject) {
          return false;
        }
      }
      return true;
    });
  }, [accounts, roleFilter, searchQuery]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setPassword("123456");
    setRole("teacher");
    setTeacherSubject("الرياضيات");
    setEditingAccount(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (acc: UserAccount) => {
    setEditingAccount(acc);
    setFullName(acc.fullName);
    setUsername(acc.username);
    setPassword(acc.password);
    setRole(acc.role);
    setTeacherSubject(acc.teacherSubject || "الرياضيات");
    setShowAddModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      onNotify("يرجى إكمال جميع الحقول الإلزامية (الاسم الرباعي، اسم المستخدم، كلمة المرور)");
      return;
    }

    // Role Title determination
    let roleTitle = "كادر تدريسي";
    if (role === "principal") roleTitle = "مدير المدرسة (تحكم كامل)";
    else if (role === "registrar") roleTitle = "معاون المدير / المسجل (تحكم كامل)";
    else if (role === "teacher") roleTitle = `مدرس مادة ${teacherSubject}`;
    else if (role === "accountant") roleTitle = "المحاسب المالي المعتمد";

    if (editingAccount) {
      const updated: UserAccount = {
        ...editingAccount,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: `${username.trim().toLowerCase()}@moedu.iq`,
        password: password.trim(),
        role,
        roleTitle,
        teacherSubject: role === "teacher" ? teacherSubject : undefined,
      };
      onUpdateAccount(updated);
      onNotify(`تم تحديث بيانات حساب (${updated.fullName}) بنجاح`);
    } else {
      // Check duplicate username
      const isDuplicate = accounts.some(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (isDuplicate) {
        onNotify("اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر.");
        return;
      }

      const created: UserAccount = {
        id: `usr-${Date.now()}`,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: `${username.trim().toLowerCase()}@moedu.iq`,
        password: password.trim(),
        role,
        roleTitle,
        teacherSubject: role === "teacher" ? teacherSubject : undefined,
        phoneNumber: "+964 770 000 0000",
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        directorate: "بغداد / الكرخ الأولى",
        schoolName: "ثانوية المتميزين للبنين",
        isActive: true,
        createdAt: "2024/10/15",
      };
      onAddAccount(created);
      onNotify(`تم إنشاء حساب جديد بنجاح: (${created.fullName}) - الصلاحية: ${roleTitle}`);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleToggleActive = (account: UserAccount) => {
    const updated = { ...account, isActive: !account.isActive };
    onUpdateAccount(updated);
    onNotify(
      updated.isActive
        ? `تم تفعيل حساب (${account.fullName}) بنجاح`
        : `تم تعطيل حساب (${account.fullName}) وإيقاف صلاحية الدخول`
    );
  };

  const handleDelete = (account: UserAccount) => {
    if (account.username === "principal") {
      onNotify("لا يمكن حذف حساب المدير الرئيسي للنظام.");
      return;
    }
    onDeleteAccount(account.id);
    onNotify(`تم حذف حساب (${account.fullName}) نهائياً من النظام`);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* 1. Official Header */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border-r-4 border-primary">
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
                  قسم إدارة الحسابات والصلاحيات (المدرسين والمحاسبين)
                </h1>
                <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full border border-primary/20">
                  لوحة التحكم بالهوية والصلاحيات
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                إنشاء وإدارة حسابات الكادر التدريسي والمحاسبين والإداريين، وتعيين الصلاحيات ومواد
                التخصص لضبط شاشات النظام التي تظهر لكل مستخدم عند تسجيل الدخول
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-bold text-label-md shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>إنشاء حساب جديد للمدرسين أو المحاسبين</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md text-label-md border border-surface-container-highest cursor-pointer"
              title="الانتقال إلى واجهة تسجيل الدخول المباشرة"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              <span>واجهة تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block">إجمالي الحسابات</span>
            <span className="font-bold text-2xl text-primary">{roleStats.total}</span>
            <span className="text-[11px] text-[#1B5E20] block mt-0.5">
              {roleStats.active} حساب مفعل
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block">الكادر التدريسي (مدرسون)</span>
            <span className="font-bold text-2xl text-secondary">{roleStats.teachers}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              صلاحية الدرجات والحضور والجدول
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-secondary-container/30 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block">المحاسبون الماليون</span>
            <span className="font-bold text-2xl text-[#1B5E20]">{roleStats.accountants}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              صلاحية الحسابات والرسوم حصراً
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">calculate</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block">الإدارة والمعاونون</span>
            <span className="font-bold text-2xl text-tertiary">{roleStats.management}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              تحكم كامل بجميع أقسام النظام
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">shield_person</span>
          </div>
        </div>
      </div>

      {/* 3. Role Access Logic Reference Guide Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-space-md rounded-xl shadow-xs text-xs">
        <div className="flex items-center gap-2 text-primary font-bold mb-2">
          <span className="material-symbols-outlined text-[20px]">security</span>
          <span>آلية عمل الصلاحيات عند تسجيل الدخول (حسب متطلبات النظام المعتمد):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1">
            <div className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#1B5E20]">check_circle</span>
              <span>المدير والمعاون (Principal & Registrar):</span>
            </div>
            <p className="text-on-surface-variant text-[11px]">
              لوحة تحكم كاملة بالنظام: شؤون الطلبة، قسم الصفوف، الامتحانات والدرجات، الحضور،
              الحسابات، وإدارة الحسابات.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1">
            <div className="font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">school</span>
              <span>المدرس (Teacher):</span>
            </div>
            <p className="text-on-surface-variant text-[11px]">
              تظهر له فقط: رصد درجات مادته المحددة في الحساب، الحضور اليومي للمادة، وجدول الحصص
              الأسبوعي.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1">
            <div className="font-bold text-[#1B5E20] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#1B5E20]">payments</span>
              <span>المحاسب (Accountant):</span>
            </div>
            <p className="text-on-surface-variant text-[11px]">
              يظهر له قسم الحسابات والرسوم وإصدار وصولات القبض فقط، ولا يظهر له أي قسم إداري أو أكاديمي
              آخر.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Search and Role Filter Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم الكامل، اسم المستخدم، البريد أو مادة التخصص..."
            className="w-full h-10 pr-10 pl-9 bg-surface-container-low border border-surface-container-high rounded-lg outline-none text-body-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-2.5 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <span className="text-xs text-on-surface-variant font-medium ml-1">تصفية حسب الدور:</span>
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            الكل ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("teacher")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "teacher"
                ? "bg-secondary text-white shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            المدرسون ({roleStats.teachers})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("accountant")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "accountant"
                ? "bg-[#1B5E20] text-white shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            المحاسبون ({roleStats.accountants})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("principal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "principal"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            الإدارة ({roleStats.management})
          </button>
        </div>
      </div>

      {/* 5. Accounts Master Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high">
        <div className="px-space-lg py-space-md bg-surface-container-high/40 flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-primary font-bold">
            سجل حسابات المستخدمين المعتمدة ({filteredAccounts.length} حساب)
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            تسجيل الدخول يتم باسم المستخدم أو البريد وكلمة المرور
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container text-primary font-table-header text-table-header h-12">
                <th className="px-3 w-10 text-center">ت</th>
                <th className="px-4 min-w-[160px]">الاسم الكامل والموظف</th>
                <th className="px-4 min-w-[170px]">بيانات الدخول (اسم المستخدم / البريد)</th>
                <th className="px-3 min-w-[120px]">كلمة المرور</th>
                <th className="px-4 min-w-[140px]">الصلاحية الممنوحة</th>
                <th className="px-3 min-w-[130px]">مادة التخصص (للمدرسين)</th>
                <th className="px-3 text-center min-w-[100px]">حالة الحساب</th>
                <th className="px-4 text-center min-w-[130px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-table-data text-table-data">
              {filteredAccounts.map((acc, idx) => {
                const isPassVisible = showPasswordMap[acc.id] || false;
                return (
                  <tr
                    key={acc.id}
                    className={`hover:bg-surface-container-low transition-colors ${
                      !acc.isActive ? "opacity-60 bg-surface-container-low/50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-bold text-on-surface-variant tabular-nums text-center">
                      0{idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-on-surface text-sm">{acc.fullName}</div>
                      <div className="text-[11px] text-on-surface-variant font-mono">
                        {acc.employeeId || "رقم وظيفي معتمد"}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">alternate_email</span>
                        <span>{acc.username}</span>
                      </div>
                      <div className="text-on-surface-variant text-[11px]">{acc.email}</div>
                    </td>

                    <td className="px-3 py-3 font-mono">
                      <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded border border-surface-container-high w-fit">
                        <span className="font-bold text-on-surface">
                          {isPassVisible ? acc.password : "••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(acc.id)}
                          className="text-on-surface-variant hover:text-primary cursor-pointer p-0.5"
                          title={isPassVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isPassVisible ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                          acc.role === "principal" || acc.role === "registrar"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : acc.role === "teacher"
                            ? "bg-secondary-container/50 text-on-secondary-container border border-secondary/30"
                            : "bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {acc.role === "principal"
                            ? "shield_person"
                            : acc.role === "registrar"
                            ? "badge"
                            : acc.role === "teacher"
                            ? "school"
                            : "payments"}
                        </span>
                        <span>{acc.roleTitle}</span>
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {acc.role === "teacher" ? (
                        <span className="font-bold text-secondary text-xs">
                          {acc.teacherSubject || "الرياضيات"}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">غير محدد (إداري/مالي)</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(acc)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          acc.isActive
                            ? "bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]"
                            : "bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2]"
                        }`}
                        title="انقر لتغيير حالة التفعيل"
                      >
                        {acc.isActive ? "نشط ومفعل" : "معطل"}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onSwitchToAccount && (
                          <button
                            type="button"
                            onClick={() => onSwitchToAccount(acc)}
                            className="p-1 rounded text-secondary hover:bg-secondary/10 cursor-pointer transition-colors"
                            title="تسجيل الدخول ومعاينة النظام بصلاحية هذا الحساب"
                          >
                            <span className="material-symbols-outlined text-[18px]">login</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1 rounded text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                          title="تعديل الحساب والصلاحية"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(acc)}
                          className="p-1 rounded text-error hover:bg-error/10 cursor-pointer transition-colors"
                          title="حذف الحساب"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant block mb-1">
                      person_search
                    </span>
                    لا توجد حسابات مطابقة للبحث أو التصفية الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal: Create or Edit User Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">
                  {editingAccount ? "manage_accounts" : "person_add"}
                </span>
                <span className="font-headline-sm text-headline-sm font-bold">
                  {editingAccount ? "تعديل حساب وصلاحيات المستخدم" : "إنشاء حساب جديد للمدرسين أو المحاسبين"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form Body - Exactly the 5 requested fields */}
            <form onSubmit={handleSaveAccount} className="p-space-lg space-y-4 text-xs">
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-[11px] text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>الحقول الخمسة المطلوبة لإنشاء واعتماد الحساب وتحديد الصلاحية في النظام:</span>
              </div>

              {/* 1. الاسم الرباعي */}
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  1. الاسم الرباعي واللقب <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله حسين الجبوري"
                    className="w-full h-10 px-3 pl-9 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-medium focus:border-primary text-xs"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
                    person
                  </span>
                </div>
              </div>

              {/* 2 & 3. اسم المستخدم وكلمة المرور */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 2. اسم المستخدم */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    2. اسم المستخدم (لتسجيل الدخول) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: ahmed_teacher أو ahmed_math"
                      className="w-full h-10 px-3 pl-9 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-mono focus:border-primary text-xs"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
                      alternate_email
                    </span>
                  </div>
                </div>

                {/* 3. كلمة المرور */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    3. كلمة المرور في النظام <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور..."
                      className="w-full h-10 px-3 pl-9 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-mono focus:border-primary text-xs"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
                      key
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. نوع الصلاحية الممنوحة */}
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  4. نوع الصلاحية الممنوحة <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setRole(newRole);
                      if (newRole === "accountant") {
                        setTeacherSubject("شعبة الحسابات والمالية");
                      } else if (newRole === "principal") {
                        setTeacherSubject("إدارة المدرسة (عام)");
                      } else if (newRole === "registrar") {
                        setTeacherSubject("شؤون الطلبة والتسجيل");
                      } else if (teacherSubject.includes("إدارة") || teacherSubject.includes("شعبة")) {
                        setTeacherSubject("الرياضيات");
                      }
                    }}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high rounded-lg outline-none font-bold cursor-pointer focus:border-primary text-xs"
                  >
                    <option value="teacher">كادر تدريسي (مدرس مادة - درجات وغيابات وجدول)</option>
                    <option value="accountant">محاسب مالي (حسابات ورسوم ومقبوضات فقط)</option>
                    <option value="registrar">معاون المدير / مسجل (تحكم كامل بالنظام)</option>
                    <option value="principal">مدير مدرسة (تحكم شامل وصلاحيات عليا)</option>
                  </select>
                </div>
              </div>

              {/* 5. مادة التخصص التدريسي */}
              <div className="p-3 bg-secondary-container/15 rounded-lg border border-secondary/25">
                <label className="block font-bold text-secondary mb-1">
                  5. مادة التخصص التدريسي <span className="text-error">*</span>
                </label>
                <p className="text-[11px] text-on-surface-variant mb-2">
                  {role === "teacher"
                    ? "المادة الدراسية التي سيتولى المدرس تدريسها ورصد درجاتها وتثبيت غياباتها في النظام:"
                    : "تخصص العمل المعتمد في السجلات المدرسية:"}
                </p>
                <select
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-secondary/40 rounded-lg outline-none font-bold text-secondary cursor-pointer text-xs"
                >
                  {allSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  {role === "accountant" && (
                    <option value="شعبة الحسابات والمالية">شعبة الحسابات والمالية</option>
                  )}
                  {role === "principal" && (
                    <option value="إدارة المدرسة (عام)">إدارة المدرسة (عام)</option>
                  )}
                  {role === "registrar" && (
                    <option value="شؤون الطلبة والتسجيل">شؤون الطلبة والتسجيل</option>
                  )}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-bold cursor-pointer hover:bg-surface-container-high"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold shadow-sm cursor-pointer hover:bg-primary-container"
                >
                  {editingAccount ? "حفظ التعديلات" : "إنشاء واعتماد الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
