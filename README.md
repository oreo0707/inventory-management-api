
# Inventory Management API

A self-directed backend development lab built with **Next.js 16, TypeScript, and PostgreSQL** to explore database transactions, concurrency control, inventory consistency, and schema migrations.

The project simulates a simple inventory and ordering system, with a particular focus on preventing overselling during simultaneous purchase requests.

**Version:** v0.4.0 · **Type:** Backend Engineering Lab

## Learning Objectives

This lab focuses on understanding and experimenting with:

- **Database Transactions** — Using commits and rollbacks to maintain consistency across related operations.
- **Concurrency Control** — Applying PostgreSQL row-level locking to prevent race conditions.
- **Atomic Inventory Updates** — Ensuring stock adjustments remain valid under concurrent requests.
- **Database Migrations** — Managing schema changes with a custom TypeScript migration runner.
- **Backend Testing** — Verifying transaction behavior, request validation, and concurrency through practical experiments.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | REST API route handlers |
| TypeScript | Backend development |
| PostgreSQL | Relational database and transaction management |
| node-postgres (`pg`) | Database connectivity and SQL execution |
| tsx | TypeScript migration runner |
| Postman | API testing |
| PowerShell | Concurrent request testing |

## Features

- Product and customer management
- Order creation with automatic inventory deduction
- Stock restocking and adjustment
- Insufficient-stock validation
- Transactional order processing
- Concurrency protection using row-level locking
- Historical product price snapshots
- Versioned database migrations

## System Architecture

```text
             API Client
                 |
                 v
        Next.js API Routes
                 |
                 v
        Request Validation
                 |
                 v
       PostgreSQL Operations
                 |
                 v
          PostgreSQL DB
                 |
      +----------+----------+
      |          |          |
   Products   Customers   Orders
                            |
                         Order Items
```

The API communicates directly with PostgreSQL using parameterized SQL queries.

## Technical Experiments

### 1. Database Transactions

Explored how PostgreSQL transactions maintain consistency when multiple database operations depend on one another.

Order creation combines product validation, inventory deduction, and order insertion within a transaction.

If an operation fails, the transaction is rolled back to avoid partially completed orders.

### 2. Concurrency & Race Conditions

Investigated how simultaneous requests can lead to inventory overselling.

Implemented PostgreSQL row-level locking using:

```sql
SELECT id, price, stock_quantity
FROM products
WHERE id = $1
FOR UPDATE;
```

Combined row-level locking with conditional stock updates to protect inventory during order processing.

**Experiment: Two Concurrent Orders**

Two customers simultaneously attempted to purchase three units of a product with only four units available.

| Measurement | Result |
|---|---|
| Initial stock | 4 units |
| Customer A requested | 3 units |
| Customer B requested | 3 units |
| Successful orders | 1 |
| Rejected orders | 1 |
| Remaining stock | 1 unit |

**Observation:** One order succeeded, while the competing request returned `409 Conflict`. Inventory remained consistent, and no additional order was created for the rejected request.

### 3. Atomic Stock Updates

Explored conditional SQL updates to ensure inventory cannot become negative or exceed the supported integer range.

Tested successful restocking, stock deductions, insufficient-stock rejection, and overflow handling.

### 4. Database Migrations

Implemented a TypeScript-based migration runner supporting:

- Versioned SQL migrations
- Applied migration tracking
- Transactional migration execution
- Rollback on migration failure
- PostgreSQL advisory locking

The migration runner is located at `scripts/migrate.ts`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Retrieve a product |
| PATCH | `/api/products/:id` | Update product price |
| DELETE | `/api/products/:id` | Delete a product |
| PATCH | `/api/products/:id/stock` | Adjust stock |
| GET | `/api/customers` | Retrieve customers |
| POST | `/api/customers` | Create a customer |
| GET | `/api/orders` | Retrieve orders |
| POST | `/api/orders` | Create an order |
| GET | `/api/health/db` | Check database connectivity |

## Testing

Manual testing was performed using Postman, PowerShell, and PostgreSQL SQL Shell.

Experiments included:

- Request validation and HTTP error responses
- Inventory adjustment and insufficient-stock handling
- Transaction rollback verification
- Row-level locking behavior
- Concurrent order submissions
- Migration execution and rollback
- Regression testing

TypeScript validation and a Next.js production build were also completed successfully.

## Running Locally

### Prerequisites

- Node.js compatible with Next.js 16
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/oreo0707/inventory-management-api.git
cd inventory-management-api
npm install
```

### 2. Set up PostgreSQL

Create a database:

```sql
CREATE DATABASE inventory_db;
```

Connect to it:

```sql
\c inventory_db
```

Load the baseline schema:

```sql
\i database/schema.sql
```

Use an absolute path to `schema.sql` if necessary.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and configure:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
```

### 4. Run migrations

Check migration status:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts status
```

Apply pending migrations:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts migrate
```

### 5. Start the API

```bash
npm run dev
```

The API is accessible locally at:

`http://localhost:3000`

Example:

`GET http://localhost:3000/api/products`

## Development Milestones

| Version | Experiment |
|---|---|
| v0.1.0 | In-memory product management |
| v0.2.0 | PostgreSQL persistence |
| v0.3.0 | Relational orders and transactions |
| v0.4.0 | Stock management, concurrency control, and migrations |

## Project Scope

This project was developed as a hands-on backend engineering experiment rather than a production inventory platform.

The focus was on understanding database transactions, race conditions, concurrency protection, and migration management through implementation and testing.

The API runs locally, and its core learning objectives were completed at **v0.4.0**.
