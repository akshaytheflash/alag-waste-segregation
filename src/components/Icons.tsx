export function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={className}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1-1.6h6.6l1 1.6h1.2A2.5 2.5 0 0 1 19 8.5v8A2.5 2.5 0 0 1 16.5 19h-11A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="11" cy="12.5" r="3.4" />
      <path d="M16.5 9.2h.01" />
    </svg>
  );
}

export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={className}>
      <path d="M12 21s6.5-5.4 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={className}>
      <path d="M4 12h15" />
      <path d="M14 7l5 5-5 5" />
    </svg>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function BinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={className}>
      <path d="M5 8h14" />
      <path d="M8 8V5h8v3" />
      <path d="M6.5 8l.8 11.2a1 1 0 0 0 1 .8h7.4a1 1 0 0 0 1-.8L17.5 8" />
      <path d="M10 11.5v5M14 11.5v5" />
    </svg>
  );
}
