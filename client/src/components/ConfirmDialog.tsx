import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  destructive?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  testId?: string;
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid={props.testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          {props.description && <AlertDialogDescription>{props.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${props.testId || "confirm"}-cancel`}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={props.onConfirm}
            className={props.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            data-testid={`${props.testId || "confirm"}-ok`}
          >
            {props.confirmText ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
