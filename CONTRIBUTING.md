# دليل المساهمة في Nafath

هذا الملف يساعد البشر **و AI agents** (Lovable, Builder.io, Replit Agent,
Cursor, Copilot…) على الالتزام بنفس المعايير، لضمان نظافة السجل وسهولة
مراجعة التغييرات.

---

## 1. إعداد البيئة

```bash
# استخدم bun (المشروع مهيّأ له عبر bunfig.toml)
bun install

# انسخ متغيّرات البيئة
cp .env.example .env.local
# ثم عدّل القيم في .env.local

# التشغيل
bun run dev       # تطوير
bun run build     # إنتاج
bun run lint      # فحص الكود
bun run format    # تنسيق عبر prettier
```

> ⚠️ **لا ترفع `.env.local` أبدًا.** استخدم `.env.example` لتوثيق المتغيّرات الجديدة.

---

## 2. قاعدة رسائل الـ Commit (Conventional Commits)

**الصيغة:** `<النوع>(<النطاق>): <وصف قصير بالعربية أو الإنجليزية>`

### الأنواع

| النوع | متى تستخدمه |
|------|-------------|
| `feat` | ميزة جديدة للمستخدم |
| `fix` | إصلاح خلل |
| `refactor` | إعادة هيكلة دون تغيير سلوك |
| `style` | تنسيق/مسافات/فواصل فقط |
| `docs` | توثيق فقط |
| `chore` | أعمال بنية تحتية (CI, deps, config) |
| `perf` | تحسين أداء |
| `test` | إضافة/تعديل اختبارات |

### النطاقات الشائعة في Nafath

`lesson-flow` · `quiz` · `flashcards` · `mindmap` · `teacher` · `zen-mode` ·
`cheatsheet` · `settings` · `router` · `ui` · `deps`

### أمثلة جيدة ✅

```
feat(quiz): add essay auto-grading via Blink
fix(lesson-flow): prevent stage skip when timer is paused
refactor(mindmap): extract node renderer into separate hook
chore(deps): upgrade tanstack-router to 1.168
docs(readme): document Zen mode behavior
```

### أمثلة سيئة ❌

```
Changes
Work in progress
update
fix bug
```

---

## 3. تعليمات خاصة بـ AI Agents 🤖

عند توليد commits تلقائيًا من **Lovable / Builder.io / Replit Agent**:

1. التزم بصيغة Conventional Commits أعلاه.
2. لا تُضف ملفات سرّية (`.env*`, مفاتيح, tokens).
3. لا تُضف ملفات بناء (`dist/`, `*.log`, `build_log*.txt`).
4. لا تُضف ملفات الـ shell الخاصة بـ Replit (`.bashrc`, `.profile`…).
5. احترم `.editorconfig` و `.prettierrc` (مسافتان, LF, UTF-8).
6. شغّل `bun run lint && bun run format` قبل الـ commit إن أمكن.

---

## 4. سير العمل في Pull Requests

1. أنشئ فرعًا من `main`:
   `git checkout -b feat/quiz-auto-grade`
2. اعمل commits صغيرة ومفهومة.
3. افتح PR بعنوان يتبع نفس صيغة الـ commit.
4. انتظر مراجعة (ذاتية أو من AI agent) قبل الدمج.
5. فضّل **Squash & Merge** لإبقاء `main` نظيفًا.

---

## 5. بنية المجلدات

```
src/
├── routes/          # TanStack Router (file-based)
├── components/      # مكوّنات React قابلة لإعادة الاستخدام
├── hooks/           # custom hooks
├── lib/             # أدوات مساعدة وعميل API
└── router.tsx       # إعداد الراوتر
```

عند إضافة مكوّن جديد: ضعه في `src/components/` بصيغة `PascalCase.tsx`.
