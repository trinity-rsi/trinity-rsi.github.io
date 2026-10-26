import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** a segmented switch; the thumb slides to the chosen option */
export default function Seg<T extends string>({
  id,
  value,
  options,
  onChange,
  label,
  full = false,
}: {
  id: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  full?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`relative rounded-full bg-paper-2 p-1 dark:bg-[#0b0f19] ${full ? 'flex' : 'inline-flex'}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative h-9 rounded-full px-4 text-[14px] font-[700] transition-colors ${full ? 'flex-1' : ''} ${on ? 'text-ink' : 'text-ink-3'}`}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-[0_3px_10px_-4px_rgba(10,12,20,0.35)] dark:bg-[#232a3d]"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center justify-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
