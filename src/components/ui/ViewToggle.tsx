import { useState } from 'react';
import { motion } from 'motion/react';
import Icon from './Icon';
import { ComputerIcon, SmartPhone01Icon } from '@hugeicons/core-free-icons';
import { currentSection, switchView, type View } from '@/phone/mode';

const LABEL: Record<View, string> = { phone: 'Phone layout', desktop: 'Desktop layout' };

/**
 * Phone or desktop layout: a two-way switch that both layouts carry. The thumb slides to the
 * chosen side, then the page reloads into that layout at the section being read.
 */
export default function ViewToggle({ current, size = 'md', anchor, className = '' }: { current: View; size?: 'sm' | 'md'; anchor?: () => string; className?: string }) {
  const [view, setView] = useState<View>(current);
  const go = (v: View) => {
    if (v === view) return;
    setView(v);
    switchView(v, anchor ? anchor() : currentSection());
  };
  const seg = size === 'sm' ? 'h-7 w-8' : 'h-8 w-9';
  return (
    <div role="radiogroup" aria-label="Layout" className={`relative inline-flex shrink-0 items-center rounded-full border border-rule bg-surface p-[3px] ${className}`}>
      {(['phone', 'desktop'] as View[]).map((v) => {
        const on = v === view;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={LABEL[v]}
            title={LABEL[v]}
            onClick={() => go(v)}
            className={`relative grid place-items-center rounded-full transition-colors duration-200 ${seg} ${on ? 'text-paper' : 'text-ink-3 hover:text-ink'}`}
          >
            {on && <motion.span layoutId={`view-thumb-${current}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
            <Icon icon={v === 'phone' ? SmartPhone01Icon : ComputerIcon} size={size === 'sm' ? 15 : 16} stroke={1.9} className="relative" />
          </button>
        );
      })}
    </div>
  );
}
