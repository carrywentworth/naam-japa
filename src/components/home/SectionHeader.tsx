import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  trailing?: ReactNode;
  className?: string;
}

function SectionHeader({ icon, title, trailing, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-accent">{icon}</span>}
        <h2 className="text-[15px] font-semibold text-t0 tracking-tight">{title}</h2>
      </div>
      {trailing}
    </div>
  );
}

export default SectionHeader;
