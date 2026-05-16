export function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `$${Math.round(n / 1_000)}k`;
  }
  return `$${n}`;
}

export function fmtMoneyDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "-";
  return `${sign}${fmtMoney(Math.abs(n)).replace("$", "$")}`;
}

export function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function fmtMonths(n: number): string {
  return `${n.toFixed(1)} mo`;
}
