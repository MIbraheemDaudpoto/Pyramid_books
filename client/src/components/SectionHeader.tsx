import { ReactNode } from "react";

export default function SectionHeader(props: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  badge?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
      <div>
        <div className="d-flex align-items-center gap-2">
          <h1 className="m-0" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.2vw, 2.4rem)" }} data-testid={props.testId}>
            {props.title}
          </h1>
          {props.badge}
        </div>
        {props.subtitle && <div className="text-muted mt-2">{props.subtitle}</div>}
      </div>
      {props.right && <div className="d-flex align-items-center gap-2">{props.right}</div>}
    </div>
  );
}
