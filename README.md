# Burger Town Analytics Dashboard

This is a small analytics dashboard built from Burger Town's order data. The file has around 300,000 line-item records, so the main focus was to make the dashboard useful without sending a huge Excel file to the browser.

Live site: https://burger-town-beta.vercel.app/  
GitHub repo: https://github.com/Yadnesh2026/burger-Town

## What it shows

- Total revenue, order count, average order value, items sold, and number of records
- Revenue by day
- Revenue split by menu category
- Best-performing outlets
- Payment/settlement breakdown
- Filters for date, outlet, brand, category, and order type

An order can contain many rows in the source sheet. I use `BillNo` to count unique orders and use `Price × Quantity` for each row's revenue.

## Running it locally

You need Node.js 18.18+ and npm.

```bash
git clone https://github.com/Yadnesh2026/burger-Town.git
cd burger-Town
npm install
npm run dev
```

Then visit http://localhost:3000.

The assessment dataset is already included as `data/transactions.xlsx`. If you want to use another copy of the file, set the path before starting the app:

```powershell
$env:DATA_FILE = "C:\path\to\data.xlsx"
npm run dev
```

To check the production build locally:

```bash
npm run build
npm run start
```

## How I handled the data

I kept this intentionally simple for the assessment. On the server, the app reads the first worksheet with the `xlsx` package, cleans up the values it needs, and keeps the normalised rows in memory. That means the file is read once instead of being opened again for every filter change.

The API routes do the aggregation work. The frontend asks for the small result it needs for the KPI cards and charts; it does not receive the full workbook. There are two routes:

- `/api/filters` returns the values used by the filter controls.
- `/api/dashboard` applies the selected filters and returns the metrics and chart data.

I also cache recent filter combinations in memory. This makes repeat filter requests quick. During local testing, a repeated filtered request took about 27 ms.

Dates in the source file can arrive as Excel date values or as `DD-MM-YYYY HH:MM`, so the loader handles both. The data layer is in `lib/data.ts`.

## Why I did not use a database

For a stable assessment file of this size, a database would add setup work without making the dashboard much better. Reading and caching 300K rows on the server was enough to keep the client light and the filter experience smooth.

The trade-off is that the server needs to restart before it sees a changed workbook, and in-memory data is not shared between separate server instances. If this became a regularly updated, multi-user product, I would add a small ETL process and store the rows in PostgreSQL. I would index date, outlet, brand, category, and order type, then keep a daily revenue aggregate for the charts.

## Assumptions

- Every row is one order line item, not one order.
- `BillNo` is the order identifier.
- Revenue is calculated as `Price × Quantity`.
- Average order value is total revenue divided by unique bills.
- Prices are displayed in INR based on the supplied data.
- The source data is in the first worksheet and uses the supplied column names.

## Deployment

The app is deployed on Vercel from the `main` branch of this repository:

https://burger-town-beta.vercel.app/

The Excel file is committed in the repository so the Vercel deployment uses the actual 300,000-row dataset. A push to `main` starts a new deployment automatically.

## Folder layout

```text
app/                   Pages, styles, and API routes
components/dashboard   Dashboard UI and charts
lib/data.ts            Excel reading, normalisation, caching, and aggregation
data/transactions.xlsx Source workbook
```
