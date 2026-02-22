export const SITE = {
  website: "https://itsido.com/", // replace this with your deployed domain
  author: "Ido",
  profile: "",
  desc: "Personal blog of a Data & Analytics Engineer, sharing deep dives into data pipelines, analytics strategy, and tech life.",
  title: "It's Ido",
  ogImage: "cover.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showTags: false,
  showArchives: false,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/idoeedo/idoeedo.github.io/edit/main/",
  },
  dynamicOgImage: false,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Seoul", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
