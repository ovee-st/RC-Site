import { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed bg-bg/70 text-center shadow-none dark:bg-white/5", className)}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15 dark:text-blue-300">
        {icon || <Lightbulb size={22} />}
      </div>
      <h3 className="type-h3 mt-4 font-bold">{title}</h3>
      <p className="type-body mx-auto mt-2 max-w-md">{message}</p>
      {actionLabel ? (
        <div className="mt-5">
          {actionHref ? (
            <LinkButton href={actionHref} className="px-4 py-2">
              {actionLabel}
            </LinkButton>
          ) : (
            <Button type="button" onClick={onAction} className="px-4 py-2">
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
