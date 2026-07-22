export type NodeShape = "rectangle" | "rounded-square" | "circle" | "pill" | "hexagon";
export type LineStyle = "solid" | "dashed" | "dotted";

export interface MindMapNode {
  id: string;
  text: string;
  shape: NodeShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  backgroundColor: string; // Pastel or Custom hex color
  textColor: string;
  borderColor: string;
  lineColor: string;
  lineThickness?: number; // Thickness in px (e.g., 2, 4, 6, 9)
  lineStyle?: LineStyle; // "solid" | "dashed" | "dotted"
  parentId?: string | null;
  parentIds?: string[]; // Multiple parent sources for Summary Nodes!
  isSummaryNode?: boolean; // Indicates if this is a Multi-Parent Summary Node
  isCollapsed?: boolean; // Toggled by clicking connection handles
}

export interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  rootId: string;
}

// Preset Line Colors Palette
export const LINE_COLORS = [
  { color: "#F59E0B", label: "برتقالي دافئ" },
  { color: "#6366F1", label: "أزرق نيلي" },
  { color: "#10B981", label: "أخضر زمردي" },
  { color: "#F43F5E", label: "وردي داكن" },
  { color: "#A855F7", label: "بنفسجي ملفت" },
  { color: "#64748B", label: "رمادي صلب" },
  { color: "#3B82F6", label: "أزرق سماوي" },
];

export const LINE_THICKNESSES = [
  { value: 2, label: "2px رفيع" },
  { value: 4, label: "4px متوسط ⚡" },
  { value: 6, label: "6px سميك" },
  { value: 9, label: "9px سميك جداً 🔥" },
];

// Preset Pastel Colors Palette
export const PASTEL_PALETTES = [
  { bg: "#14B8A6", text: "#FFFFFF", border: "#0D9488", label: "تركواز فيروزي" },
  { bg: "#E11D48", text: "#FFFFFF", border: "#BE123C", label: "وردي داكن (ملخص)" },
  { bg: "#F59E0B", text: "#FFFFFF", border: "#D97706", label: "برتقالي هادئ" },
  { bg: "#0284C7", text: "#FFFFFF", border: "#0369A1", label: "أزرق تدرجي" },
  { bg: "#FEF3C7", text: "#78350F", border: "#F59E0B", label: "أصفر هادئ" },
  { bg: "#E0E7FF", text: "#1E1B4B", border: "#6366F1", label: "أزرق باستيل" },
  { bg: "#DCFCE7", text: "#064E3B", border: "#10B981", label: "أخضر باستيل" },
];

export const SHAPE_LABELS: Record<NodeShape, { label: string; icon: string; usage: string }> = {
  rectangle: { label: "مستطيل", icon: "▭", usage: "العناوين الرئيسية والبيانات" },
  "rounded-square": { label: "مربع منحني", icon: "▢", usage: "الأركان والشروط والأحكام" },
  circle: { label: "دائرة / بيضاوي", icon: "◯", usage: "الاستثناءات والأدلة الشرعية" },
  pill: { label: "كبسولة", icon: "💊", usage: "التعليلات والملاحظات السريعة" },
  hexagon: { label: "شكل سداسي", icon: "⬡", usage: "الخطط وخارطة الطريق" },
};

const MIND_MAP_STORAGE_KEY = "nafath.mind_maps_v3";

export function getStoredMindMaps(): MindMapData[] {
  if (typeof window === "undefined") return [getDefaultKhulMindMap()];
  try {
    const raw = localStorage.getItem(MIND_MAP_STORAGE_KEY);
    if (!raw) {
      const initial = [getDefaultKhulMindMap()];
      saveMindMaps(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const initial = [getDefaultKhulMindMap()];
    saveMindMaps(initial);
    return initial;
  } catch {
    return [getDefaultKhulMindMap()];
  }
}

export function saveMindMaps(maps: MindMapData[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIND_MAP_STORAGE_KEY, JSON.stringify(maps));
}

export function createEmptySubjectMindMap(subjectName: string): MindMapData {
  const rootId = `root_sub_${Date.now()}`;
  return {
    id: `map_sub_${Date.now()}`,
    title: `خريطة ذهنية لمادة ${subjectName} 🎨`,
    rootId,
    nodes: [
      {
        id: rootId,
        text: `مادة ${subjectName} 📌`,
        shape: "rectangle",
        x: 450,
        y: 250,
        width: 240,
        height: 80,
        backgroundColor: "#FEF3C7",
        textColor: "#78350F",
        borderColor: "#F59E0B",
        lineColor: "#F59E0B",
        lineThickness: 5,
        lineStyle: "solid",
      },
    ],
  };
}

export function parseBlockMindMap(block: { id?: string | number; title?: string; mind_map_nodes?: any[] }): MindMapData {
  const blockTitle = block.title || "الموضوع الرئيسي";
  const blockId = block.id ?? "default";

  if (block.mind_map_nodes && block.mind_map_nodes.length > 0) {
    const first = block.mind_map_nodes[0];

    // Check if first element is a MindMapData object with valid nodes
    if (first && typeof first === "object") {
      if (Array.isArray((first as any).nodes) && (first as any).nodes.length > 0) {
        return first as unknown as MindMapData;
      }
    }

    // Check if first element is a JSON string of a MindMapData object
    if (typeof first === "string" && first.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(first);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          return parsed as MindMapData;
        }
      } catch {}
    }
  }

  // Extract clean node strings
  const nodeStrings = (block.mind_map_nodes || [])
    .map((n) => {
      if (typeof n === "string") {
        if (n.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(n);
            if (parsed && (parsed.text || parsed.title)) return parsed.text || parsed.title;
          } catch {}
        }
        return n;
      }
      if (n && typeof n === "object") return (n as any).text || (n as any).title || null;
      return String(n);
    })
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0);

  const rootId = `root_${blockId}`;

  if (nodeStrings.length === 0) {
    return createEmptySubjectMindMap(blockTitle);
  }

  const radius = 220;
  const nodes: MindMapNode[] = [
    {
      id: rootId,
      text: blockTitle,
      shape: "circle",
      x: 420,
      y: 220,
      width: 160,
      height: 160,
      backgroundColor: "#213145",
      textColor: "#ffffff",
      borderColor: "#9d4300",
      lineColor: "#9d4300",
      lineThickness: 4,
      lineStyle: "solid",
    },
  ];

  nodeStrings.forEach((label, i) => {
    const angle = (i / nodeStrings.length) * 2 * Math.PI - Math.PI / 2;
    const x = Math.round(420 + Math.cos(angle) * radius);
    const y = Math.round(220 + Math.sin(angle) * radius);
    nodes.push({
      id: `node_${i}_${blockId}`,
      parentId: rootId,
      text: label,
      shape: "rounded-square",
      x,
      y,
      width: 150,
      height: 64,
      backgroundColor: "#ffffff",
      textColor: "#0b1c30",
      borderColor: "#e0c0b1",
      lineColor: "#9d4300",
      lineThickness: 3,
      lineStyle: "solid",
    });
  });

  return {
    id: `map_${blockId}`,
    title: blockTitle,
    rootId,
    nodes,
  };
}

export function getSubjectMindMaps(subjectId: string, subjectName: string = "المادة"): MindMapData[] {
  if (typeof window === "undefined") return [createEmptySubjectMindMap(subjectName)];
  const key = `nafath.mind_maps_sub_${subjectId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = [createEmptySubjectMindMap(subjectName)];
      saveSubjectMindMaps(subjectId, initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const initial = [createEmptySubjectMindMap(subjectName)];
    saveSubjectMindMaps(subjectId, initial);
    return initial;
  } catch {
    return [createEmptySubjectMindMap(subjectName)];
  }
}

export function saveSubjectMindMaps(subjectId: string, maps: MindMapData[]) {
  if (typeof window === "undefined") return;
  const key = `nafath.mind_maps_sub_${subjectId}`;
  localStorage.setItem(key, JSON.stringify(maps));
}

/**
 * Initial Mind Map with Summary Node (Multi-Parents) & Free Coordinate Layout
 */
export function getDefaultKhulMindMap(): MindMapData {
  return {
    id: "khul_map_default",
    title: "خريطة باب الخُلُع والأحكام الفقهية الشاملة 📜",
    rootId: "root_1",
    nodes: [
      {
        id: "root_1",
        text: "باب الخُلُع في الفقه الإسلامي 📜",
        shape: "rectangle",
        x: 680,
        y: 280,
        width: 220,
        height: 80,
        backgroundColor: "#FEF3C7",
        textColor: "#78350F",
        borderColor: "#F59E0B",
        lineColor: "#F59E0B",
        lineThickness: 5,
        lineStyle: "solid",
        isCollapsed: false,
      },
      {
        id: "node_definition",
        text: "التعريف والشرعية 🏷️",
        shape: "rounded-square",
        x: 380,
        y: 120,
        width: 190,
        height: 70,
        backgroundColor: "#E0E7FF",
        textColor: "#1E1B4B",
        borderColor: "#6366F1",
        lineColor: "#6366F1",
        lineThickness: 4,
        lineStyle: "solid",
        parentId: "root_1",
        isCollapsed: false,
      },
      {
        id: "node_def_text",
        text: "فراق الزوج لزوجته بعوض يرجع له",
        shape: "pill",
        x: 60,
        y: 60,
        width: 220,
        height: 60,
        backgroundColor: "#F3E8FF",
        textColor: "#581C87",
        borderColor: "#A855F7",
        lineColor: "#A855F7",
        lineThickness: 3,
        lineStyle: "solid",
        parentId: "node_definition",
      },
      {
        id: "node_evidence",
        text: "الدليل: ﴿فَلَا جُنَاحَ عَلَيْهِمَا فِيمَا افْتَدَتْ بِهِ﴾",
        shape: "circle",
        x: 60,
        y: 170,
        width: 230,
        height: 70,
        backgroundColor: "#DCFCE7",
        textColor: "#064E3B",
        borderColor: "#10B981",
        lineColor: "#10B981",
        lineThickness: 4,
        lineStyle: "dashed",
        parentId: "node_definition",
      },
      {
        id: "node_pillars",
        text: "أركان الخُلُع الخمسة ⚖️",
        shape: "rounded-square",
        x: 380,
        y: 300,
        width: 190,
        height: 70,
        backgroundColor: "#E0E7FF",
        textColor: "#1E1B4B",
        borderColor: "#6366F1",
        lineColor: "#6366F1",
        lineThickness: 4,
        lineStyle: "solid",
        parentId: "root_1",
        isCollapsed: false,
      },
      {
        id: "node_pillar_husband",
        text: "1. الزوج: صحة طلاقه",
        shape: "pill",
        x: 70,
        y: 270,
        width: 190,
        height: 55,
        backgroundColor: "#F1F5F9",
        textColor: "#0F172A",
        borderColor: "#64748B",
        lineColor: "#64748B",
        lineThickness: 3,
        parentId: "node_pillars",
      },
      {
        id: "node_pillar_iwad",
        text: "2. العِوَض: مال متقوم محدد",
        shape: "circle",
        x: 70,
        y: 360,
        width: 200,
        height: 65,
        backgroundColor: "#FFE4E6",
        textColor: "#881337",
        borderColor: "#F43F5E",
        lineColor: "#F43F5E",
        lineThickness: 5,
        lineStyle: "dashed",
        parentId: "node_pillars",
      },
      {
        id: "node_rulings",
        text: "الآثار الشرعية للخلع 💡",
        shape: "rounded-square",
        x: 380,
        y: 480,
        width: 190,
        height: 70,
        backgroundColor: "#FEF3C7",
        textColor: "#78350F",
        borderColor: "#F59E0B",
        lineColor: "#F59E0B",
        lineThickness: 4,
        lineStyle: "solid",
        parentId: "root_1",
        isCollapsed: false,
      },
      // MULTI-PARENT SUMMARY NODE (عقدة ملخص متجمعة ينصب فيها أكثر من سهم!)
      {
        id: "node_summary_all",
        text: "خلاصة أحكام الخلع: طلاق بائن يلزم بعوض صحيح ومهر المثل عند الجهالة 🔀",
        shape: "hexagon",
        x: -260,
        y: 300,
        width: 260,
        height: 90,
        backgroundColor: "#E11D48",
        textColor: "#FFFFFF",
        borderColor: "#BE123C",
        lineColor: "#E11D48",
        lineThickness: 6,
        lineStyle: "solid",
        isSummaryNode: true,
        parentIds: ["node_def_text", "node_pillar_iwad", "node_rulings"], // 3 Parent Arrows converge into this summary node!
      },
    ],
  };
}
