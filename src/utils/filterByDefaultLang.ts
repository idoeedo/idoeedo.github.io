import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * For posts sharing the same `translateKey`, keep only the version
 * matching `SITE.lang`. Falls back to the first available translation.
 * Posts without `translateKey` are always included.
 */
const filterByDefaultLang = (posts: CollectionEntry<"blog">[]) => {
  const defaultLang = SITE.lang || "en";

  const preferred = new Map<string, string>();
  for (const post of posts) {
    const key = post.data.translateKey;
    if (!key) continue;

    if (!preferred.has(key) || post.data.lang === defaultLang) {
      preferred.set(key, post.id);
    }
  }

  return posts.filter(post => {
    const key = post.data.translateKey;
    if (!key) return true;
    return preferred.get(key) === post.id;
  });
};

export default filterByDefaultLang;
