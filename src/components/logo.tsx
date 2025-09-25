import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'text-2xl font-bold font-headline text-accent',
        className
      )}
    >
      M.E
    </Link>
  );
}
