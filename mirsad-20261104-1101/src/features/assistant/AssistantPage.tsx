import { useState, type FormEvent } from "react";
import { Bot, Database, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { create } from "zustand";
import { z } from "zod";
import { searchLocal, type SearchResponse } from "./search";

const querySchema = z
  .string()
  .trim()
  .min(1, "اكتب سؤالاً أو كلمات للبحث.")
  .max(300, "يجب ألا يتجاوز البحث 300 حرف.");

interface AssistantState {
  query: string;
  submittedQuery: string;
  response: SearchResponse | null;
  error: string | null;
  loading: boolean;
  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
}

const useAssistantStore = create<AssistantState>((set, get) => ({
  query: "",
  submittedQuery: "",
  response: null,
  error: null,
  loading: false,
  setQuery: (query) => set({ query }),
  search: async (query) => {
    if (get().loading) return;

    const parsed = querySchema.safeParse(query);
    if (!parsed.success) {
      set({ error: parsed.error.issues[0]?.message ?? "تعذّر قراءة البحث." });
      return;
    }

    set({ loading: true, error: null, response: null, submittedQuery: parsed.data });
    try {
      const response = await searchLocal(parsed.data);
      set({ response });
    } catch {
      set({
        error: "تعذّر قراءة البيانات المحلية. تأكد من إمكانية الوصول إلى قاعدة البيانات ثم حاول مجدداً.",
      });
    } finally {
      set({ loading: false });
    }
  },
}));

const examples = [
  "كم عدد المصادر؟",
  "التحقيقات المفتوحة",
  "الأدلة المرتبطة بالتحقيق",
];

function formatDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(date);
}

export default function AssistantPage() {
  const { query, submittedQuery, response, error, loading, setQuery, search } =
    useAssistantStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpanded({});
    void search(query);
  }

  function runExample(example: string) {
    setQuery(example);
    setExpanded({});
    void search(example);
  }

  return (
    <main dir="rtl" className="min-h-full bg-[#0B1329] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-sm text-[#D4AF37]">
            <Bot className="h-4 w-4" aria-hidden="true" />
            مساعد بحث محلي
          </div>
          <h1 className="text-3xl font-bold tracking-tight">المساعد البحثي</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            ابحث في بيانات مِرْصاد أو اطرح سؤالاً بسيطاً عن عدد السجلات
            ومحتواها. تُطابق النتائج الكلمات الموجودة في بياناتك.
          </p>
        </header>

        <section
          aria-label="البحث المحلي"
          className="rounded-2xl border border-slate-700/70 bg-[#131B36] p-5 shadow-lg sm:p-6"
        >
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <p>تتم معالجة البحث على جهازك فقط، دون إرسال بياناتك إلى أي خدمة خارجية.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="assistant-query" className="mb-2 block text-sm font-medium text-slate-200">
              سؤالك أو كلمات البحث
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="assistant-query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثلاً: كم عدد المصادر؟"
                maxLength={300}
                className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-[#0B1329] px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-[#0B1329] transition hover:bg-[#e5c45b] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#131B36] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-5 w-5" aria-hidden="true" />
                )}
                {loading ? "جارٍ البحث" : "بحث"}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400">جرّب:</span>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                disabled={loading}
                onClick={() => runExample(example)}
                className="rounded-full border border-slate-600 px-3 py-1.5 text-slate-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        <div aria-live="polite" className="mt-6">
          {error && (
            <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#131B36] p-5 text-slate-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#D4AF37]" aria-hidden="true" />
              جارٍ البحث في البيانات المحلية…
            </div>
          )}

          {!loading && response && (
            <section aria-label="نتائج البحث" className="space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#131B36] p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
                  <Bot className="h-5 w-5" aria-hidden="true" />
                  إجابة المساعد
                </div>
                <p className="break-words text-sm text-slate-400">البحث: {submittedQuery}</p>
                <p className="mt-3 leading-7 text-slate-100">{response.answer}</p>
                {response.total > response.results.length && (
                  <p className="mt-2 text-sm text-slate-400">
                    تُعرض أول {response.results.length} نتيجة فقط.
                  </p>
                )}
              </div>

              {response.results.length > 0 && (
                <div className="space-y-3">
                  <h2 className="px-1 text-lg font-semibold">السجلات المطابقة</h2>
                  {response.results.map((result) => {
                    const key = `${result.category}:${result.id}`;
                    const date = formatDate(result.date);
                    const isExpanded = Boolean(expanded[key]);
                    const longDetails = result.details.length > 240;
                    const details =
                      longDetails && !isExpanded
                        ? `${result.details.slice(0, 240)}…`
                        : result.details;

                    return (
                      <article
                        key={key}
                        className="rounded-xl border border-slate-700/70 bg-[#131B36] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                            <Database className="h-3.5 w-3.5" aria-hidden="true" />
                            {result.categoryLabel}
                          </span>
                          {date && <span className="text-xs text-slate-400">آخر تحديث: {date}</span>}
                        </div>
                        <h3 className="mt-3 break-words font-semibold leading-7 text-slate-100">
                          {result.title}
                        </h3>
                        {details && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                            {details}
                          </p>
                        )}
                        {longDetails && (
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpanded((current) => ({ ...current, [key]: !isExpanded }))
                            }
                            className="mt-2 text-sm font-medium text-[#D4AF37] hover:underline"
                          >
                            {isExpanded ? "عرض أقل" : "عرض المزيد"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!loading && !response && !error && (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm leading-7 text-slate-400">
              اكتب سؤالاً أو اختر مثالاً لبدء البحث في المصادر والتحقيقات وبقية السجلات.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}