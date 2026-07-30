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

export function parseBlockMindMap(block: {
  id?: string | number;
  title?: string;
  mind_map_nodes?: Array<string | Record<string, unknown>>;
}): MindMapData {
  const blockTitle = block.title || "الموضوع الرئيسي";
  const blockId = block.id ?? "default";

  if (block.mind_map_nodes && block.mind_map_nodes.length > 0) {
    const rawNodes = block.mind_map_nodes;
    const first = rawNodes[0];

    // Check if first element is a MindMapData object with valid nodes
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const candidate = first as Record<string, unknown>;
      if (Array.isArray(candidate.nodes) && (candidate.nodes as unknown[]).length > 0) {
        return candidate as unknown as MindMapData;
      }
    }

    // Check if rawNodes is an array of node objects with id & text & parentId
    if (
      Array.isArray(rawNodes) &&
      typeof first === "object" &&
      first !== null &&
      "id" in first &&
      ("text" in first || "title" in first)
    ) {
      const palette = [
        { bg: "#FEF3C7", text: "#78350F", border: "#F59E0B" },
        { bg: "#E0E7FF", text: "#1E1B4B", border: "#6366F1" },
        { bg: "#DCFCE7", text: "#064E3B", border: "#10B981" },
        { bg: "#F3E8FF", text: "#581C87", border: "#A855F7" },
        { bg: "#FFE4E6", text: "#881337", border: "#F43F5E" },
      ];

      type RawNode = Record<string, unknown>;
      const nodesMap = new Map<string, RawNode>();
      rawNodes.forEach((n) => {
        if (typeof n === "object" && n !== null) {
          const rn = n as RawNode;
          nodesMap.set(String(rn.id), rn);
        }
      });

      const getDepth = (id: string, visited = new Set<string>()): number => {
        if (visited.has(id)) return 0;
        visited.add(id);
        const node = nodesMap.get(id);
        if (!node) return 0;
        const pid = node.parentId;
        if (!pid || pid === "null" || pid === "root") return 0;
        return 1 + getDepth(String(pid), visited);
      };

      const depthGroups: Record<number, RawNode[]> = {};
      rawNodes.forEach((n) => {
        if (typeof n !== "object" || n === null) return;
        const rn = n as RawNode;
        const d = getDepth(String(rn.id));
        if (!depthGroups[d]) depthGroups[d] = [];
        depthGroups[d].push(rn);
      });

      const asNum = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);

      const formattedNodes: MindMapNode[] = rawNodes
        .map((n, i) => {
          if (typeof n !== "object" || n === null) return null;
          const rn = n as RawNode;
          const d = getDepth(String(rn.id));
          const group = depthGroups[d] || [];
          const idxInGroup = group.findIndex((gn) => String(gn.id) === String(rn.id));

          const x = Math.max(60, 720 - d * 280);
          const totalInGroup = group.length;
          const startY = 70;
          const gapY = totalInGroup > 1 ? Math.min(130, Math.max(75, 550 / totalInGroup)) : 130;
          const y = startY + idxInGroup * gapY;

          const color = palette[i % palette.length];

          const textVal =
            (typeof rn.text === "string" && rn.text) ||
            (typeof rn.title === "string" && rn.title) ||
            "عقدة";

          const node: MindMapNode = {
            id: String(rn.id),
            parentId: rn.parentId ? String(rn.parentId) : null,
            text: textVal,
            shape: d === 0 ? "rectangle" : d === 1 ? "rounded-square" : "pill",
            x: asNum(rn.x) ?? x,
            y: asNum(rn.y) ?? y,
            width: (typeof rn.width === "number"
              ? rn.width
              : d === 0
                ? 210
                : d === 1
                  ? 190
                  : 230) as number,
            height: (typeof rn.height === "number" ? rn.height : d === 0 ? 75 : 65) as number,
            backgroundColor: (rn.backgroundColor as string) || color.bg,
            textColor: (rn.textColor as string) || color.text,
            borderColor: (rn.borderColor as string) || color.border,
            lineColor: (rn.lineColor as string) || color.border,
            lineThickness: (rn.lineThickness as number) || (d === 0 ? 5 : 4),
            lineStyle: (typeof rn.lineStyle === "string" ? rn.lineStyle : "solid") as LineStyle,
          };
          return node;
        })
        .filter((n): n is MindMapNode => n !== null);

      return {
        id: `map_${blockId}`,
        title: blockTitle,
        rootId: formattedNodes[0]?.id || `root_${blockId}`,
        nodes: formattedNodes,
      };
    }
  }

  // Extract clean node strings
  const nodeStrings = (block.mind_map_nodes || [])
    .map((n) => {
      if (typeof n === "string") {
        if (n.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(n) as Record<string, unknown>;
            if (
              parsed &&
              ((typeof parsed.text === "string" && parsed.text) ||
                (typeof parsed.title === "string" && parsed.title))
            ) {
              return (parsed.text as string) || (parsed.title as string);
            }
          } catch {}
        }
        return n;
      }
      if (n && typeof n === "object") {
        const obj = n as Record<string, unknown>;
        return (
          (typeof obj.text === "string" && obj.text) ||
          (typeof obj.title === "string" && obj.title) ||
          null
        );
      }
      return String(n);
    })
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0);

  const rootId = `root_${blockId}`;

  if (nodeStrings.length === 0) {
    return createEmptySubjectMindMap(blockTitle);
  }

  const nodes: MindMapNode[] = [
    {
      id: rootId,
      text: blockTitle,
      shape: "rectangle",
      x: 650,
      y: 250,
      width: 210,
      height: 75,
      backgroundColor: "#FEF3C7",
      textColor: "#78350F",
      borderColor: "#F59E0B",
      lineColor: "#F59E0B",
      lineThickness: 5,
      lineStyle: "solid",
    },
  ];

  const colors = [
    { bg: "#E0E7FF", text: "#1E1B4B", border: "#6366F1" },
    { bg: "#DCFCE7", text: "#064E3B", border: "#10B981" },
    { bg: "#F3E8FF", text: "#581C87", border: "#A855F7" },
    { bg: "#FFE4E6", text: "#881337", border: "#F43F5E" },
  ];

  let currentY = 100;
  let lastCatId = rootId;

  nodeStrings.forEach((rawLabel, i) => {
    const isSub =
      rawLabel.trim().startsWith("-") ||
      rawLabel.trim().startsWith("•") ||
      rawLabel.trim().startsWith(">") ||
      rawLabel.includes("👈");

    const cleanLabel = rawLabel.replace(/^[-•>]\s*/, "").trim();
    const nodeId = `node_${i}_${blockId}`;

    let parentId = rootId;
    let x = 380;
    let shape: NodeShape = "rounded-square";

    if (isSub && lastCatId !== rootId) {
      parentId = lastCatId;
      x = 80;
      shape = "pill";
    } else {
      lastCatId = nodeId;
      x = 380;
      shape = "rounded-square";
    }

    const color = colors[i % colors.length];

    nodes.push({
      id: nodeId,
      parentId,
      text: cleanLabel,
      shape,
      x,
      y: currentY,
      width: isSub ? 250 : 210,
      height: 65,
      backgroundColor: color.bg,
      textColor: color.text,
      borderColor: color.border,
      lineColor: color.border,
      lineThickness: 4,
      lineStyle: "solid",
    });

    currentY += isSub ? 90 : 120;
  });

  return {
    id: `map_${blockId}`,
    title: blockTitle,
    rootId,
    nodes,
  };
}

export function getSubjectMindMaps(
  subjectId: string,
  subjectName: string = "المادة",
): MindMapData[] {
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
