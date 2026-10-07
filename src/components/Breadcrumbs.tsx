import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Migas de pan"
      className={`flex items-center text-xs text-slate-500 py-2 overflow-x-auto no-scrollbar font-medium ${className}`}
    >
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex items-center gap-1.5 flex-nowrap shrink-0"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.isCurrent;
          const position = index + 1;

          return (
            <li
              key={index}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="flex items-center gap-1.5 shrink-0"
            >
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-400 shrink-0 select-none"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  itemProp="name"
                  aria-current="page"
                  className="font-bold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-[320px]"
                  title={item.label}
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-slate-700" />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  itemProp="item"
                  className="hover:text-orange-600 transition-colors cursor-pointer flex items-center gap-1 hover:underline underline-offset-2 py-0.5"
                  title={`Ir a ${item.label}`}
                >
                  {index === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
                  <span itemProp="name">{item.label}</span>
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  itemProp="item"
                  className="hover:text-orange-600 transition-colors flex items-center gap-1 hover:underline underline-offset-2 py-0.5"
                  title={`Ir a ${item.label}`}
                >
                  {index === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
                  <span itemProp="name">{item.label}</span>
                </a>
              ) : (
                <span itemProp="name" className="text-slate-600">
                  {item.label}
                </span>
              )}

              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
