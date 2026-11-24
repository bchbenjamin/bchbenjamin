import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & { as?: "div" | "article" | "aside" | "section"; children: ReactNode };

export default function Surface({ as = "div", className = "", children, ...props }: Props) {
  const Tag = as;
  return <Tag {...props} className={className}>{children}</Tag>;
}
