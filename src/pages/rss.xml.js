import rss from "@astrojs/rss";

const entries = Object.entries(
  import.meta.glob("../content/articles/**/*.mdx", { eager: true })
);

const items = entries.map(([path, mod]) => {
  const slug = path
    .replace("../content/articles/", "")
    .replace(/\.mdx$/, "");
  const frontmatter = mod.frontmatter ?? {};

  return {
    title: frontmatter.title ?? slug,
    description: frontmatter.description ?? "",
    pubDate: frontmatter.pubDate ? new Date(frontmatter.pubDate) : new Date(),
    link: `/articles/${slug}`,
  };
});

export const GET = () =>
  rss({
    title: "NeverMind",
    description: "מאמרים ותובנות מעולמות NeverMind",
    site: "https://nevermind.example",
    items,
  });
