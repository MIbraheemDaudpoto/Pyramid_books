import { ReactNode } from "react";

export default function EmptyState(props: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="rounded-4 p-4 p-md-5 text-center"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
        border: "1px dashed hsl(var(--border) / 1)",
        boxShadow: "var(--shadow-soft)",
      }}
      data-testid={props.testId}
    >
      <div
        className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
        style={{
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--muted)) 100%)",
          border: "1px solid hsl(var(--border) / 1)",
        }}
        aria-hidden="true"
      >
        {props.icon}
      </div>
      <div className="fw-bold" style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
        {props.title}
      </div>
      {props.description && <div className="text-muted mt-2 mx-auto" style={{ maxWidth: 520 }}>{props.description}</div>}
      {props.action && <div className="mt-4 d-flex justify-content-center">{props.action}</div>}
    </div>
  );
}
