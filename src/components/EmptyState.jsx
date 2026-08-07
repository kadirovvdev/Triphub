import React from "react";
import { Link } from "react-router-dom";

// Friendly empty state used across lists.
export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      {Icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-muted-foreground">
          <Icon size={26} />
        </span>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}