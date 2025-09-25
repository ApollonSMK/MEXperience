import Link from 'next/link';
import { cn } from '@/lib/utils';
import { KeyRound } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-2xl font-bold font-headline text-foreground',
        className
      )}
    >
      <div className="relative flex items-center justify-center w-12 h-12">
        <div className="absolute w-12 h-12 border-2 border-foreground rounded-full"></div>
        <span className="absolute text-2xl font-headline" style={{left: '19px'}}>M</span>
        <div
          className="absolute rounded-full bg-accent"
          style={{
            width: '12px',
            height: '12px',
            top: '5px',
            left: '28px',
          }}
        >
          <KeyRound className="w-3 h-3 text-background -rotate-90" style={{'color': 'white'}}/>
        </div>
        <span className="absolute text-2xl font-headline" style={{left: '35px'}}>E</span>
      </div>
      <span className="sr-only">M.E</span>
    </Link>
  );
}
