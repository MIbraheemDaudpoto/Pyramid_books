import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function GlassCard(props: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={cn("pb-glass rounded-4 p-3 p-md-4", props.className)}
      data-testid={props.testId}
    >
      {props.children}
    </div>
  );
}
