import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function SectionHeading({ eyebrow, title, description, action }: Props) {
  return (
    <div className="section-heading" data-reveal>
      <div>
        <p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}
