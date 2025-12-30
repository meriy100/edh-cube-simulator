import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const SectionCard = ({
  title,
  subtitle,
  actions,
  footerActions,
  children,
  className = "",
}: Props) => {
  return (
    <section
      className={`border border-black/10 dark:border-white/15 rounded p-3 ${className}`.trim()}
    >
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <div className="text-sm opacity-70 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      <div className="flex flex-col gap-2">
        {children}
        {footerActions && <div className="flex justify-end">{footerActions}</div>}
      </div>
    </section>
  );
};

export default SectionCard;
