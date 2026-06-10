const RTL_SCRIPT =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function isRtlText(text: string): boolean {
  return RTL_SCRIPT.test(text);
}

export function textDirectionProps(text: string): {
  dir: "rtl" | "ltr";
  className: string;
} {
  if (isRtlText(text)) {
    return { dir: "rtl", className: "text-right" };
  }
  return { dir: "ltr", className: "text-left" };
}
