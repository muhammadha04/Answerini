import { isRtlText, textDirectionProps } from "@/lib/textDirection";

type Tag = "span" | "p" | "h2" | "h3";

type Props = {
  text: string;
  className?: string;
  as?: Tag;
  /** Override text alignment; default is start (right for RTL, left for LTR). */
  align?: "start" | "center" | "end";
};

export function RtlText({ text, className = "", as: Tag = "span", align }: Props) {
  const { dir } = textDirectionProps(text);
  const rtl = isRtlText(text);
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "end"
        ? "text-right"
        : align === "start"
          ? rtl
            ? "text-right"
            : "text-left"
          : rtl
            ? "text-right"
            : "text-left";

  return (
    <Tag dir={dir} className={[alignClass, className].filter(Boolean).join(" ")}>
      {text}
    </Tag>
  );
}
