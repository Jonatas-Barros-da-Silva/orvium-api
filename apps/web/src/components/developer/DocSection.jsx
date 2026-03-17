
import React from 'react';
import { cn } from '@/lib/utils';

export function DocSection({ id, title, description, children, className }) {
  return (
    <section id={id} className={cn("mb-16 scroll-mt-24", className)}>
      {title && <h2 className="doc-heading-2">{title}</h2>}
      {description && <p className="doc-paragraph">{description}</p>}
      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}
