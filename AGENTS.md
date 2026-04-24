# 🤖 AGENTS.md — تعليمات موحّدة لجميع الوكلاء

> هذا الملف يُقرأ من قِبَل **كل وكيل AI** يعمل على هذا المشروع.
> جميع النماذج المستخدمة: **Claude Sonnet** — لذا التعليمات موحّدة وتُطبَّق بنفس الطريقة.

---

## ⚠️ قواعد لا تُكسر أبداً

1. **لا تعدّل `main` مباشرة** — دائماً افتح PR من فرعك
2. **لا ترفع ملفات البيئة**: `.env*`, `*.local`, `*.env`
3. **لا ترفع ملفات مؤقّتة**: `build_log*`, `*.log`, `.blink-*`
4. **لا ترفع ملفات نظام**: `.bashrc`, `.bash_logout`, `.profile`
5. **لا تحذف أي ملف موجود** دون PR + تعليق واضح بسبب الحذف
6. **لا تغيّر `package.json` أو `bun.lockb`** إلا إذا طُلب منك صراحةً
7. **لا تُضيف مكتبات جديدة** دون موافقة مسبقة

---

## 📦 مدير الحزم — BUN فقط

```bash
# ✅ صحيح
bun install
bun add <package>
bun remove <package>
bun run dev
bun run build

# ❌ ممنوع
npm install
yarn add
pnpm install
```

> **ملاحظة حرجة:** لا تُنشئ `package-lock.json` أبداً — المشروع يستخدم `bun.lockb` فقط.

---

## 🎨 معايير الكود

### TypeScript
- **TypeScript صارم** — لا `any`، لا `@ts-ignore`، لا `as unknown as X`
- كل prop وكل function يجب أن يكون له type صريح
- استخدم `interface` للـ props، `type` للـ unions

### تسمية الملفات والمكوّنات
| النوع | الأسلوب | مثال |
|-------|---------|------|
| مكوّنات React | PascalCase | `LessonFlow.tsx` |
| ملفات utils | kebab-case | `format-date.ts` |
| hooks | camelCase مع `use` | `useLesson.ts` |
| أنواع/interfaces | PascalCase | `LessonType.ts` |

### Styling
- **Tailwind CSS v4 فقط** — لا inline styles، لا CSS modules
- **لا تُضيف `postcss.config`** — المشروع يستخدم `@tailwindcss/vite` plugin مباشرة
- الثيم الموحّد: ألوان Zen (هادئة، بدون صخب بصري)
- دعم RTL: استخدم `dir="rtl"` والـ classes المناسبة (`text-right`, `ms-*`, `me-*`)

### مكوّنات UI
- استخدم مكوّنات **shadcn/ui + Radix UI** الموجودة أولاً قبل إنشاء جديدة
- الأيقونات من **Lucide React** فقط
- الرسوم البيانية من **Recharts** فقط
- الانيميشن من **Framer Motion** فقط

---

## 📝 رسائل الـ Commits — Conventional Commits

```
<نوع>(<نطاق>): <وصف قصير باللغة العربية أو الإنجليزية>

[جسم اختياري: ماذا تغيّر ولماذا]
```

| النوع | متى تستخدمه |
|-------|-------------|
| `feat` | ميزة جديدة للمستخدم |
| `fix` | إصلاح خطأ |
| `chore` | تغيير في الإعدادات أو البنية |
| `docs` | توثيق فقط |
| `refactor` | إعادة هيكلة بدون تغيير سلوك |
| `style` | تنسيق فقط (لا منطق) |
| `perf` | تحسين أداء |
| `test` | إضافة أو تعديل اختبارات |

### ✅ أمثلة صحيحة
```
feat(quiz): إضافة وضع الاختبار التكيّفي
fix(lesson-flow): إصلاح مشكلة الـ scroll في الموبايل
chore(deps): تحديث Framer Motion إلى 12.7
refactor(flashcards): فصل منطق الـ flip إلى hook مستقل
```

### ❌ أمثلة ممنوعة
```
Changes
Work in progress
fix stuff
updated files
```

---

## 🗂️ مسؤولية كل وكيل (لا تتجاوزها)

### 🎨 UI Agent — Lovable
- ✅ **مسموح:** `src/components/` فقط
- ✅ إضافة مكوّنات بصرية، تحسين layouts، تعديل Tailwind classes
- ❌ **ممنوع:** تعديل `src/hooks/`، `src/lib/`، أي config ملف
- 🌿 **الفرع:** `feat/ui-<اسم-الميزة>`

### 🧠 Logic Agent — Replit
- ✅ **مسموح:** `src/hooks/`، `src/lib/`، `src/routes/` (منطق فقط)
- ✅ State management، data fetching، business logic
- ❌ **ممنوع:** تعديل styles أو layouts أو مكوّنات بصرية
- 🌿 **الفرع:** `feat/logic-<اسم-الميزة>`

### 🧪 QA Agent — Cursor / Windsurf
- ✅ **مسموح:** `src/__tests__/`، إصلاح TypeScript errors، تحسين types
- ✅ كتابة اختبارات Vitest، إصلاح bugs موثّقة في Issues
- ❌ **ممنوع:** إضافة features جديدة
- 🌿 **الفرع:** `fix/<رقم-الـ-issue>`

### 📝 Docs Agent
- ✅ **مسموح:** `*.md` فقط، تحسين JSDoc comments
- ❌ **ممنوع:** تعديل أي `.ts` أو `.tsx`
- 🌿 **الفرع:** `docs/<الموضوع>`

### ⚙️ Config Agent
- ✅ **مسموح:** `vite.config.ts`، `.gitignore`، `tsconfig.json`، ملفات الـ root
- ❌ **ممنوع:** تعديل `src/` بأي شكل
- 🌿 **الفرع:** `chore/<الموضوع>`

---

## 🔧 الإعداد التقني للمشروع

```
Framework:    React 19 + TypeScript
Meta-fw:      TanStack Start 1.167 (SSR)
Router:       TanStack Router (file-based)
Build:        Vite 7
Styling:      Tailwind CSS v4 (via @tailwindcss/vite — لا postcss.config)
UI:           shadcn/ui + Radix UI
Forms:        React Hook Form + Zod
Data:         TanStack React Query 5
Animations:   Framer Motion 12
Icons:        Lucide React
Charts:       Recharts
Packages:     Bun
Deployment:   Replit (autoscale)
```

### هيكل المجلدات
```
src/
├── routes/          # مسارات TanStack Router (file-based)
│   ├── __root.tsx
│   ├── index.tsx    # وضع الطالب
│   └── teacher.tsx  # وضع المعلّم
├── components/      # مكوّنات React (15+)
├── hooks/           # Custom hooks
├── lib/             # Utilities & helpers
└── styles.css       # Global styles (Tailwind entry)
```

---

## 🔄 سير العمل اليومي

```
1. git pull origin main          # ابدأ دائماً بآخر نسخة
2. git checkout -b feat/my-task  # فرع جديد لكل مهمة
3. [نفّذ التغييرات]
4. git add .
5. git commit -m "feat(scope): وصف واضح"
6. git push origin feat/my-task
7. افتح Pull Request على GitHub
```

### ✅ checklist قبل فتح PR
- [ ] التعليمات البرمجية تعمل بدون أخطاء TypeScript
- [ ] لا توجد ملفات `.env` أو build logs في الـ commit
- [ ] رسالة الـ commit تتبع Conventional Commits
- [ ] الـ PR يستهدف `main` فقط
- [ ] الوصف يشرح **ماذا** تغيّر **ولماذا**

---

## 🚫 ملفات لا تلمسها أبداً

```
.env.local          ← أسرار البيئة
bun.lockb           ← lockfile الرسمي
replit.md           ← إعدادات Replit
.replit             ← إعدادات Replit
wrangler.jsonc      ← Cloudflare config
server.mjs          ← SSR entry point
```

---

## 📞 في حال الشك

إذا لم تكن متأكّداً من شيء:
1. **لا تتصرّف** — اترك comment في الـ PR
2. **اسأل** — افتح Issue بعنوان `question: <سؤالك>`
3. **لا تحذف** — إذا اعتقدت أن ملفاً غير ضروري، علّق عليه فقط

---

*آخر تحديث: أبريل 2026 | المشروع: Nafath — منصة التعلّم التكيّفي*
