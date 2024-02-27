export default async function slugify(input: string) {
  const { slug } = await import("slug");
  return slug(input, { locale: "bg" }).replace(/[^a-zA-Z0-9-_]/g, "");
}
