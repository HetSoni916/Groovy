import csv
from pathlib import Path
from collections import defaultdict

LOG_FILE = Path(__file__).parent / "api_log.csv"


def load():
    if not LOG_FILE.exists():
        print("No log file found. Run the chatbot first.")
        return []
    with open(LOG_FILE, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def show():
    rows = load()
    if not rows:
        return

    print(f"{'='*60}")
    print(f"  Token-Tracking Dashboard")
    print(f"  {len(rows)} API calls logged  ({LOG_FILE})")
    print(f"{'='*60}\n")

    # Per-provider
    by_prov = defaultdict(list)
    for r in rows:
        by_prov[r["provider"]].append(r)

    grand_total = {"in": 0, "out": 0, "cost": 0.0}
    print(f"  {'Provider':<10} {'Calls':>5} {'In Tokens':>10} {'Out Tokens':>10} {'Cost':>10} {'Avg Lat':>8}")
    print(f"  {'-'*53}")
    for prov in sorted(by_prov):
        rs = by_prov[prov]
        n = len(rs)
        tin = sum(int(r["input_tokens"]) for r in rs)
        tout = sum(int(r["output_tokens"]) for r in rs)
        cost = sum(float(r["cost"]) for r in rs)
        avg_lat = sum(float(r["latency_s"]) for r in rs) / n
        grand_total["in"] += tin
        grand_total["out"] += tout
        grand_total["cost"] += cost
        print(f"  {prov:<10} {n:>5} {tin:>10} {tout:>10} ${cost:<7.6f} {avg_lat:>5.2f}s")
    print(f"  {'-'*53}")
    print(f"  {'TOTAL':<10} {len(rows):>5} {grand_total['in']:>10} {grand_total['out']:>10} ${grand_total['cost']:<7.6f}")

    print(f"\n  --- Recent Calls ---")
    print(f"  {'#':<3} {'Time':<20} {'Prov':<8} {'In':>4} {'Out':>4} {'Lat':>5} {'Prompt':<30}")
    print(f"  {'-'*80}")
    for i, r in enumerate(rows[-10:], 1):
        print(f"  {i:<3} {r['timestamp']:<20} {r['provider']:<8} {r['input_tokens']:>4} {r['output_tokens']:>4} {r['latency_s']:>5}s {r['prompt_preview']:<30}")

    print(f"\n  --- Commands ---")
    print(f"  dashboard.py          -- this report")
    print(f"  dashboard.py --csv    -- raw CSV")
    print(f"  dashboard.py --reset  -- clear log")


def csv_out():
    rows = load()
    if not rows:
        return
    import sys
    w = csv.DictWriter(sys.stdout, fieldnames=rows[0].keys())
    w.writeheader()
    w.writerows(rows)


def reset():
    if LOG_FILE.exists():
        LOG_FILE.unlink()
        print("Log cleared.")


if __name__ == "__main__":
    import sys
    if "--csv" in sys.argv:
        csv_out()
    elif "--reset" in sys.argv:
        reset()
    else:
        show()
