import type { ReactNode } from 'react';

export function Section({
  id,
  children,
  className = '',
  tone = 'paper',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'paper' | 'alt' | 'none';
}) {
  const bg = tone === 'alt' ? 'bg-paper-2' : tone === 'paper' ? 'bg-paper' : '';
  return (
    <section id={id} className={`relative ${bg} ${className}`}>
      {children}
    </section>
  );
}

export function Container({ children, className = '', wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`mx-auto w-full px-5 sm:px-8 ${wide ? 'max-w-[1360px]' : 'max-w-[1180px]'} ${className}`}>{children}</div>;
}
