import { db } from "../../db/db";

export type SearchCategory =
  | "sources"
  | "investigations"
  | "claims"
  | "evidences"
  | "timelineEvents"
  | "entities"
  | "relations";

export interface SearchResult {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  title: string;
  details: string;
  date: string;
}

export interface SearchResponse {
  answer: string;
  results: SearchResult[];
  total: number;
}

const categoryLabels: Record<SearchCategory, string> = {
  sources: "مصدر",
  investigations: "تحقيق",
  claims: "ادعاء",
  evidences: "دليل",
  timelineEvents: "حدث زمني",
  entities: "كيان",
  relations: "علاقة",
};

const translations: Record<string, string> = {
  document: "وثيقة",
  article: "مقال",
  website: "موقع إلكتروني",
  interview: "مقابلة",
  other: "أخرى",
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  closed: "مغلق",
  unverified: "غير متحقق",
  supported: "مدعوم",
  disputed: "متنازع عليه",
  supports: "يدعم",
  contradicts: "يناقض",
  neutral: "محايد",
  person: "شخص",
  organization: "منظمة",
  place: "مكان",
};

function translate(value: string): string {
  return translations[value] ?? value;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function wordKey(value: string): string {
  const word = normalize(value);
  return word.startsWith("ال") && word.length > 4 ? word.slice(2) : word;
}

const aliases: Record<SearchCategory, string[]> = {
  sources: ["مصدر", "مصادر"],
  investigations: ["تحقيق", "تحقيقات"],
  claims: ["ادعاء", "ادعاءات", "مزاعم", "زعم"],
  evidences: ["دليل", "ادلة", "شواهد", "شاهد"],
  timelineEvents: ["حدث", "احداث", "واقعة", "وقائع"],
  entities: ["كيان", "كيانات", "اشخاص", "منظمات"],
  relations: ["علاقة", "علاقات", "روابط", "رابط"],
};

const categoryByWord = new Map<string, SearchCategory>();
for (const [category, words] of Object.entries(aliases) as [
  SearchCategory,
  string[],
][]) {
  for (const word of words) categoryByWord.set(wordKey(word), category);
}

const ignoredWords = new Set(
  [
    "ما", "ماذا", "من", "هل", "كم", "عدد", "اجمالي", "احصاء", "احصائيات",
    "هي", "هو", "في", "عن", "على", "الى", "مع", "التي", "الذي", "ماهي",
    "ماهو", "اعرض", "عرض", "اريد", "ابحث", "بحث", "ابحثي", "اظهر",
    "اذكر", "قائمة", "جميع", "كل", "لدي", "الموجودة", "الموجود", "المسجلة",
    "المتعلقة", "المتعلق", "المرتبطة", "المرتبط", "حول", "الخاصة", "خاص",
    "بالتحقيق", "بالمصدر", "للمصدر", "للتحقيق", "و", "او",
  ].map(wordKey),
);

function parts(...values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value?.trim())).join(" · ");
}

function dateValue(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function loadDocuments(): Promise<SearchResult[]> {
  const [
    sources,
    investigations,
    claims,
    evidences,
    events,
    entities,
    relations,
  ] = await Promise.all([
    db.sources.toArray(),
    db.investigations.toArray(),
    db.claims.toArray(),
    db.evidences.toArray(),
    db.timelineEvents.toArray(),
    db.entities.toArray(),
    db.relations.toArray(),
  ]);

  const sourceNames = new Map(sources.map((item) => [item.id, item.title]));
  const investigationNames = new Map(
    investigations.map((item) => [item.id, item.title]),
  );
  const claimTexts = new Map(claims.map((item) => [item.id, item.text]));
  const entityNames = new Map(entities.map((item) => [item.id, item.name]));

  const make = (
    category: SearchCategory,
    id: string,
    title: string,
    details: string,
    date: string,
  ): SearchResult => ({
    id,
    category,
    categoryLabel: categoryLabels[category],
    title,
    details,
    date,
  });

  return [
    ...sources.map((item) =>
      make(
        "sources",
        item.id,
        item.title,
        parts(translate(item.kind), item.description, item.content, item.url),
        item.updatedAt,
      ),
    ),
    ...investigations.map((item) =>
      make(
        "investigations",
        item.id,
        item.title,
        parts(translate(item.status), item.description),
        item.updatedAt,
      ),
    ),
    ...claims.map((item) =>
      make(
        "claims",
        item.id,
        item.text,
        parts(
          translate(item.status),
          investigationNames.get(item.investigationId),
        ),
        item.updatedAt,
      ),
    ),
    ...evidences.map((item) =>
      make(
        "evidences",
        item.id,
        item.title,
        parts(
          translate(item.stance),
          item.description,
          investigationNames.get(item.investigationId),
          item.claimId ? claimTexts.get(item.claimId) : undefined,
          item.sourceId ? sourceNames.get(item.sourceId) : undefined,
        ),
        item.updatedAt,
      ),
    ),
    ...events.map((item) =>
      make(
        "timelineEvents",
        item.id,
        item.title,
        parts(
          item.description,
          item.occurredAt,
          item.investigationId
            ? investigationNames.get(item.investigationId)
            : undefined,
          item.sourceId ? sourceNames.get(item.sourceId) : undefined,
        ),
        item.updatedAt,
      ),
    ),
    ...entities.map((item) =>
      make(
        "entities",
        item.id,
        item.name,
        parts(translate(item.kind), item.description),
        item.updatedAt,
      ),
    ),
    ...relations.map((item) =>
      make(
        "relations",
        item.id,
        parts(
          entityNames.get(item.fromEntityId) ?? "كيان غير متاح",
          item.label,
          entityNames.get(item.toEntityId) ?? "كيان غير متاح",
        ),
        parts(
          item.description,
          item.investigationId
            ? investigationNames.get(item.investigationId)
            : undefined,
          item.sourceId ? sourceNames.get(item.sourceId) : undefined,
        ),
        item.updatedAt,
      ),
    ),
  ];
}

export async function searchLocal(query: string): Promise<SearchResponse> {
  const words = normalize(query).split(" ").filter(Boolean);
  let category: SearchCategory | undefined;
  const terms: string[] = [];

  for (const word of words) {
    const key = wordKey(word);
    const detectedCategory = categoryByWord.get(key);
    if (detectedCategory) {
      category ??= detectedCategory;
    } else if (!ignoredWords.has(key) && key.length > 1) {
      terms.push(key);
    }
  }

  const documents = await loadDocuments();
  const matches = documents
    .map((document) => {
      const title = normalize(document.title);
      const searchable = normalize(
        `${document.title} ${document.details} ${document.categoryLabel}`,
      );
      if (category && document.category !== category) return null;
      if (!terms.every((term) => searchable.includes(term))) return null;

      const score = terms.reduce(
        (total, term) => total + (title.includes(term) ? 2 : 1),
        0,
      );
      return { document, score };
    })
    .filter(
      (match): match is { document: SearchResult; score: number } => match !== null,
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        dateValue(b.document.date) - dateValue(a.document.date),
    );

  const total = matches.length;
  const isCountQuestion = words.some((word) =>
    ["كم", "عدد", "اجمالي", "احصاء", "احصائيات"].includes(wordKey(word)),
  );
  const answer =
    total === 0
      ? "لم أجد نتائج مطابقة في البيانات المحلية. جرّب كلمات أخرى أو عبارة أقصر."
      : isCountQuestion
        ? `عدد السجلات المطابقة هو ${total}.`
        : `وجدت ${total} من السجلات المطابقة في بياناتك المحلية.`;

  return {
    answer,
    total,
    results: matches.slice(0, 12).map((match) => match.document),
  };
}