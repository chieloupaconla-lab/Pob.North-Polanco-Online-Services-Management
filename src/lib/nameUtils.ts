function formatNamePart(part: string) {
  return part
    .split(/([-'])/)
    .map((segment) => {
      if (/^[-']$/.test(segment) || !segment) return segment;
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");
}

export function formatNameForDisplay(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(formatNamePart)
    .join(" ");
}

export function normalizeNameForComparison(value: string) {
  return formatNameForDisplay(value).toLocaleLowerCase();
}
