# Watchlist Builder Progress

**Status**: Running in background
**Started**: 2026-04-23 22:35 UTC
**PID**: 79798
**Log**: /tmp/watchlist.log

## Validation Set (Real Wallets Only)

**Total**: 14 wallets - all verified on Polygonscan with real Polymarket activity

- **3 Theo seeds** (publicly reported by NYT/Bloomberg/Chainalysis)
  - 0x1f2dd6d473f3e824cd2f8a89d9c69fb96f6ad0cf (Fredi9999)
  - 0x56687bf447db6ffa42ffe2204a05edaa20f55839 (Theo4)
  - 0x8119010a6e589062aa03583bb3f39ca632d9f887 (PrincessCaro)

- **10 Theo cluster candidates** (surfaced by our exchange-anchor methodology)
  - All share same funder (0x3a3b...), exchange deposit (0xd36e...), and proxy (0x0484...)
  - Verified via on-chain transfer analysis

- **1 control wallet** (legitimate trader baseline)
  - 0x006cc834cc092684f1b56626e23bedb3835c16ea

## Smoke Test Results (--limit 3)

✅ **PASSED** - 3 wallets analyzed successfully

- All required fields present
- All addresses verified on Polygonscan
- Results match expected patterns (all Critical for Theo cluster members)

## Full Batch Status

- **Process ID**: 79798 ✅ Running
- **Currently analyzing**: 0xd235973291b2b75ff4070e9c0b01728c520b0f29 (first candidate)
- **Expected runtime**: ~30-60 minutes for 14 wallets
- **Output**: backend/data/cached_watchlist.json

## Validation Set Narrative

"Our validation set contains 14 wallets: 3 publicly-reported Theo seeds, 10 Theo cluster candidates surfaced by our exchange-anchor methodology, and 1 control case. Each entry is verifiable on Polygonscan."

## Check Progress

```bash
# Check if still running
ps -p 79798

# View recent log
tail -50 /tmp/watchlist.log

# Check results count
python3 -c "import json; print(len(json.load(open('backend/data/cached_watchlist.json'))))"
```
