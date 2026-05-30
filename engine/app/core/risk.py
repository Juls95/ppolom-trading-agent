from __future__ import annotations


class CircuitBreaker:
    def __init__(self, max_drawdown_pct: float) -> None:
        self.max_drawdown_pct = max_drawdown_pct
        self.peak_pnl = 0.0
        self.paused = False
        self.reason: str | None = None

    def update(self, total_pnl: float) -> bool:
        if total_pnl > self.peak_pnl:
            self.peak_pnl = total_pnl
        if self.peak_pnl <= 0:
            return False
        dd = (self.peak_pnl - total_pnl) / abs(self.peak_pnl) if self.peak_pnl else 0
        if dd >= self.max_drawdown_pct:
            self.paused = True
            self.reason = f"Drawdown {dd:.1%} >= {self.max_drawdown_pct:.1%}"
            return True
        return False

    def is_paused(self) -> bool:
        return self.paused
