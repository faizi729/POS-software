import { cn } from "@/lib/utils/cn";

export function Table({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-separate border-spacing-0", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr className={cn("transition-colors duration-200 hover:bg-bg-surface", className)}>
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 border-b border-border-subtle bg-bg-elevated/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.04em] text-text-muted backdrop-blur",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  colSpan
}: {
  className?: string;
  children: React.ReactNode;
  colSpan?: number;
}) {
  return <td colSpan={colSpan} className={cn("border-b border-border-subtle px-4 py-4 text-sm text-text-secondary", className)}>{children}</td>;
}
