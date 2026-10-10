import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  ALL_GRADES,
  STAGE_GRADES,
  STAGE_LABELS,
  StageKey,
  StudentRecord,
} from "../data/mockData";

interface StudentsRegistryViewProps {
  students: StudentRecord[];
  onAddStudent: (newStudent: StudentRecord) => void;
  onAddMultipleStudents: (newStudents: StudentRecord[]) => void;
  onUpdateStudentStatus: (
    id: string,
    statusType: StudentRecord["statusType"],
    statusLabel: string
  ) => void;
  openModalInitially?: boolean;
  onModalHandled?: () => void;
  onNotify: (msg: string) => void;
}

interface ParsedExcelRow {
  fullName: string;
  adminId: string;
  nationalId: string;
  stageCode: StageKey;
  gradeCode: string;
  gradeSection: string;
  sectionCode: string;
  guardianName: string;
  guardianPhone: string;
  birthInfo: string;
}

const REQUIRED_SYSTEM_FIELDS = [
  "الاسم الرباعي واللقب",
  "الرقم الإداري",
  "الرقم الوطني",
  "المرحلة الدراسية",
  "الصف",
  "الشعبة",
  "ولي الأمر",
  "رقم الهاتف",
  "تاريخ التولد",
];

export const StudentsRegistryView: React.FC<StudentsRegistryViewProps> = ({
  students,
  onAddStudent,
  onAddMultipleStudents,
  onUpdateStudentStatus,
  openModalInitially = false,
  onModalHandled,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<StageKey | "">("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [selectedDossier, setSelectedDossier] = useState<StudentRecord | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<string>("10 طلاب في الصفحة");

  // New Student Form State (with Admin ID + Dynamic Stage -> Grade)
  const [newFullName, setNewFullName] = useState<string>("");
  const [newAdminId, setNewAdminId] = useState<string>("ADM-2024-1095");
  const [newNationalId, setNewNationalId] = useState<string>("");
  const [newBirthDate, setNewBirthDate] = useState<string>("2007-05-15");
  const [newStage, setNewStage] = useState<StageKey>("preparatory");
  const [newGradeCode, setNewGradeCode] = useState<string>("6s");
  const [newSection, setNewSection] = useState<string>("الشعبة (أ)");
  const [newGuardianName, setNewGuardianName] = useState<string>("");
  const [newGuardianPhone, setNewGuardianPhone] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [docIdCard, setDocIdCard] = useState<boolean>(true);
  const [docSchoolCard, setDocSchoolCard] = useState<boolean>(true);
  const [docMedical, setDocMedical] = useState<boolean>(false);

  // Smart Excel Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [ignoredExtraColumns, setIgnoredExtraColumns] = useState<string[]>([]);
  const [extractedRows, setExtractedRows] = useState<ParsedExcelRow[]>([]);

  useEffect(() => {
    if (openModalInitially) {
      setIsNewModalOpen(true);
      if (onModalHandled) onModalHandled();
    }
  }, [openModalInitially, onModalHandled]);

  // Cascading Stage -> Grade for Filter Bar
  const availableFilterGrades = stageFilter
    ? STAGE_GRADES[stageFilter]
    : ALL_GRADES;

  const handleStageFilterChange = (val: string) => {
    const nextStage = val as StageKey | "";
    setStageFilter(nextStage);
    // Reset grade filter when stage changes so grades always match the chosen stage
    setGradeFilter("");
  };

  // Cascading Stage -> Grade for New Student Modal
  const availableModalGrades = STAGE_GRADES[newStage];

  const handleModalStageChange = (nextStage: StageKey) => {
    setNewStage(nextStage);
    const firstGrade = STAGE_GRADES[nextStage][0]?.code || "";
    setNewGradeCode(firstGrade);
  };

  const filteredStudents = students.filter((st) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchesSearch =
        st.fullName.toLowerCase().includes(q) ||
        st.ministryId.toLowerCase().includes(q) ||
        st.adminId.toLowerCase().includes(q) ||
        st.nationalId.toLowerCase().includes(q) ||
        st.guardianName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (stageFilter && st.stageCode !== stageFilter) return false;
    if (gradeFilter && st.gradeCode !== gradeFilter) return false;
    if (sectionFilter && st.sectionCode !== sectionFilter) return false;
    if (statusFilter && st.statusType !== statusFilter) return false;
    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setStageFilter("");
    setGradeFilter("");
    setSectionFilter("");
    setStatusFilter("");
    onNotify("تمت إعادة ضبط جميع الفلاتر لعرض السجل الكامل");
  };

  const handleExportCSV = () => {
    const headers = [
      "ت",
      "الاسم الرباعي واللقب",
      "الرقم الإحصائي",
      "الرقم الإداري",
      "الرقم الوطني",
      "المرحلة الدراسية",
      "الصف والشعبة",
      "ولي الأمر",
      "رقم الهاتف",
      "الحالة الدراسية",
      "تاريخ القيد",
    ];
    const rows = filteredStudents.map((s) => [
      s.seq,
      s.fullName,
      s.ministryId,
      s.adminId,
      s.nationalId,
      STAGE_LABELS[s.stageCode],
      s.gradeSection,
      s.guardianName,
      s.guardianPhone,
      s.statusLabel,
      s.registrationDate,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "سجل_شؤون_الطلبة_العام_2024_2025.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("تم تصدير قائمة الطلبة المعروضة إلى ملف Excel (CSV)");
  };

  const handleCreateStudent = () => {
    if (!newFullName.trim()) {
      onNotify("يرجى إدخال الاسم الرباعي واللقب للطالب");
      return;
    }
    const nextNum = students.length + 1;
    const seqStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const randomCode = Math.floor(8900 + Math.random() * 900);
    const sectionLetter = newSection.includes("(ب)")
      ? "ب"
      : newSection.includes("(ج)")
      ? "ج"
      : "أ";
    const sectionCodeVal =
      sectionLetter === "ب" ? "b" : sectionLetter === "ج" ? "c" : "a";
    const gradeObj = STAGE_GRADES[newStage].find(
      (g) => g.code === newGradeCode
    );
    const gradeLabel = gradeObj ? gradeObj.label : "السادس العلمي";

    const newRecord: StudentRecord = {
      id: `st-${Date.now()}`,
      seq: seqStr,
      avatar: students[0].avatar,
      avatarAlt: "صورة الطالب الرسمية",
      fullName: newFullName.trim(),
      birthInfo: `تولد: ${newBirthDate.replace(/-/g, "/")} - بغداد/الكرخ`,
      ministryId: `IQ-2024-${randomCode}`,
      adminId: newAdminId.trim() || `ADM-2024-${1000 + nextNum}`,
      nationalId: newNationalId.trim() || "19049918273",
      gradeSection: `${gradeLabel} (${sectionLetter})`,
      stageCode: newStage,
      gradeCode: newGradeCode,
      sectionCode: sectionCodeVal,
      guardianName: newGuardianName.trim() || "ولي الأمر المعتمد",
      guardianPhone: newGuardianPhone.trim() || "+964 771 000 1122",
      statusLabel: "مستمر بالدوام",
      statusType: "active",
      registrationDate: "2024/10/15",
      address: newAddress.trim() || "بغداد، الكرخ الأولى",
    };

    onAddStudent(newRecord);
    setIsNewModalOpen(false);
    setNewFullName("");
    setNewAdminId(`ADM-2024-${1096 + nextNum}`);
    setNewNationalId("");
    setNewGuardianName("");
    setNewGuardianPhone("");
    setNewAddress("");
    onNotify(
      `تم تسجيل الطالب (${newRecord.fullName}) بالرقم الإداري ${newRecord.adminId}`
    );
  };

  // Smart Mapper that extracts ONLY required fields and ignores unknown/extra columns
  const processRawSheetObjects = (
    rawObjects: Record<string, unknown>[],
    fileNameLabel: string
  ) => {
    if (!rawObjects || rawObjects.length === 0) {
      onNotify("الملف المرفوع لا يحتوي على صفوف بيانات");
      return;
    }

    const allHeaders = Object.keys(rawObjects[0]);
    const knownAliases: Record<string, string[]> = {
      fullName: [
        "الاسم الرباعي واللقب",
        "اسم الطالب",
        "الاسم",
        "الاسم الكامل",
        "FullName",
        "Name",
      ],
      adminId: [
        "الرقم الإداري",
        "الرقم الاداري",
        "رقم القيد الإداري",
        "AdminID",
        "رقم الادارة",
      ],
      nationalId: [
        "الرقم الوطني",
        "البطاقة الوطنية",
        "الرقم الوطني الموحد",
        "NationalID",
      ],
      stage: ["المرحلة الدراسية", "المرحلة", "Stage"],
      grade: ["الصف", "الصف الدراسي", "Grade"],
      section: ["الشعبة", "Section"],
      guardianName: [
        "ولي الأمر",
        "اسم ولي الأمر",
        "اسم ولي الامر",
        "Guardian",
      ],
      guardianPhone: [
        "رقم الهاتف",
        "هاتف ولي الأمر",
        "الموبايل",
        "Phone",
      ],
      birthDate: ["تاريخ التولد", "تاريخ الميلاد", "التولد", "BirthDate"],
    };

    const matchedSourceHeaders = new Set<string>();
    const findValue = (
      row: Record<string, unknown>,
      fieldKey: keyof typeof knownAliases
    ): string => {
      const aliases = knownAliases[fieldKey];
      for (const h of Object.keys(row)) {
        const cleanH = h.trim();
        if (
          aliases.some(
            (a) =>
              cleanH === a ||
              cleanH.toLowerCase() === a.toLowerCase() ||
              cleanH.includes(a)
          )
        ) {
          matchedSourceHeaders.add(h);
          return String(row[h] ?? "").trim();
        }
      }
      return "";
    };

    const parsed: ParsedExcelRow[] = rawObjects
      .map((row, idx) => {
        const fullName = findValue(row, "fullName");
        if (!fullName) return null;
        const adminId =
          findValue(row, "adminId") || `ADM-2024-${4001 + idx}`;
        const nationalId =
          findValue(row, "nationalId") || `1908${Math.floor(1000000 + Math.random() * 8999999)}`;
        const stageRaw = findValue(row, "stage");
        const gradeRaw = findValue(row, "grade");
        const sectionRaw = findValue(row, "section") || "أ";
        const guardianName =
          findValue(row, "guardianName") || "ولي أمر الطالب";
        const guardianPhone =
          findValue(row, "guardianPhone") || "+964 770 123 4567";
        const birthRaw = findValue(row, "birthDate") || "2008/05/10";

        let stageCode: StageKey = "preparatory";
        if (stageRaw.includes("ابتدائ") || gradeRaw.includes("ابتدائ")) {
          stageCode = "primary";
        } else if (stageRaw.includes("متوسط") || gradeRaw.includes("متوسط")) {
          stageCode = "intermediate";
        }

        const matchedGrade =
          STAGE_GRADES[stageCode].find((g) => gradeRaw.includes(g.label)) ||
          STAGE_GRADES[stageCode][0];

        const secClean = sectionRaw.replace("الشعبة", "").replace(/[()]/g, "").trim() || "أ";
        const secCode =
          secClean === "ب"
            ? "b"
            : secClean === "ج"
            ? "c"
            : secClean === "د"
            ? "d"
            : "a";

        return {
          fullName,
          adminId,
          nationalId,
          stageCode,
          gradeCode: matchedGrade.code,
          gradeSection: `${matchedGrade.label} (${secClean})`,
          sectionCode: secCode,
          guardianName,
          guardianPhone,
          birthInfo: `تولد: ${birthRaw} - بغداد`,
        };
      })
      .filter((item): item is ParsedExcelRow => item !== null);

    const ignored = allHeaders.filter((h) => !matchedSourceHeaders.has(h));
    setExcelFileName(fileNameLabel);
    setDetectedColumns(Array.from(matchedSourceHeaders));
    setIgnoredExtraColumns(ignored);
    setExtractedRows(parsed);
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        { defval: "" }
      );
      processRawSheetObjects(jsonData, file.name);
    };
    reader.readAsBinaryString(file);
  };

  const handleLoadSampleExcelWithExtraColumns = () => {
    const sampleRawExcel = [
      {
        "الاسم الرباعي واللقب": "حسين علي عبد الرضا الكاظمي",
        "الرقم الإداري": "ADM-2024-5010",
        "الرقم الوطني": "19145520192",
        "المرحلة الدراسية": "المرحلة الابتدائية",
        الصف: "الأول الابتدائي",
        الشعبة: "أ",
        "ولي الأمر": "علي عبد الرضا (الأب)",
        "رقم الهاتف": "+964 771 888 2211",
        "تاريخ التولد": "2018/02/14",
        "فصيلة الدم (معلومة إضافية)": "O+",
        "هواية الطالب المفضلة": "الرسم والخط العربي",
        "وسيلة النقل الخاصة": "خط مدرسي خاص",
        "ملاحظات غير مطلوبة بالنظام": "يرغب بالجلوس في الرحلة الأولى",
      },
      {
        "الاسم الرباعي واللقب": "عبد الله مازن طارق الجنابي",
        "الرقم الإداري": "ADM-2024-5011",
        "الرقم الوطني": "19118839201",
        "المرحلة الدراسية": "المرحلة المتوسطة",
        الصف: "الثاني المتوسط",
        الشعبة: "ب",
        "ولي الأمر": "مازن طارق (الأب)",
        "رقم الهاتف": "+964 780 554 3311",
        "تاريخ التولد": "2011/06/20",
        "فصيلة الدم (معلومة إضافية)": "A+",
        "هواية الطالب المفضلة": "كرة القدم",
        "وسيلة النقل الخاصة": "سيارة ولي الأمر",
        "ملاحظات غير مطلوبة بالنظام": "مشارك في الكشافة",
      },
      {
        "الاسم الرباعي واللقب": "مقتدى حيدر جواد الموسوي",
        "الرقم الإداري": "ADM-2024-5012",
        "الرقم الوطني": "19084410922",
        "المرحلة الدراسية": "المرحلة الإعدادية",
        الصف: "الخامس العلمي",
        الشعبة: "أ",
        "ولي الأمر": "حيدر جواد (الأب)",
        "رقم الهاتف": "+964 772 990 1144",
        "تاريخ التولد": "2008/09/01",
        "فصيلة الدم (معلومة إضافية)": "B+",
        "هواية الطالب المفضلة": "البرمجة والروبوت",
        "وسيلة النقل الخاصة": "مشياً على الأقدام",
        "ملاحظات غير مطلوبة بالنظام": "متفوق بالرياضيات",
      },
    ];

    processRawSheetObjects(
      sampleRawExcel,
      "قائمة_الطلبة_الجدد_مع_بيانات_إضافية_2025.xlsx"
    );
  };

  const handleConfirmExcelImport = () => {
    if (extractedRows.length === 0) return;

    const baseCount = students.length;
    const newRecords: StudentRecord[] = extractedRows.map((r, i) => {
      const seqNum = baseCount + i + 1;
      const seqStr = seqNum < 10 ? `0${seqNum}` : `${seqNum}`;
      const randomMinistry = Math.floor(4000 + Math.random() * 5900);
      return {
        id: `st-imp-${Date.now()}-${i}`,
        seq: seqStr,
        avatar: students[i % students.length].avatar,
        avatarAlt: "صورة الطالب الرسمية",
        fullName: r.fullName,
        birthInfo: r.birthInfo,
        ministryId: `IQ-2024-${randomMinistry}`,
        adminId: r.adminId,
        nationalId: r.nationalId,
        gradeSection: r.gradeSection,
        stageCode: r.stageCode,
        gradeCode: r.gradeCode,
        sectionCode: r.sectionCode,
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        statusLabel: "مستمر بالدوام",
        statusType: "active",
        registrationDate: "2024/10/15",
      };
    });

    onAddMultipleStudents(newRecords);
    setIsExcelModalOpen(false);
    setExtractedRows([]);
    setExcelFileName("");
    onNotify(
      `تم استيراد ${newRecords.length} طلاب بنجاح واستقطاب الحقول المطلوبة فقط مع تجاهل ${ignoredExtraColumns.length} أعمدة إضافية`
    );
  };

  const handleDownloadExcelTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "الاسم الرباعي واللقب": "أحمد علي حسين الربيعي",
        "الرقم الإداري": "ADM-2024-6001",
        "الرقم الوطني": "19120034567",
        "المرحلة الدراسية": "المرحلة الابتدائية",
        الصف: "السادس الابتدائي",
        الشعبة: "أ",
        "ولي الأمر": "علي حسين (الأب)",
        "رقم الهاتف": "+964 771 111 2233",
        "تاريخ التولد": "2013/04/10",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبة");
    XLSX.writeFile(wb, "قالب_استيراد_الطلبة_القياسي.xlsx");
    onNotify("تم تحميل قالب Excel القياسي لاستيراد الطلبة");
  };

  return (
    <div className="flex flex-col w-full">
      {/* Document Header & Action Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <span>شؤون الطلبة</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_left
            </span>
            <span>السجلات الرسمية والقيود العامة (ابتدائي • متوسط • إعدادي)</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            سجل شؤون الطلبة العام - العام الدراسي 2024-2025
          </h1>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            المديرية العامة لتربية بغداد / الكرخ الأولى • مجمع المتميزين التربوي
          </span>
        </div>
        {/* Official Action Toolbar */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={() => {
              window.print();
              onNotify("تم تجهيز بطاقات الطلبة (A4) للطباعة");
            }}
            className="flex items-center gap-space-xs bg-surface-container-lowest text-primary hover:bg-surface-container shadow-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>طباعة بطاقات الطلبة (A4)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExcelModalOpen(true);
              if (extractedRows.length === 0) {
                handleLoadSampleExcelWithExtraColumns();
              }
            }}
            className="flex items-center gap-space-xs bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed shadow-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              upload_file
            </span>
            <span>استيراد بيانات الطلبة (Excel)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container shadow-md px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              person_add
            </span>
            <span>تسجيل طالب جديد +</span>
          </button>
        </div>
      </div>

      {/* Key Statistics & Capacity Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg mb-space-lg">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              مجموع الطلبة المسجلين
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              {(1240 + students.length).toLocaleString("en-US")}
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                trending_up
              </span>
              ابتدائي • متوسط • إعدادي
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">
              groups
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              الطلبة المستمرون بالدوام
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              1,186
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              نسبة الالتزام: 95.03%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[26px]">
              check_circle
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              طلبات النقل والتسوية
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              42
            </span>
            <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                sync_alt
              </span>
              28 وارد • 14 صادر
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
            <span className="material-symbols-outlined text-[26px]">
              swap_horiz
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              عدد الصفوف والشعب الدراسية
            </span>
            <span className="font-headline-xl text-headline-xl text-primary font-bold tabular-nums">
              15
            </span>
            <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
              <span>متوسط الصف: 31 طالب</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">
              school
            </span>
          </div>
        </div>
      </div>

      {/* Search and Institutional Filter Matrix (With Dynamic Stage -> Grade Cascading) */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-md flex flex-col gap-space-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الطالب، الرقم الإداري، الرقم الوطني، أو الإحصائي..."
              className="w-full h-11 pr-10 pl-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] transition-all"
            />
          </div>
          {/* Stage Selector (Includes Primary, Intermediate, Preparatory) */}
          <div className="md:col-span-2">
            <select
              value={stageFilter}
              onChange={(e) => handleStageFilterChange(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] transition-all cursor-pointer"
            >
              <option value="">كافة المراحل</option>
              <option value="primary">المرحلة الابتدائية</option>
              <option value="intermediate">المرحلة المتوسطة</option>
              <option value="preparatory">المرحلة الإعدادية</option>
            </select>
          </div>
          {/* Dynamic Grade Selector (Changes automatically with selected Stage) */}
          <div className="md:col-span-2">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] transition-all cursor-pointer"
            >
              <option value="">
                {stageFilter
                  ? `صفوف ${STAGE_LABELS[stageFilter]}`
                  : "كافة الصفوف"}
              </option>
              {availableFilterGrades.map((grade) => (
                <option key={grade.code} value={grade.code}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>
          {/* Section Selector */}
          <div className="md:col-span-2">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] transition-all cursor-pointer"
            >
              <option value="">جميع الشُعب</option>
              <option value="a">الشعبة (أ)</option>
              <option value="b">الشعبة (ب)</option>
              <option value="c">الشعبة (ج)</option>
              <option value="d">الشعبة (د)</option>
            </select>
          </div>
          {/* Academic Status Selector */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] transition-all cursor-pointer"
            >
              <option value="">كافة الحالات الدراسية</option>
              <option value="active">مستمر بالدوام</option>
              <option value="transferred">منقول</option>
              <option value="deferred">مؤجل لسنة</option>
              <option value="withdrawn">منسحب</option>
              <option value="dismissed">مفصول</option>
            </select>
          </div>
        </div>

        {/* Active Filters & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-label-sm gap-2">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span>الفلاتر النشطة:</span>
            {stageFilter && (
              <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-primary">
                {STAGE_LABELS[stageFilter]}
                <button
                  type="button"
                  onClick={() => handleStageFilterChange("")}
                  className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                >
                  close
                </button>
              </span>
            )}
            {gradeFilter && (
              <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-primary">
                {ALL_GRADES.find((g) => g.code === gradeFilter)?.label}
                <button
                  type="button"
                  onClick={() => setGradeFilter("")}
                  className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                >
                  close
                </button>
              </span>
            )}
            {sectionFilter && (
              <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-primary">
                الشعبة (
                {sectionFilter === "a"
                  ? "أ"
                  : sectionFilter === "b"
                  ? "ب"
                  : sectionFilter === "c"
                  ? "ج"
                  : "د"}
                )
                <button
                  type="button"
                  onClick={() => setSectionFilter("")}
                  className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                >
                  close
                </button>
              </span>
            )}
            {!stageFilter && !gradeFilter && !sectionFilter && (
              <span className="text-outline">عرض شامل لجميع المراحل والصفوف</span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-secondary hover:underline mr-space-xs cursor-pointer"
            >
              إعادة ضبط الكل
            </button>
          </div>
          <div className="flex items-center gap-space-md">
            <span>
              تم فرز:{" "}
              <strong className="text-primary font-bold tabular-nums">
                {filteredStudents.length}
              </strong>{" "}
              طالباً معروضاً
            </span>
            <span className="text-outline">|</span>
            <button
              type="button"
              onClick={handleExportCSV}
              title="تصدير إلى ملف CSV"
              className="flex items-center gap-1 text-primary hover:text-secondary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                file_download
              </span>
              <span>تصدير القائمة المعروضة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Ministry Student Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-primary font-table-header text-table-header h-12">
                <th className="px-space-md py-space-sm w-12 text-center">ت</th>
                <th className="px-space-sm py-space-sm w-16 text-center">
                  الصورة
                </th>
                <th className="px-space-md py-space-sm min-w-[220px]">
                  الاسم الرباعي واللقب
                </th>
                <th className="px-space-md py-space-sm min-w-[170px]">
                  الرقم الإحصائي والإداري والوطني
                </th>
                <th className="px-space-md py-space-sm min-w-[150px]">
                  المرحلة والصف والشعبة
                </th>
                <th className="px-space-md py-space-sm min-w-[200px]">
                  ولي الأمر ومعلومات الاتصال
                </th>
                <th className="px-space-md py-space-sm min-w-[120px] text-center">
                  الحالة الدراسية
                </th>
                <th className="px-space-md py-space-sm min-w-[120px]">
                  تاريخ القيد
                </th>
                <th className="px-space-md py-space-sm min-w-[180px] text-center">
                  الإجراءات المعتمدة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/40 font-table-data text-table-data">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[48px] text-outline">
                        person_search
                      </span>
                      <span className="font-bold text-base text-primary">
                        لا يوجد طلبة مسجلين حالياً في السجل
                      </span>
                      <span className="text-xs text-on-surface-variant max-w-md">
                        يمكنك البدء بإضافة طالب جديد بالنقر على زر «تسجيل طالب جديد» أو استيراد ملف Excel.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-surface-container-low transition-colors group"
                >
                  <td className="px-space-md py-space-sm text-center text-on-surface-variant font-bold tabular-nums">
                    {student.seq}
                  </td>
                  <td className="px-space-sm py-space-sm text-center">
                    <img
                      src={student.avatar}
                      alt={student.avatarAlt}
                      referrerPolicy="no-referrer"
                      className={`w-10 h-10 rounded-full object-cover mx-auto shadow-sm ${
                        student.statusType === "transferred" ? "grayscale" : ""
                      }`}
                    />
                  </td>
                  <td className="px-space-md py-space-sm">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-primary font-bold">
                        {student.fullName}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {student.birthInfo}
                      </span>
                    </div>
                  </td>
                  <td className="px-space-md py-space-sm font-mono text-on-surface tabular-nums">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-primary font-bold">
                        {student.ministryId}
                      </span>
                      <span className="text-[11px] font-bold text-secondary">
                        الإداري: {student.adminId}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        الوطني: {student.nationalId}
                      </span>
                    </div>
                  </td>
                  <td className="px-space-md py-space-sm">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center gap-1 font-label-sm text-label-sm bg-surface-container px-space-sm py-0.5 rounded ${
                          student.statusType === "active"
                            ? "text-primary"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {student.gradeSection}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {STAGE_LABELS[student.stageCode]}
                      </span>
                    </div>
                  </td>
                  <td className="px-space-md py-space-sm">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium">
                        {student.guardianName}
                      </span>
                      <span
                        className="text-on-surface-variant font-mono text-body-sm tabular-nums"
                        dir="ltr"
                      >
                        {student.guardianPhone}
                      </span>
                    </div>
                  </td>
                  <td className="px-space-md py-space-sm text-center">
                    {student.statusType === "active" && (
                      <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded text-[12px] font-bold bg-[#E8F5E9] text-[#1B5E20]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]"></span>
                        {student.statusLabel}
                      </span>
                    )}
                    {student.statusType === "transferred" && (
                      <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded text-[12px] font-bold bg-[#E1F5FE] text-[#0277BD]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0277BD]"></span>
                        {student.statusLabel}
                      </span>
                    )}
                    {student.statusType === "deferred" && (
                      <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded text-[12px] font-bold bg-[#FFF3E0] text-[#B25000]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B25000]"></span>
                        {student.statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-space-md py-space-sm text-on-surface-variant font-mono tabular-nums">
                    {student.registrationDate}
                  </td>
                  <td className="px-space-md py-space-sm">
                    <div className="flex items-center justify-center gap-space-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedDossier(student)}
                        title="عرض الإضبارة والبطاقة المدرسية"
                        className="p-1 rounded text-primary hover:bg-surface-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          badge
                        </span>
                      </button>

                      {student.statusType === "transferred" ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onNotify(
                                `تم عرض كتاب الانفكاك والتأييد الرسمي للطالب ${student.fullName}`
                              )
                            }
                            title="كتاب الانفكاك والتأييد"
                            className="p-1 rounded text-primary hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              description
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onNotify(
                                `تم حفظ إضبارة الطالب ${student.fullName} في الأرشيف المركزي`
                              )
                            }
                            title="الأرشيف"
                            className="p-1 rounded text-outline hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              archive
                            </span>
                          </button>
                        </>
                      ) : student.statusType === "deferred" ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onNotify(
                                `تم فتح التقرير الطبي المصدق من اللجان الطبية للطالب ${student.fullName}`
                              )
                            }
                            title="التقرير الطبي والوزاري"
                            className="p-1 rounded text-tertiary hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              medical_services
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDossier(student)}
                            title="تعديل السجل"
                            className="p-1 rounded text-secondary hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit_note
                            </span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedDossier(student)}
                            title="تعديل السجل"
                            className="p-1 rounded text-secondary hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit_note
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStudentStatus(
                                student.id,
                                "transferred",
                                "منقول (قيد التدقيق)"
                              );
                              onNotify(
                                `تم فتح معاملة نقل إلكترونية للطالب ${student.fullName}`
                              );
                            }}
                            title="إجراءات النقل"
                            className="p-1 rounded text-tertiary hover:bg-surface-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              swap_horiz
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onNotify(
                                `تم إرسال إشعار رسائل (SMS) لولي أمر الطالب (${student.guardianName}) على الرقم ${student.guardianPhone}`
                              )
                            }
                            title="إرسال إشعار غياب لولي الأمر"
                            className="p-1 rounded text-error hover:bg-error-container transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              sms_failed
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Official Registry Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-space-md py-space-sm bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm gap-space-sm">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span>عرض السجلات:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="bg-surface-container-lowest px-2 py-1 rounded outline-none font-bold text-primary cursor-pointer"
            >
              <option>10 طلاب في الصفحة</option>
              <option>25 طالباً في الصفحة</option>
              <option>50 طالباً في الصفحة</option>
            </select>
            <span>
              (عرض 1 إلى {filteredStudents.length} من أصل{" "}
              {(1240 + students.length).toLocaleString("en-US")} طالباً في السجل
              المركزي)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container text-on-surface disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer ${
                  currentPage === p
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"
                }`}
              >
                {p}
              </button>
            ))}
            <span className="px-1 text-outline">...</span>
            <button
              type="button"
              onClick={() => setCurrentPage(125)}
              className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer ${
                currentPage === 125
                  ? "bg-primary text-on-primary font-bold"
                  : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"
              }`}
            >
              125
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(125, p + 1))}
              className="w-8 h-8 rounded flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Ministry Student Dossier Modal / New Student Dialog */}
      {isNewModalOpen && (
        <div
          id="student-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/40 backdrop-blur-xs"
        >
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  person_add
                </span>
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    تسجيل قيد طالب جديد في المنظومة
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    وفق الضوابط المركزية لوزارة التربية العراقية 2024-2025
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">
                  close
                </span>
              </button>
            </div>

            {/* Modal Body (Official Form) */}
            <div className="p-space-lg overflow-y-auto flex flex-col gap-space-md">
              {/* Personal Information Section (Now includes الرقم الإداري) */}
              <div>
                <span className="font-label-md text-label-md text-primary font-bold block mb-space-sm">
                  1. البيانات الشخصية الأساسية والرقم الإداري
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-sm">
                  <div className="md:col-span-1">
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      الاسم الرباعي واللقب <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="مثال: علي حيدر كاظم"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448]"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      الرقم الإداري (سجل القيد){" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      placeholder="مثال: ADM-2024-1095"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-mono font-bold text-primary outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448]"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      الرقم الوطني الموحد <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                      placeholder="12 رقم من البطاقة الوطنية"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448]"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      تاريخ ومحل الولادة <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448]"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Assignment (With Dynamic Stage -> Grade Cascading) */}
              <div>
                <span className="font-label-md text-label-md text-primary font-bold block mb-space-sm">
                  2. التسكين الأكاديمي والصف (يتغير الصف تلقائياً مع المرحلة)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      المرحلة الدراسية <span className="text-error">*</span>
                    </label>
                    <select
                      value={newStage}
                      onChange={(e) =>
                        handleModalStageChange(e.target.value as StageKey)
                      }
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] cursor-pointer"
                    >
                      <option value="primary">المرحلة الابتدائية</option>
                      <option value="intermediate">المرحلة المتوسطة</option>
                      <option value="preparatory">المرحلة الإعدادية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      الصف ({STAGE_LABELS[newStage]}){" "}
                      <span className="text-error">*</span>
                    </label>
                    <select
                      value={newGradeCode}
                      onChange={(e) => setNewGradeCode(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] cursor-pointer"
                    >
                      {availableModalGrades.map((grade) => (
                        <option key={grade.code} value={grade.code}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      الشعبة المقترحة <span className="text-error">*</span>
                    </label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none focus:bg-surface-bright focus:shadow-[0_0_0_2px_#032448] cursor-pointer"
                    >
                      <option>الشعبة (أ)</option>
                      <option>الشعبة (ب)</option>
                      <option>الشعبة (ج)</option>
                      <option>الشعبة (د)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <span className="font-label-md text-label-md text-primary font-bold block mb-space-sm">
                  3. بيانات ولي الأمر والسكن
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-xs">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      اسم ولي الأمر وصلة القرابة{" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      placeholder="الاسم الثلاثي لولي الأمر"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                      رقم الهاتف الفعال (لإشعارات الغياب والرسائل){" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={newGuardianPhone}
                      onChange={(e) => setNewGuardianPhone(e.target.value)}
                      placeholder="07XXXXXXXXX"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-right outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                    عنوان السكن الدائم (محلة، زقاق، دار)
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="بغداد، الكرخ، المنصور، محلة 609، زقاق 14"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md outline-none"
                  />
                </div>
              </div>

              {/* Official Status & Documents */}
              <div>
                <span className="font-label-md text-label-md text-primary font-bold block mb-space-sm">
                  4. الوثائق المدرسية المرفقة
                </span>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-xs text-label-sm text-on-surface">
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docIdCard}
                      onChange={(e) => setDocIdCard(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span>
                      شهادة الجنسية / البطاقة الموحدة الأصلية مع الاستنساخ
                    </span>
                  </label>
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docSchoolCard}
                      onChange={(e) => setDocSchoolCard(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span>
                      البطاقة المدرسية الأصلية وتأييد الدرجات من المدرسة السابقة
                    </span>
                  </label>
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docMedical}
                      onChange={(e) => setDocMedical(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    <span>
                      الفحص الطبي المدرسي الصادر من المركز الصحي المعتمد
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                الرقم الإحصائي سيتم توليده تلقائياً مع تثبيت الرقم الإداري
              </span>
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-space-md py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container transition-all font-label-md text-label-md cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCreateStudent}
                  className="flex items-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md shadow transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                  <span>اعتماد وحفظ السجل</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Excel Import Modal (Extracts ONLY required system fields and ignores unknown columns) */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[26px]">
                  upload_file
                </span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    استيراد الطلاب من جدول إكسل (الاستقطاب الذكي للحقول المطلوبة)
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    يقوم النظام تلقائياً باستقطاب المعلومات المطلوبة فقط وتجاهل أي أعمدة أو معلومات إضافية غير معرفة في الجدول
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-space-lg overflow-y-auto space-y-4">
              {/* Upload Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm bg-surface-container-low p-space-md rounded-xl border border-dashed border-primary/40">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[32px]">
                    table_view
                  </span>
                  <div>
                    <div className="font-label-md text-label-md text-primary font-bold">
                      اختر ملف Excel (.xlsx, .xls, .csv) من جهازك
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      الحقول المطلوبة: {REQUIRED_SYSTEM_FIELDS.join(" • ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-bold cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      folder_open
                    </span>
                    <span>رفع ملف Excel من الجهاز</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleExcelWithExtraColumns}
                    className="px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-label-sm text-label-sm font-bold cursor-pointer"
                  >
                    تجربة جدول يحتوي معلومات إضافية
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-3 py-2 bg-surface-container-high text-primary rounded-lg font-label-sm text-label-sm cursor-pointer"
                  >
                    تنزيل القالب القياسي
                  </button>
                </div>
              </div>

              {/* Column Filtering Report */}
              {excelFileName && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A5D6A7]">
                    <div className="flex items-center gap-1.5 text-[#1B5E20] font-label-sm text-label-sm font-bold mb-1">
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      <span>
                        الحقول المطلوبة التي تم استقطابها ({detectedColumns.length}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {detectedColumns.map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 bg-white/90 text-[#1B5E20] rounded text-xs font-semibold"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FFF3E0] border border-[#FFCC80]">
                    <div className="flex items-center gap-1.5 text-[#B25000] font-label-sm text-label-sm font-bold mb-1">
                      <span className="material-symbols-outlined text-[18px]">
                        filter_alt_off
                      </span>
                      <span>
                        معلومات إضافية بالجدول تم استبعادها تلقائياً (
                        {ignoredExtraColumns.length}):
                      </span>
                    </div>
                    {ignoredExtraColumns.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ignoredExtraColumns.map((col) => (
                          <span
                            key={col}
                            className="px-2 py-0.5 bg-white/90 text-[#B25000] rounded text-xs line-through"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#B25000]">
                        لا توجد أعمدة زائدة في هذا الملف
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table of Extracted Students */}
              {extractedRows.length > 0 && (
                <div className="border border-surface-container-high rounded-xl overflow-hidden">
                  <div className="bg-surface-container-low px-space-md py-2 flex items-center justify-between text-label-sm font-bold text-primary">
                    <span>
                      معاينة البيانات الصافية المستقطبة من الملف ({excelFileName})
                    </span>
                    <span>عدد الطلاب الجاهزين للإضافة: {extractedRows.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container text-primary font-bold h-9">
                          <th className="px-3">الاسم الرباعي واللقب</th>
                          <th className="px-3">الرقم الإداري</th>
                          <th className="px-3">الرقم الوطني</th>
                          <th className="px-3">المرحلة</th>
                          <th className="px-3">الصف والشعبة</th>
                          <th className="px-3">ولي الأمر والهاتف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {extractedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low">
                            <td className="px-3 py-2 font-bold text-primary">
                              {row.fullName}
                            </td>
                            <td className="px-3 py-2 font-mono text-secondary font-bold">
                              {row.adminId}
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {row.nationalId}
                            </td>
                            <td className="px-3 py-2">
                              {STAGE_LABELS[row.stageCode]}
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              {row.gradeSection}
                            </td>
                            <td className="px-3 py-2">
                              {row.guardianName} ({row.guardianPhone})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                يتم تجاهل أي أعمدة خارجية تلقائياً لحماية قاعدة البيانات الوزارية
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={extractedRows.length === 0}
                  onClick={handleConfirmExcelImport}
                  className="px-5 py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    library_add_check
                  </span>
                  <span>
                    اعتماد وإضافة الطلاب المستقطبين ({extractedRows.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Official ID Card / Dossier Modal */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-surface-container px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
                <span className="material-symbols-outlined text-[22px]">
                  badge
                </span>
                <span>الإضبارة والبطاقة المدرسية الإلكترونية</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="p-space-lg space-y-4">
              <div className="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-xl">
                <img
                  src={selectedDossier.avatar}
                  alt={selectedDossier.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {selectedDossier.fullName}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {selectedDossier.birthInfo}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-xs text-primary font-bold">
                      الإحصائي: {selectedDossier.ministryId}
                    </span>
                    <span className="font-mono text-xs text-secondary font-bold">
                      الإداري: {selectedDossier.adminId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-body-sm font-body-sm">
                <div className="p-2.5 bg-surface-container-low rounded-lg">
                  <span className="text-on-surface-variant block">
                    الرقم الوطني الموحد:
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {selectedDossier.nationalId}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg">
                  <span className="text-on-surface-variant block">
                    المرحلة والصف:
                  </span>
                  <span className="font-bold text-primary">
                    {STAGE_LABELS[selectedDossier.stageCode]} -{" "}
                    {selectedDossier.gradeSection}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg">
                  <span className="text-on-surface-variant block">
                    ولي الأمر:
                  </span>
                  <span className="font-bold text-on-surface">
                    {selectedDossier.guardianName}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg">
                  <span className="text-on-surface-variant block">
                    هاتف ولي الأمر:
                  </span>
                  <span
                    className="font-mono font-bold text-on-surface"
                    dir="ltr"
                  >
                    {selectedDossier.guardianPhone}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low px-space-lg py-space-sm flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  onNotify("تم إرسال البطاقة المدرسية للطباعة");
                }}
                className="flex items-center gap-1 text-primary font-label-sm text-label-sm hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>
                <span>طباعة البطاقة المدرسية</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="px-space-md py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm cursor-pointer"
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
