export function cleanOCRText(raw: string): string {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.length < 120)
    .filter((l) => !/(\+?\d{10,})/.test(l))
    .filter((l) => !/(address|phone|www|http|gst|tax)/i.test(l))
    .filter((l) => /[a-zA-Z]{3,}/.test(l))
    .slice(0, 80)
    .join("\n");
}