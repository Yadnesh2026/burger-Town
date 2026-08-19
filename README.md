# Burger Town — Business Analytics Dashboard

Live URL: _Add your deployment URL here after deployment._

Burger Town Analytics is a Next.js dashboard for high-volume restaurant line-item sales data. It turns the supplied Excel workbook into an interactive view of revenue, orders, outlet performance, product category mix, payment channels, and daily sales.

## Run locally

```bash
npm install
# PowerShell: point the app at the supplied workbook for this session
$env:DATA_FILE = "C:\path\to\data.xlsx"
npm run dev
```

Open `http://localhost:3000`. Without `DATA_FILE` (or `data/transactions.xlsx`), the interface starts with deterministic demo data so it remains explorable.

## Architecture and decisions

**Next.js App Router** is used for a compact, deployable full-stack application. The browser receives only aggregates from `/api/dashboard`; it never downloads the raw workbook.

**Workbook ingestion.** At server startup, `lib/data.ts` reads the first sheet with `xlsx`, normalizes the known fields, and creates a compact in-memory transaction representation. Dates are converted from either Excel serial dates or the documented `DD-MM-YYYY HH:MM` format. Revenue is consistently calculated as `Price × Quantity`.

**Performance.** The parsed data is held in module memory rather than re-reading the workbook on every request. Filter responses are also memoized (50 most recent combinations) and returned with short HTTP cache headers. This gives fast repeat interactions on a ~300K-row workbook while keeping implementation and deployment simple. The trade-off is that a server restart is required if the workbook changes. For a multi-instance or frequently updated production dataset, the next step would be an ETL job loading PostgreSQL with indexes on date/outlet/brand/group/order type, plus a materialized daily aggregate table.

**Order semantics.** Rows are line items, so order count is the number of unique `BillNo` values. Revenue, quantity, and category totals remain line-item sums. Average order value is total revenue divided by unique orders.

## Features

- Date, outlet, brand, category, and order-type filters
- KPI cards: revenue, unique orders, average order value, items sold, and line-item count
- Line chart, category doughnut, outlet bar chart, and payment-channel breakdown
- Responsive layout for desktop and mobile
- Graceful demo-mode fallback when a dataset is unavailable

## Deployment (Vercel)

1. Push this repository to a public GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Add a `DATA_FILE` environment variable that points to a dataset accessible inside the deployed runtime. For a durable deployment, use the PostgreSQL ETL approach described above or place a permitted static dataset in your deployment artifact.
4. Deploy. Vercel detects Next.js automatically.

> Note: local absolute paths such as `C:\Users\...` are not available to cloud platforms. A hosted database/object store is the appropriate production data source for the dataset; this assessment implementation reads the original workbook locally to avoid adding unnecessary infrastructure.

## Project structure

```
app/                  # dashboard UI and API routes
components/dashboard  # client-side filter and chart UI
lib/data.ts           # normalization, aggregation and caching layer
```
