# Ledger Function Documentation

Date: 2026-06-01

This document explains the ledger function used by the Admin and Accountant areas of the Omsons frontend.

## Purpose

The ledger feature gives admin/accountant users a dealer-wise financial view by combining:

- Dealer and order data from the Mirisoft billing API.
- Payment/credit/debit records stored locally in MongoDB.
- A cached ledger snapshot for fallback when the Mirisoft API is slow or unavailable.

## Main Files

- `src/lib/ledgerSystem.ts`
  Shared ledger engine. Fetches Mirisoft data, caches snapshots, classifies orders, calculates order totals, and normalizes dealer/order/payment values.

- `src/app/api/ledger/route.ts`
  Collective dealer ledger endpoint used by admin/accountant dashboards and the admin ledger list.

- `src/app/api/ledger/[dealerId]/route.ts`
  Single dealer ledger summary endpoint.

- `src/app/api/ledger/[dealerId]/transactions/route.ts`
  Paginated transaction history endpoint for a dealer.

- `src/app/api/ledger/[dealerId]/pay/route.ts`
  Payment posting endpoint. Records payment credits in MongoDB.

- `src/app/dashboard/admin/page.tsx`
  Admin dashboard summary uses `/api/ledger`.

- `src/app/dashboard/accountant/page.tsx`
  Accountant dashboard summary uses `/api/ledger`.

- `src/app/dashboard/admin/ledger/page.tsx`
  Admin collective ledger list.

- `src/app/dashboard/admin/dealer/[dealerId]/ledger/page.tsx`
  Admin single dealer ledger screen.

## Data Sources

### Mirisoft API

The initial ledger snapshot comes from:

- `https://mirisoft.co.in/sas/dealerapi/api/dealerpegination`
- `https://mirisoft.co.in/sas/dealerapi/api/orderpegination`

The system fetches up to 10 pages from each endpoint, with 100 records per page.

### MongoDB

MongoDB is used for:

- `ledger_system_cache`
  Stores the latest successful Mirisoft dealer/order snapshot.

- `ledger_transactions`
  Stores local ledger entries such as payments, credits, and debits.

## Snapshot And Cache Flow

`getLedgerSnapshot()` in `src/lib/ledgerSystem.ts` is the main data loader.

Flow:

1. If an in-memory snapshot is fresh, return it.
2. If another request is already fetching the snapshot, reuse that same promise.
3. Fetch dealers and orders from Mirisoft.
4. Write the successful live snapshot to MongoDB cache.
5. If Mirisoft fails:
   - Use the in-memory snapshot if available.
   - Otherwise use the MongoDB cached snapshot.
   - If no fallback exists, return an error.

Current timing:

- Memory cache TTL: 60 seconds.
- Mirisoft fetch timeout: 30 seconds by default.
- Timeout can be overridden with `LEDGER_FETCH_TIMEOUT_MS`.

## Admin Usage

### Admin Dashboard

File: `src/app/dashboard/admin/page.tsx`

The admin dashboard calls:

```txt
GET /api/ledger
```

It uses the returned dealer ledger rows to show summary information such as:

- Number of ledgers.
- Credit exposure area.
- Quick link to open the dealer ledger screen.

### Admin Ledger List

File: `src/app/dashboard/admin/ledger/page.tsx`

This page calls:

```txt
GET /api/ledger
```

It displays all dealer ledger summaries. Each row includes dealer details and calculated balances, then links to:

```txt
/dashboard/admin/dealer/[dealerId]/ledger
```

### Admin Single Dealer Ledger

File: `src/app/dashboard/admin/dealer/[dealerId]/ledger/page.tsx`

This page calls:

```txt
GET /api/ledger/[dealerId]
GET /api/ledger/[dealerId]/transactions?page=1&limit=20
POST /api/ledger/[dealerId]/pay
```

It shows:

- Dealer info.
- Debit, credit, and net balance summary.
- Account book breakdown.
- Paginated transaction history.
- Payment entry modal for recording money received.

The transaction history uses TanStack Query with the page number in the query key and prefetches the next page when available.

## Accountant Usage

### Accountant Dashboard

File: `src/app/dashboard/accountant/page.tsx`

The accountant dashboard calls:

```txt
GET /api/ledger
```

It uses ledger rows to calculate:

- Total outstanding value.
- Pending invoice count.
- Ledger count.

The accountant dashboard links to the ledger screen for deeper review.

## API Reference

### `GET /api/ledger`

Returns dealer-wise ledger summaries.

Response includes:

- `success`
- `data`
- `total`
- `isLive`
- `updatedAt`
- `paymentsLive`

Each `data` item includes:

- Dealer fields such as `Dealer_Id`, `Dealer_Name`, `Dealer_Email`, `Dealer_Number`, `Dealer_City`.
- `totalDebit`
- `totalCredit`
- `netBalance`
- `accountBook`

Balance formula:

```txt
totalDebit = booked order value + local debit transactions
totalCredit = local payment/credit transactions
netBalance = totalDebit - totalCredit
```

### `GET /api/ledger/[dealerId]`

Returns one dealer's ledger summary.

Response includes:

- `dealer`
- `summary`
- `summaryStats`
- `orders`
- `transactionCount`
- `isLive`
- `paymentsLive`
- `updatedAt`

### `GET /api/ledger/[dealerId]/transactions`

Returns paginated transaction history.

Query parameters:

- `page`
  Defaults to `1`.

- `limit`
  Defaults to `20`.
  Minimum is `5`.
  Maximum is `100`.

Response includes:

- `data`
- `count`
- `page`
- `pageSize`
- `totalPages`
- `hasNextPage`
- `hasPreviousPage`
- `isLive`
- `paymentsLive`
- `updatedAt`

Transactions combine:

- Mirisoft order debits.
- MongoDB ledger transaction credits/debits.

Rows are sorted newest first by date.

### `POST /api/ledger/[dealerId]/pay`

Records a payment received from a dealer.

Request body:

```json
{
  "amount": 1000,
  "paymentMode": "Cash",
  "narration": "Payment received",
  "referenceId": "optional-reference"
}
```

Behavior:

- Validates amount.
- Confirms dealer exists through Mirisoft or cached snapshot.
- Inserts a `payment` transaction into `ledger_transactions`.

Stored transaction shape:

```txt
Dealer_Id
type = payment
amount
paymentMode
narration
referenceId
date
createdAt
updatedAt
```

## Order Classification

Orders are classified in `classifyOrder()`.

Statuses:

- `Cancelled`
  `del_status === "1"`

- `Awaiting`
  `accept_order !== "1"`

- `SentAndSettled`
  `mtstatus` is completed or numeric status is `>= 2`

- `SupposedToGo`
  Accepted but not settled.

Cancelled orders are excluded from dealer-specific ledger order totals.

## Dashboard Preload

File: `src/app/dashboard/layout.tsx`

When the dashboard layout loads, it starts a background call to:

```txt
GET /api/ledger
```

This warms the ledger snapshot early so admin/accountant ledger screens can load faster.

## Failure Behavior

If Mirisoft is unavailable:

- The API tries to use in-memory snapshot data.
- If no memory snapshot exists, it tries MongoDB cache.
- If no cached snapshot exists, `/api/ledger` returns an error.

If MongoDB payment lookup fails:

- The ledger can still return Mirisoft order/dealer data.
- `paymentsLive` becomes `false`.
- Local payment totals may be missing from the response.

## Current Verification

The ledger function was verified locally on `http://localhost:3000`.

Observed result:

```txt
GET /api/ledger
success: true
total: 20
isLive: true
paymentsLive: true
```

Paginated transactions were also verified:

```txt
GET /api/ledger/225/transactions?page=1&limit=5
success: true
count: 500
page: 1
pageSize: 5
totalPages: 100
hasNextPage: true
```

