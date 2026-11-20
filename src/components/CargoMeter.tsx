import { motion } from 'motion/react';
import { AlertTriangle, Package } from 'lucide-react';

export function CargoMeter({ weight, capacity, value }: { weight: number; capacity: number; value: number }) {
  const over = weight > capacity;
  const units = Math.max(capacity, weight);
  const pct = Math.min(100, (weight / capacity) * 100);
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-parchment/55">Cargo hold</p>
          <p className={`font-display text-2xl font-bold tabular-nums ${over ? 'text-danger' : 'text-parchment'}`}>
            {weight} <span className="text-base text-parchment/50">/ {capacity} units</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-parchment/55">Survival value</p>
          <motion.p key={value} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="font-display text-2xl font-bold tabular-nums text-gold">
            {value}
          </motion.p>
        </div>
      </div>
      <div
        className={`relative h-6 overflow-hidden rounded-full border ${over ? 'border-danger' : 'border-gold/40'} bg-black/40`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={weight}
        aria-label="Cargo weight"
      >
        <motion.div
          className={`absolute inset-y-0 left-0 ${over ? 'bg-gradient-to-r from-[#a33] to-danger' : 'bg-gradient-to-r from-bronze via-gold to-gold-light'}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        />
        <div className="absolute inset-0 flex">
          {Array.from({ length: capacity }, (_, i) => (
            <span key={i} className="h-full flex-1 border-r border-black/35 last:border-r-0" />
          ))}
        </div>
        <span className="absolute inset-0 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white drop-shadow">
          <Package className="h-3.5 w-3.5" aria-hidden /> {Math.round((weight / capacity) * 100)}% loaded
        </span>
      </div>
      {over && (
        <p className="flex items-center gap-2 rounded-lg bg-danger/15 px-3 py-1.5 text-sm font-semibold text-[#ffb4a8]" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden /> Overloaded by {weight - capacity} unit{weight - capacity > 1 ? 's' : ''} — this cargo violates the capacity constraint ({units} &gt; {capacity}).
        </p>
      )}
    </div>
  );
}
