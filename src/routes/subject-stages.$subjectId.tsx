import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, GripVertical, MessageSquare } from "lucide-react";
import { STAGE_LABELS, type Stage, DEFAULT_STAGE_ORDER } from "@/lib/settings";
import {
  getSubject,
  updateSubjectStages,
  updateSubjectDisabledStages,
  updateSubjectPrompts,
  type Subject,
} from "@/lib/curriculum";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/subject-stages/$subjectId")({
  component: SubjectStagesEditor,
});

function SubjectStagesEditor() {
  const { subjectId } = Route.useParams();
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [prompts, setPrompts] = useState({
    explanation: "",
    mindmap: "",
    mcq: "",
  });

  // Load subject data when selection changes
  useEffect(() => {
    const subject = getSubject(subjectId);
    setCurrentSubject(subject || null);
    if (subject) {
      setPrompts(
        subject.customPrompts || {
          explanation: `أنت خبير التصميم التعليمي لمنصة "نفاذ - Nafath".
مهمتك تحويل النص أدناه إلى كود JSON للقصص الحوارية والتمهيد، وفق القواعد التالية:

1. اللغة والأسلوب (شرط حازم): اكتب القصة التمهيدية والمواقف الحوارية بالعامية المصرية الميسرة والسهلة (اللهجة المصرية البسيطة والقريبة لقلب الطالب) بدون أي مصطلحات معقدة أو ألفاظ كتابية غريبة، ليكون هدف المستوى الأول هو المتعة والفهم السلس.
2. القصة التمهيدية العامة (master_story): اكتب قصة سينمائية ممتعة بالعامية المصرية للدرس ككل تعطي الطالب المدخل الواقعي المشوق.
3. القصة المصغرة (story): اكتب مواقف حوارية مصغرة بالعامية المصرية لكل فقرة تخدم المفهوم الفقهي.
4. أخرج النتيجة في كود JSON صافي فقط.

الهيكل المطلوب:
{
  "title": "عنوان الدرس الرئيسي",
  "master_story": "القصة التمهيدية العامة بالعامية المصرية للدرس ككل",
  "blocks": [
    {
      "id": 1,
      "title": "عنوان الفقرة",
      "short_sentence": "الفكرة الجوهرية للفقرة",
      "story": "الموقف الحواري المصغر بالعامية المصرية الخاص بهذه الفقرة",
      "full_text": "النص العلمي الكامل والمشروح بدقة"
    }
  ]
}

---
[الصق نص الدرس هنا]`,
          mindmap: `أنت خبير رسم الخرائط الذهنية لمنصة "نفاذ - Nafath".
بناءً على موضوع الدرس أو الفقرات أدناه، قم بتوليد كود JSON لخريطة ذهنية شجرية تفصيلية مخصصة لكل فقرة على حدة (Root -> Categories -> Subtopics -> Details)، وفق الهيكل الآتي:
{
  "mind_maps_by_block": [
    {
      "block_id": 1,
      "block_title": "عنوان الفقرة الأولى",
      "mind_map_nodes": [
        { "id": "b1_root", "text": "العنوان الرئيسي للفقرة الأولى", "parentId": null },
        { "id": "b1_n1", "text": "1. الفرع الرئيسي الأول للفقرة 1", "parentId": "b1_root" },
        { "id": "b1_n1_1", "text": "تفصيل فرعي 1.1", "parentId": "b1_n1" },
        { "id": "b1_n1_2", "text": "تفصيل فرعي 1.2 أو شاهد/دليل", "parentId": "b1_n1" },
        { "id": "b1_n2", "text": "2. الفرع الرئيسي الثاني للفقرة 1", "parentId": "b1_root" },
        { "id": "b1_n2_1", "text": "تفصيل فرعي 2.1", "parentId": "b1_n2" }
      ]
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.

---
[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`,
          mcq: `أنت خبير إعداد أسئلة المستوى الأول لمنصة "نفاذ - Nafath".
بناءً على فقرات الدرس والقصة، صغ كود JSON لأسئلة اختيار من متعدد (MCQ) ميسرة ومباشرة بالعامية المصرية الميسرة والسهلة (5 أسئلة لكل فقرة) تسأل عن أحداث القصة والموقف والمفهوم المباشر بدون تعقيد.

الهيكل المطلوب:
{
  "quizzes_by_block": [
    {
      "block_id": 1,
      "quizzes": {
        "mcqs": [
          {
            "question": "سؤال 1 مباشر بالعامية المصرية مرتبط بموقف القصة؟",
            "options": ["خيار صحيح بالعامية", "خيار خطأ 1", "خيار خطأ 2", "خيار خطأ 3"],
            "answer": "خيار صحيح بالعامية"
          }
        ]
      }
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.

---
[الصق نص الدرس هنا]`,
        },
      );

      // Ensure levelStageOrders and levelDisabledStages exist for old subjects
      if (!subject.levelStageOrders || Object.keys(subject.levelStageOrders).length === 0) {
        updateSubjectStages(subjectId, 1, []);
        updateSubjectStages(subjectId, 2, []);
        updateSubjectStages(subjectId, 3, []);
      }
      if (!subject.levelDisabledStages || Object.keys(subject.levelDisabledStages).length === 0) {
        updateSubjectDisabledStages(subjectId, 1, []);
        updateSubjectDisabledStages(subjectId, 2, []);
        updateSubjectDisabledStages(subjectId, 3, []);
      }

      // Reload subject after updates
      setCurrentSubject(getSubject(subjectId) || null);
    }
  }, [subjectId]);

  if (!currentSubject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">المادة غير موجودة</h1>
          <Button className="mt-4" onClick={() => router.navigate({ to: "/subjects" })}>
            العودة للمواد
          </Button>
        </div>
      </div>
    );
  }

  const currentStages = currentSubject.levelStageOrders[selectedLevel];
  const disabledStages = currentSubject.levelDisabledStages[selectedLevel];
  const availableStages = DEFAULT_STAGE_ORDER.filter((stage) => !currentStages.includes(stage));

  const handleMoveStage = (fromIndex: number, toIndex: number) => {
    const newStages = [...currentStages];
    const [removed] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, removed);

    updateSubjectStages(subjectId, selectedLevel, newStages);
    setCurrentSubject(getSubject(subjectId) || null);
  };

  const handleAddStage = (stage: Stage) => {
    const newStages = [...currentStages, stage];
    updateSubjectStages(subjectId, selectedLevel, newStages);
    setCurrentSubject(getSubject(subjectId) || null);
  };

  const handleRemoveStage = (stage: Stage) => {
    const newStages = currentStages.filter((s) => s !== stage);
    updateSubjectStages(subjectId, selectedLevel, newStages);
    const newDisabled = disabledStages.filter((s) => s !== stage);
    updateSubjectDisabledStages(subjectId, selectedLevel, newDisabled);
    setCurrentSubject(getSubject(subjectId) || null);
  };

  const handleSave = () => {
    alert("تم حفظ التغييرات بنجاح!");
    router.navigate({ to: "/subjects/$subjectId", params: { subjectId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.navigate({ to: "/subjects/$subjectId", params: { subjectId } })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">تعديل مراحل المادة</h1>
              <p className="text-sm font-bold text-slate-600 mt-1">{currentSubject.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            حفظ التغييرات
          </Button>
        </div>

        {/* Level Selector */}
        <div className="mb-6 flex gap-3 items-center">
          {[1, 2, 3].map((level) => (
            <Button
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              onClick={() => setSelectedLevel(level as 1 | 2 | 3)}
              className="text-lg font-bold"
            >
              المستوى {level}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-lg font-bold gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            تعديل Prompts
          </Button>
        </div>

        {showPrompts && (
          <Card className="mb-6 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-900">
                تعديل Prompts المخصصة
              </CardTitle>
              <CardDescription className="text-sm font-bold text-slate-600">
                قم بتعديل prompts الشرح والخريطة الذهنية والأسئلة لهذه المادة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Prompt الشرح</label>
                <Textarea
                  value={prompts.explanation}
                  onChange={(e) => setPrompts({ ...prompts, explanation: e.target.value })}
                  placeholder="اكتب شرحاً مفصلاً وواضحاً للموضوع باللغة العربية"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Prompt الخريطة الذهنية
                </label>
                <Textarea
                  value={prompts.mindmap}
                  onChange={(e) => setPrompts({ ...prompts, mindmap: e.target.value })}
                  placeholder="أنشئ خريطة ذهنية منظمة للموضوع"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Prompt الأسئلة MCQ
                </label>
                <Textarea
                  value={prompts.mcq}
                  onChange={(e) => setPrompts({ ...prompts, mcq: e.target.value })}
                  placeholder="أنشئ أسئلة متعددة الخيارات للموضوع"
                  className="min-h-[80px]"
                />
              </div>
              <Button
                onClick={() => {
                  updateSubjectPrompts(subjectId, prompts);
                  alert("تم حفظ Prompts بنجاح!");
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                حفظ Prompts
              </Button>
            </CardContent>
          </Card>
        )}

        {!showPrompts && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Stages */}
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-slate-900">
                    المراحل النشطة - المستوى {selectedLevel}
                  </CardTitle>
                  <CardDescription className="text-sm font-bold text-slate-600">
                    اسحب لإعادة الترتيب
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentStages.map((stage, index) => (
                    <div
                      key={stage}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        disabledStages.includes(stage)
                          ? "bg-slate-100 border-slate-300 opacity-60"
                          : "bg-white border-blue-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-5 w-5 text-slate-400 cursor-grab" />
                        <div>
                          <span className="font-black text-slate-900">{STAGE_LABELS[stage]}</span>
                          <span className="text-xs font-bold text-slate-500 mr-2">({stage})</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveStage(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleMoveStage(index, Math.min(currentStages.length - 1, index + 1))
                          }
                          disabled={index === currentStages.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStage(stage)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="إرجاع إلى المراحل المتاحة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Available Stages */}
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-slate-900">
                    المراحل المتاحة
                  </CardTitle>
                  <CardDescription className="text-sm font-bold text-slate-600">
                    المراحل غير المستخدمة في هذا المستوى
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableStages.map((stage) => (
                    <div
                      key={stage}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border-2 border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-black text-slate-900">{STAGE_LABELS[stage]}</span>
                          <span className="text-xs font-bold text-slate-500 mr-2">({stage})</span>
                        </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleAddStage(stage)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
