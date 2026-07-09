import { Link } from 'react-router-dom';
import type { ElementType } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionTo?: string;
  iconClassName?: string;
}

/**
 * Reusable empty state component.
 * Provides a consistent pattern across all data-dependent pages.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionTo,
  iconClassName = '',
}: EmptyStateProps) {
  const actionElement = actionLabel
    ? actionTo
      ? (
          <Link
            to={actionTo}
            className="btn-primary mt-6"
          >
            {actionLabel}
          </Link>
        )
      : actionHref
        ? (
            <a
              href={actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6"
            >
              {actionLabel}
            </a>
          )
        : null
    : null;

  return (
    <div className="empty-state">
      <div className={`empty-state-icon ${iconClassName}`}>
        <Icon size={28} weight="duotone" className="text-ruby-400" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>
      {actionElement}
    </div>
  );
}
