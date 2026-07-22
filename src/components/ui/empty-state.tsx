export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-secondary-200 px-6 py-10 text-center dark:border-secondary-800">
      <p className="font-medium text-secondary-700 dark:text-secondary-300">{title}</p>
      <p className="max-w-sm text-sm text-secondary-500">{description}</p>
      {action}
    </div>
  );
}
