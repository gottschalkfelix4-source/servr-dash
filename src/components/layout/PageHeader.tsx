interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-6">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{title}</h2>
        {description && (
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions || children}</div>
      )}
    </div>
  );
}
