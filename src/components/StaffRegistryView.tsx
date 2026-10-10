import React, { useState, useMemo } from "react";
import {
  INITIAL_STAFF_MEMBERS,
  SchoolConfig,
  StaffCategory,
  StaffMember,
  SUBJECTS_BY_STAGE,
} from "../data/mockData";

interface StaffRegistryViewProps {
  onNotify: (msg: string) => void;
  onNavigate: (path: string) => void;
  schoolConfig: SchoolConfig;
}

export const StaffRegistryView: React.FC<StaffRegistryViewProps> = ({
  onNotify,
  onNavigate,
  schoolConfig,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem("school_staff_registry");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STAFF_MEMBERS;
      }
    }
    return INITIAL_STAFF_MEMBERS;
  });

  const saveStaffList = (updated: StaffMember[]) => {
    setStaffList(updated);
    try {
      localStorage.setItem("school_staff_registry", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | StaffCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "on_leave" | "delegated">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State
  const initialForm: Omit<StaffMember, "id"> = {
    employeeCode: `EMP-2024-${String(staffList.length + 1).padStart(3, "0")}`,
    fullName: "",
    category: "teacher",
    roleTitle: "مدرس",
    subjectSpecialization: "الرياضيات",
    qualification: "بكالوريوس",
    yearsOfService: 5,
    weeklyQuotas: 16,
    phoneNumber: "+964 780 ",
    email: "",
    assignedStages: ["الخامس العلمي (أ)"],
    status: "active",
    joinedYear: "2020",
    notes: "",
  };
  const [formData, setFormData] = useState<Omit<StaffMember, "id">>(initialForm);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      ...initialForm,
      employeeCode: `EMP-2024-${String(staffList.length + 1).padStart(3, "0")}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      employeeCode: member.employeeCode,
      fullName: member.fullName,
      category: member.category,
      roleTitle: member.roleTitle,
      subjectSpecialization: member.subjectSpecialization || "",
      qualification: member.qualification,
      yearsOfService: member.yearsOfService,
      weeklyQuotas: member.weeklyQuotas || 0,
      phoneNumber: member.phoneNumber,
      email: member.email || "",
      assignedStages: member.assignedStages || [],
      status: member.status,
      joinedYear: member.joinedYear,
      notes: member.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      onNotify("يرجى إدخال اسم الموظف/المدرس الرباعي");
      return;
    }

    if (editingStaff) {
      const updated = staffList.map((m) =>
        m.id === editingStaff.id ? { ...formData, id: editingStaff.id } : m
      );
      saveStaffList(updated);
      onNotify(`تم تحديث بيانات (${formData.fullName}) بنجاح`);
    } else {
      const newMember: StaffMember = {
        ...formData,
        id: `stf-${Date.now()}`,
      };
      saveStaffList([newMember, ...staffList]);
      onNotify(`تمت إضافة (${formData.fullName}) إلى سجل الكادر المدرسي`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف (${name}) من سجل الكادر المدرسي؟`)) {
      const updated = staffList.filter((m) => m.id !== id);
      saveStaffList(updated);
      onNotify(`تم حذف (${name}) من السجل`);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = staffList.map((m) => {
      if (m.id === id) {
        const nextStatus: StaffMember["status"] =
          m.status === "active" ? "on_leave" : m.status === "on_leave" ? "delegated" : "active";
        return { ...m, status: nextStatus };
      }
      return m;
    });
    saveStaffList(updated);
    onNotify("تم تحديث حالة دوام الموظف");
  };

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const matchCategory =
        activeCategoryFilter === "all" || item.category === activeCategoryFilter;
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.employeeCode.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q) ||
        (item.subjectSpecialization && item.subjectSpecialization.toLowerCase().includes(q)) ||
        item.phoneNumber.includes(q);
      return matchCategory && matchStatus && matchSearch;
    });
  }, [staffList, activeCategoryFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const teachers = staffList.filter((m) => m.category === "teacher").length;
    const admin = staffList.filter((m) => m.category === "administrative").length;
    const service = staffList.filter((m) => m.category === "service").length;
    const totalQuotas = staffList.reduce((sum, m) => sum + (m.weeklyQuotas || 0), 0);
    const activeCount = staffList.filter((m) => m.status === "active").length;
    return { total, teachers, admin, service, totalQuotas, activeCount };
  }, [staffList]);

  // Export to Excel / CSV
  const handleExportStaffExcel = () => {
    const headers = [
      "الرقم الوظيفي",
      "الاسم الرباعي واللقب",
      "نوع الكادر",
      "الصفة الوظيفية",
      "مادة التخصص",
      "المؤهل العلمي",
      "سنوات الخدمة",
      "النصاب الأسبوعي",
      "حالة الدوام",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "ملاحظات",
    ];
    const rows = filteredStaff.map((m) => [
      m.employeeCode,
      m.fullName,
      m.category === "teacher" ? "تدريسي" : m.category === "administrative" ? "إداري" : "خدمي",
      m.roleTitle,
      m.subjectSpecialization || "-",
      m.qualification,
      m.yearsOfService,
      m.weeklyQuotas || 0,
      m.status === "active" ? "مستمر بالدوام" : m.status === "on_leave" ? "مجاز" : "منتدب",
      m.phoneNumber,
      m.email || "-",
      m.notes || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_الكادر_المدرسي_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("تم تصدير سجل الكادر إلى ملف Excel بنجاح");
  };

  // All available subjects
  const allAvailableSubjects = Array.from(
    new Set([
      ...SUBJECTS_BY_STAGE.primary,
      ...SUBJECTS_BY_STAGE.intermediate,
      ...SUBJECTS_BY_STAGE.preparatory,
      "الحاسوب",
      "التربية الفنية",
      "التربية الرياضية",
      "النشاط المدرسي",
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
            <div className="text-xs font-bold mt-1">سجل ملاك الكادر التدريسي والوظيفي</div>
          </div>
          <div className="text-left text-xs space-y-1">
            <img
              src={schoolConfig.schoolLogoUrl}
              alt="شعار المدرسة"
              className="w-12 h-12 object-contain ml-auto"
            />
            <div>تاريخ الإصدار: {new Date().toLocaleDateString("ar-IQ")}</div>
            <div className="font-mono">الكود: {schoolConfig.schoolCode}</div>
          </div>
        </div>
      </div>

      {/* Main Top Banner (No Print) */}
      <div className="no-print bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high/60 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[32px]">badge</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
                الكادر التدريسي والوظيفي
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                {stats.total} عضواً معتمداً
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              إدارة شؤون المدرسين والمعلمين والموظفين الإداريين والأنصبة الأسبوعية • {schoolConfig.schoolName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportStaffExcel}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>تصدير Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تحضير سجل الكادر التدريسي والوظيفي للطباعة الرسمية");
            }}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>طباعة الملاك المعتمد</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>إضافة مدرس / موظف جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (No Print) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">groups</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant block">إجمالي الكادر</span>
            <span className="text-xl font-black text-primary tabular-nums">{stats.total}</span>
            <span className="text-[10px] text-secondary block font-semibold">{stats.activeCount} مستمر بالدوام</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant block">المدرسون والمعلمون</span>
            <span className="text-xl font-black text-secondary tabular-nums">{stats.teachers}</span>
            <span className="text-[10px] text-on-surface-variant block">هيئة تدريسية معتمدة</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant block">الكادر الإداري</span>
            <span className="text-xl font-black text-tertiary tabular-nums">{stats.admin}</span>
            <span className="text-[10px] text-on-surface-variant block">إدارة وحسابات وإرشاد</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#689F38]/10 text-[#689F38] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">calendar_view_week</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant block">إجمالي الأنصبة</span>
            <span className="text-xl font-black text-[#689F38] tabular-nums">{stats.totalQuotas}</span>
            <span className="text-[10px] text-on-surface-variant block">حصة أسبوعياً موزعة</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/60 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-outline/10 text-outline flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">engineering</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant block">الكادر الفني والخدمي</span>
            <span className="text-xl font-black text-on-surface tabular-nums">{stats.service}</span>
            <span className="text-[10px] text-on-surface-variant block">خدمات وصيانة وحراسة</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar (No Print) */}
      <div className="no-print bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategoryFilter === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            الكل ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter("teacher")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "teacher"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>المدرسون والمعلمون ({stats.teachers})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter("administrative")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "administrative"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            <span>الكادر الإداري ({stats.admin})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter("service")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "service"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">handyman</span>
            <span>الخدمات والحراسة ({stats.service})</span>
          </button>
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الرقم، التخصص..."
              className="w-full h-9 pr-9 pl-3 bg-surface-container-low rounded-xl text-xs outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 bg-surface-container-low rounded-xl text-xs font-semibold outline-none cursor-pointer border border-transparent focus:border-primary"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">مستمر بالدوام</option>
            <option value="on_leave">مجاز رسمياً</option>
            <option value="delegated">منتدب خارجياً</option>
          </select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-surface-container-low p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === "table" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-outline"
              }`}
              title="عرض كجدول"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === "cards" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-outline"
              }`}
              title="عرض كبطاقات"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Roster: Table View */}
      {viewMode === "table" ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-surface-container text-primary font-bold text-xs h-12 border-b border-surface-container-high">
                  <th className="px-4">ت</th>
                  <th className="px-4">الرقم الوظيفي</th>
                  <th className="px-4">الاسم الرباعي واللقب</th>
                  <th className="px-4">الصفة الوظيفية</th>
                  <th className="px-4">التخصص والمادة</th>
                  <th className="px-4">المؤهل والخدمة</th>
                  <th className="px-4 text-center">النصاب</th>
                  <th className="px-4">رقم الهاتف</th>
                  <th className="px-4 text-center">حالة الدوام</th>
                  <th className="px-4 text-center no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs font-medium">
                {filteredStaff.map((member, index) => (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-container-low/70 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-on-surface-variant">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-secondary text-[11px]">
                      {member.employeeCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-on-surface text-sm">{member.fullName}</div>
                      {member.email && (
                        <div className="text-[10px] text-outline font-mono">{member.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {member.roleTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.subjectSpecialization ? (
                        <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold text-[11px]">
                          {member.subjectSpecialization}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/70">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-on-surface font-semibold">{member.qualification}</div>
                      <div className="text-[11px] text-on-surface-variant font-mono">
                        خدمة: {member.yearsOfService} سنة
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-primary">
                      {member.category === "teacher" ? (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {member.weeklyQuotas || 0} حصة
                        </span>
                      ) : (
                        <span className="text-outline text-[11px]">دوام كامل</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                      {member.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member.id)}
                        title="انقر لتغيير حالة الدوام"
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-transform active:scale-95 ${
                          member.status === "active"
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : member.status === "on_leave"
                            ? "bg-[#FFF8E1] text-[#F57F17]"
                            : "bg-[#EDE7F6] text-[#512DA8]"
                        }`}
                      >
                        {member.status === "active"
                          ? "مستمر بالدوام"
                          : member.status === "on_leave"
                          ? "مجاز رسمياً"
                          : "منتدب خارجياً"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 text-primary hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors"
                          title="تعديل البيانات"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member.id, member.fullName)}
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg cursor-pointer transition-colors"
                          title="حذف من السجل"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[42px] block mb-2 text-outline">
                        person_search
                      </span>
                      لا توجد بيانات مطابقة لمعايير البحث في سجل الكادر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                      {member.fullName.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-sm">{member.fullName}</h3>
                      <span className="text-xs font-semibold text-primary">{member.roleTitle}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.status === "active"
                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                        : member.status === "on_leave"
                        ? "bg-[#FFF8E1] text-[#F57F17]"
                        : "bg-[#EDE7F6] text-[#512DA8]"
                    }`}
                  >
                    {member.status === "active" ? "مستمر" : member.status === "on_leave" ? "مجاز" : "منتدب"}
                  </span>
                </div>

                <div className="pt-2 border-t border-surface-container space-y-1.5 text-xs">
                  {member.subjectSpecialization && (
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">مادة التخصص:</span>
                      <span className="font-bold text-secondary">{member.subjectSpecialization}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">المؤهل وسنوات الخدمة:</span>
                    <span className="font-medium text-on-surface">
                      {member.qualification} ({member.yearsOfService} سنة)
                    </span>
                  </div>
                  {member.category === "teacher" && (
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">النصاب الأسبوعي:</span>
                      <span className="font-mono font-bold text-primary">{member.weeklyQuotas || 0} حصة</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">رقم الهاتف:</span>
                    <span className="font-mono text-on-surface">{member.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-surface-container flex items-center justify-between">
                <span className="text-[10px] font-mono text-outline">{member.employeeCode}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(member)}
                    className="p-1.5 text-primary hover:bg-surface-container-high rounded-lg cursor-pointer"
                    title="تعديل"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(member.id, member.fullName)}
                    className="p-1.5 text-error hover:bg-error/10 rounded-lg cursor-pointer"
                    title="حذف"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Signatures for Printouts (Print Only) */}
      <div className="hidden print:flex items-center justify-between pt-8 border-t border-stone-800 text-xs mt-8">
        <div className="text-center">
          <div className="font-bold">مسؤول شؤون الموظفين والملاك</div>
          <div className="mt-8 text-stone-500">التوقيع: .....................</div>
        </div>
        <div className="text-center">
          <div className="font-bold">معاون المدير للشؤون الإدارية</div>
          <div className="mt-8 font-semibold">{schoolConfig.vicePrincipalName}</div>
        </div>
        <div className="text-center">
          <div className="font-bold">مدير المدرسة والمشرف على الملاك</div>
          <div className="mt-8 font-bold">{schoolConfig.principalName}</div>
          <div className="text-[10px] text-stone-500">(الختم الرسمي للمدرسة)</div>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">
                  {editingStaff ? "edit" : "person_add"}
                </span>
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  {editingStaff ? "تعديل بيانات عضو الكادر" : "إضافة عضو كادر جديد (مدرس أو موظف)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStaff} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-primary">الاسم الرباعي واللقب *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="مثال: أ. حامد جاسم الشمري"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">الرقم الوظيفي (كود الموظف) *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-primary">نوع الكادر *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value as StaffCategory;
                      setFormData({
                        ...formData,
                        category: cat,
                        roleTitle: cat === "teacher" ? "مدرس" : cat === "administrative" ? "معاون إداري" : "موظف خدمات",
                      });
                    }}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-semibold text-xs cursor-pointer"
                  >
                    <option value="teacher">هيئة تدريسية (مدرس / معلم)</option>
                    <option value="administrative">كادر إداري ومالي ومكتبي</option>
                    <option value="service">كادر فني وخدمات وحراسة</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">الصفة الوظيفية المحددة *</label>
                  <input
                    type="text"
                    required
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder="مثال: مدرس أول، كاتب حسابات، أمين مكتبة..."
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs"
                  />
                </div>

                {formData.category === "teacher" && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-secondary">مادة التخصص التدريسي *</label>
                      <select
                        value={formData.subjectSpecialization}
                        onChange={(e) => setFormData({ ...formData, subjectSpecialization: e.target.value })}
                        className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-semibold text-xs cursor-pointer"
                      >
                        {allAvailableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-secondary">النصاب الأسبوعي للحصص</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.weeklyQuotas || 16}
                        onChange={(e) => setFormData({ ...formData, weeklyQuotas: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">المؤهل العلمي / الشهادة</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs cursor-pointer"
                  >
                    <option value="دكتوراه">دكتوراه</option>
                    <option value="ماجستير">ماجستير</option>
                    <option value="دبلوم عالي">دبلوم عالي</option>
                    <option value="بكالوريوس">بكالوريوس</option>
                    <option value="دبلوم معلمين">دبلوم معلمين</option>
                    <option value="إعدادية">إعدادية</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">سنوات الخدمة الوظيفية</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsOfService}
                    onChange={(e) => setFormData({ ...formData, yearsOfService: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+964 780 ..."
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">حالة الدوام المعتمدة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs cursor-pointer"
                  >
                    <option value="active">مستمر بالدوام الفعلي</option>
                    <option value="on_leave">مجاز إجازة رسمية</option>
                    <option value="delegated">منتدب إلى جهة أخرى</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-on-surface">ملاحظات إدارية وتكليفات</label>
                  <input
                    type="text"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="مثال: عضو اللجنة الامتحانية، مشرف المختبر، منسق النشاط..."
                    className="w-full h-10 px-3 bg-surface-container-low rounded-xl border border-surface-container-high outline-none text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-surface-container flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold shadow-sm cursor-pointer"
                >
                  {editingStaff ? "حفظ التعديلات" : "إضافة إلى السجل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
