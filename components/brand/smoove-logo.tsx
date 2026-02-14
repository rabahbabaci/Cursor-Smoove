export function SmooveLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="inline-flex items-center gap-2 rounded-full bg-smoove-gradient px-3 py-1 text-white shadow-soft">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          S
        </span>
        <span className="text-sm font-semibold tracking-wide">Smoove</span>
      </div>
    </div>
  );
}
