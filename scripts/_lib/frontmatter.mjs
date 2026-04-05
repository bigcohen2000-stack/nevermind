import yaml from "js-yaml";

export function parseFrontmatter(raw) {
  const source = String(raw ?? "");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return {
      data: {},
      content: source,
      hasFrontmatter: false,
    };
  }

  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  return {
    data: data && typeof data === "object" ? data : {},
    content: source.slice(match[0].length),
    hasFrontmatter: true,
  };
}
