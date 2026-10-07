const PALETTE = ["#2F5BEA", "#12A594", "#D9480F", "#7048E8", "#C2255C", "#0B7285", "#E67700", "#5C940D"];

export const colorFor = (id = "") => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export const initials = (name = "?") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export const timeAgo = (date) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(date).toLocaleDateString();
};

export const LANGUAGES = [
  "javascript", "typescript", "python", "java", "cpp", "csharp",
  "go", "rust", "html", "css", "json", "sql",
];

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const bufferToUint8 = (b) => {
  if (!b) return new Uint8Array();
  if (b instanceof Uint8Array) return b;
  if (b instanceof ArrayBuffer) return new Uint8Array(b);
  if (b.data) return new Uint8Array(b.data); // JSON-serialised Node Buffer
  return new Uint8Array(b);
};
