import type { CollectionEntry } from "astro:content";
import { getPath } from "./getPath";

export const LANG_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  zh: "中文",
};

export type Translation = {
  lang: string;
  label: string;
  path: string;
  isCurrent: boolean;
};

export function getTranslations(
  post: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[]
): Translation[] {
  const { translateKey } = post.data;

  if (!translateKey) return [];

  const order = ["en", "ko", "zh"];

  const translations = allPosts
    .filter(p => p.data.translateKey === translateKey && !p.data.draft)
    .map(p => {
      const lang = p.data.lang ?? "en";
      return {
        lang,
        label: LANG_LABELS[lang] ?? lang,
        path: getPath(p.id, p.filePath),
        isCurrent: p.id === post.id,
      };
    })
    .sort((a, b) => order.indexOf(a.lang) - order.indexOf(b.lang));

  return translations.length > 1 ? translations : [];
}
