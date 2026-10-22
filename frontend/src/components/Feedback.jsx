export function Loading({ label = "Loading..." }) {
  return <p className="muted" role="status">{label}</p>;
}

export function ErrorMessage({ children }) {
  return children ? <p className="alert alert-error" role="alert">{children}</p> : null;
}

export function SuccessMessage({ children }) {
  return children ? <p className="alert alert-success" role="status">{children}</p> : null;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
