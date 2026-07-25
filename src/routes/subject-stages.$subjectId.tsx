import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { STAGE_LABELS, type Stage, DEFAULT_STAGE_ORDER } from "@/lib/settings";
import { getSubject, updateSubjectStages, updateSubjectDisabledStages, type Subject } from "@/lib/curriculum";

export const Route = createFileRoute("/subject-stages/$subjectId")({
  component: SubjectStagesEditor,
});

function SubjectStagesEditor() {
  const { subjectId } = Route.useParams();
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

  // Load subject data when selection changes
  useEffect(() => {
    const subject = getSubject(subjectId);
    setCurrentSubject(subject || null);
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
    setCurrentSubject(getSubject(subjectId) || null);
  };

  const handleToggleStage = (stage: Stage) => {
    const newDisabled = disabledStages.includes(stage)
      ? disabledStages.filter((s) => s !== stage)
      : [...disabledStages, stage];
    
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
            <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: "/subjects/$subjectId", params: { subjectId } })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">تعديل مراحل المادة</h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                {currentSubject.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            حفظ التغييرات
          </Button>
        </div>

        {/* Level Selector */}
        <div className="mb-6 flex gap-3">
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
        </div>

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
                      <span className="font-black text-slate-900">
                        {STAGE_LABELS[stage]}
                      </span>
                      <span className="text-xs font-bold text-slate-500 mr-2">
                        ({stage})
                      </span>
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
                      onClick={() => handleMoveStage(index, Math.min(currentStages.length - 1, index + 1))}
                      disabled={index === currentStages.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStage(stage)}
                      className={disabledStages.includes(stage) ? "text-green-600" : "text-red-600"}
                    >
                      {disabledStages.includes(stage) ? <Plus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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
                      <span className="font-black text-slate-900">
                        {STAGE_LABELS[stage]}
                      </span>
                      <span className="text-xs font-bold text-slate-500 mr-2">
                        ({stage})
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddStage(stage)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
