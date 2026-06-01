# Ledger Function Report

Date: 2026-06-01

## Verdict

The ledger function is working after increasing the Mirisoft fetch timeout.

## What Was Happening

The ledger API was correctly coded to fetch initial dealer and order data from the Mirisoft API, but the request was aborting after 5 seconds. The ledger endpoint depends on these Mirisoft routes for the initial snapshot:

- `dealerpegination`
- `orderpegination`

When the Mirisoft fetch timed out and no usable cache was available, `/api/ledger` returned `500`.

## Changes Made

- Increased ledger fetch timeout from 5 seconds to 30 seconds in `src/lib/ledgerSystem.ts`.
- Added in-flight request reuse in `src/lib/ledgerSystem.ts` so multiple dashboard/ledger calls share the same Mirisoft snapshot fetch.
- Added a dashboard preload call in `src/app/dashboard/layout.tsx` so `/api/ledger` begins warming as soon as the dashboard loads.

## Verification

- `npm.cmd run build` passed successfully.
- Local production server on `http://localhost:3000` returned a successful ledger response.
- Smoke test result:
  - `success`: `true`
  - `total`: `20`
  - `isLive`: `true`
  - `paymentsLive`: `true`
  - first dealer id: `226`
  - first dealer name: `test2`

## Notes

MongoDB is still useful for storing the snapshot cache and payment transactions, but the failed runtime test was caused by the Mirisoft request timing out before data came back. With the longer timeout, the live Mirisoft fetch completed successfully.
