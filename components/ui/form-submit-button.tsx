"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "type"
> & {
  idleText: string;
  pendingText?: string;
  isPending?: boolean;
};

export function FormSubmitButton({
  idleText,
  pendingText = "Please wait...",
  isPending: isPendingProp,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending: formStatusPending } = useFormStatus();
  const pending = isPendingProp ?? formStatusPending;

  return (
    <Button
      type="submit"
      aria-busy={pending}
      disabled={pending || disabled}
      {...props}
    >
      {pending ? pendingText : idleText}
    </Button>
  );
}
