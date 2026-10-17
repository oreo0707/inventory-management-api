# Inventory Management API

A RESTful backend API built with **Next.js 16, TypeScript, and PostgreSQL** for managing products, customers, orders, and inventory.

This project demonstrates backend development concepts including CRUD operations, relational database design, request validation, parameterized SQL queries, database transactions, row-level locking, concurrency control, and database migrations.

**Current Version:** v0.4.0 (Stock Management)

## Tech Stack

- **Next.js 16** - REST API development using App Router route handlers
- **TypeScript** - Type-safe backend development
- **PostgreSQL** - Relational database and transactional data storage
- **node-postgres (`pg`)** - PostgreSQL connection pooling and parameterized SQL queries
- **tsx** - Execute TypeScript database migration scripts
- **Postman** - Manual API and regression testing

## Features

### Product Management

- Create, retrieve, update, and delete products
- Update product prices
- Track available inventory quantities
- Restock products and deduct inventory
- Prevent inventory quantities from becoming negative
- Validate requests and return appropriate HTTP status codes

### Customer Management

- Create customers
- Retrieve existing customers
- Enforce unique customer email addresses

### Order Management

- Create orders containing one or more products
- Associate orders with existing customers
- Retrieve orders with purchased items and calculated totals
- Preserve historical product prices using unit-price snapshots
- Automatically deduct inventory when an order is created
- Reject orders with insufficient stock
- Use PostgreSQL transactions to prevent partial order creation
- Use row-level locking to protect inventory during concurrent purchases

### Database Management

- PostgreSQL relational schema with primary keys, foreign keys, and constraints
- Versioned SQL migration files
- TypeScript migration runner
- Migration history tracking
- Transactional migration execution
- Advisory locking to prevent concurrent migration execution

## API Endpoints

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve all products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Retrieve a product by ID |
| PATCH | `/api/products/:id` | Update a product's price |
| DELETE | `/api/products/:id` | Delete a product |
| PATCH | `/api/products/:id/stock` | Adjust product inventory |

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | Retrieve all customers |
| POST | `/api/customers` | Create a customer |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Retrieve orders and their items |
| POST | `/api/orders` | Create an order and deduct inventory |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/db` | Check PostgreSQL connectivity |

## Getting Started

### Prerequisites

- Node.js (a version compatible with Next.js 16)
- npm
- PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/oreo0707/inventory-management-api.git
cd inventory-management-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the Database

Connect to PostgreSQL and execute:

```sql
CREATE DATABASE inventory_db;
```

Connect to the new database:

```sql
\c inventory_db
```

Then execute the baseline schema:

```sql
\i database/schema.sql
```

The `\i` command requires a path accessible from the current `psql` working directory. An absolute path can also be used.

# Inventory Management API

A RESTful backend API built with **Next.js 16, TypeScript, and PostgreSQL**, designed to manage products, customers, orders, and inventory while maintaining data consistency during concurrent operations.

This project explores backend engineering concepts beyond basic CRUD, including **database transactions, concurrency control, row-level locking, atomic stock updates, and database migrations**.

**Current Version:** `v0.4.0` | **Status:** Local development project

## Key Features

- **Inventory Management** — Track stock quantities, restock products, and prevent negative inventory.
- **Transactional Order Processing** — Create orders and deduct inventory within a single PostgreSQL transaction.
- **Concurrency Protection** — Prevent overselling when multiple customers purchase the same product simultaneously.
- **Data Integrity** — Enforce database constraints and preserve historical product prices in orders.
- **Database Migrations** — Manage schema changes through versioned SQL migrations and a custom TypeScript migration runner.
- **RESTful API** — Manage products, customers, and orders with validated requests and appropriate HTTP responses.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | REST API development using App Router |
| TypeScript | Type-safe backend development |
| PostgreSQL | Relational database and transaction management |
| node-postgres (`pg`) | Database connection pooling and SQL queries |
| tsx | Running TypeScript migration scripts |
| Postman | API testing and debugging |
| Git & GitHub | Version control and release management |

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
       Backend SQL Operations
                |
                v
        PostgreSQL Database
                |
       +--------+---------+
       |        |         |
    Products  Customers  Orders
                         |
                      Order Items
```

The backend communicates directly with PostgreSQL using parameterized SQL queries through `node-postgres`.

Database transactions and constraints help maintain consistency across related operations.

## Technical Highlights

### 1. Transactional Order Processing

Creating an order involves multiple database operations:

1. Validate the customer and requested products.
2. Start a PostgreSQL transaction.
3. Lock the relevant product records.
4. Verify available inventory.
5. Create the order and its associated items.
6. Deduct the purchased quantities from inventory.
7. Commit the transaction.

If an operation fails, the transaction is rolled back to prevent incomplete orders or inconsistent inventory.

### 2. Concurrency Control & Overselling Prevention

One of the main engineering challenges explored in this project was preventing overselling during simultaneous purchases.

The implementation combines:

- PostgreSQL transactions
- Row-level locking with `SELECT ... FOR UPDATE`
- Conditional inventory updates
- Database constraints
- Transaction rollback

**Concurrency Test**

Two customers simultaneously attempted to purchase three units of a product with only four units available.

| Test Result | Outcome |
|---|---|
| Initial inventory | 4 units |
| Customer A requests | 3 units |
| Customer B requests | 3 units |
| Successful orders | 1 |
| Rejected orders | 1 (`409 Conflict`) |
| Remaining inventory | 1 unit |

**Result:** Only one purchase succeeded. The competing request was rejected without creating an additional order or reducing stock below zero.

This experiment verified the API's ability to maintain inventory consistency under concurrent requests.

### 3. Atomic Inventory Updates

Stock adjustments use conditional SQL updates to ensure inventory quantities remain within valid limits.

The API supports:

- Restocking products
- Deducting inventory
- Rejecting insufficient-stock adjustments
- Preventing integer overflow

Database-level constraints provide an additional layer of protection against invalid stock quantities.

### 4. Database Migration System

Developed a custom migration runner using TypeScript and PostgreSQL.

The system supports:

- Versioned SQL migration files
- Migration history tracking
- Transactional migration execution
- Automatic rollback on failure
- Advisory locking to prevent concurrent migration execution

Migration files are stored in `database/migrations/`, and the runner is implemented in `scripts/migrate.ts`.

## API Endpoints

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve all products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Retrieve a product |
| PATCH | `/api/products/:id` | Update product price |
| DELETE | `/api/products/:id` | Delete a product |
| PATCH | `/api/products/:id/stock` | Adjust inventory |

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | Retrieve customers |
| POST | `/api/customers` | Create a customer |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Retrieve orders and order items |
| POST | `/api/orders` | Create an order and deduct stock |

### Database Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/db` | Check database connectivity |

## Example: Creating an Order

**POST** `/api/orders`

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

When the order is successfully created, the API stores the purchased items, preserves their unit prices, and deducts the corresponding inventory.

If inventory is insufficient, the request returns `409 Conflict`, and no partial order is committed.

## Testing & Verification

The API has been manually tested using **Postman, PowerShell, and PostgreSQL SQL Shell**.

Testing covered:

- API request validation and error handling
- Product, customer, and order operations
- Inventory adjustments and insufficient-stock rejection
- Transaction rollback
- Row-level locking
- Simultaneous HTTP order submissions
- Migration execution and rollback
- Regression testing of existing functionality

Additional verification included TypeScript type checking and a successful Next.js production build.

Automated API and integration tests are planned for a future release.

## Getting Started

### Prerequisites

- Node.js compatible with Next.js 16
- npm
- PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/oreo0707/inventory-management-api.git
cd inventory-management-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the Database

Connect to PostgreSQL and run:

```sql
CREATE DATABASE inventory_db;
```

Connect to the database:

```sql
\c inventory_db
```

Load the baseline schema using `psql`:

```sql
\i database/schema.sql
```

Use an absolute path if the SQL file is not accessible from the current working directory.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
```

Do not commit `.env.local` or real database credentials.

### 5. Check Database Migrations

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts status
```

Apply any pending migrations:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at:

`http://localhost:3000`

For example:

`GET http://localhost:3000/api/products`

## Project Status & Limitations

This is a **locally developed backend learning project**, not a deployed production service.

Current limitations include:

- No authentication or authorization
- No automated integration test suite
- No idempotency protection for repeated order submissions
- No payment processing
- Limited handling of product deletion when referenced by existing orders

These are documented areas for future development.

## Version History

| Version | Milestone |
|---|---|
| v0.1.0 | In-memory product CRUD API |
| v0.2.0 | PostgreSQL integration and persistent data |
| v0.3.0 | Customer and order management with database transactions |
| v0.4.0 | Inventory management, concurrency protection, and database migrations |

## Future Improvements

- Automated API and integration testing
- Authentication and role-based authorization
- Idempotent order creation
- Order cancellation and inventory restoration
- Improved database error handling
- OpenAPI/Swagger documentation
- Deployment and production configuration

---

**Project Focus:** Backend API Development · PostgreSQL Transactions · Concurrency Control · Data Integrity · Database Migrations

The baseline schema creates the application tables, inventory constraints, and migration history required for a fresh database.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`.

Example:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
```

Replace the placeholder password with your PostgreSQL credentials.

**Security:** Never commit `.env.local` to GitHub. For production environments, use a dedicated database account with appropriate permissions.

### 5. Check Database Migrations

Check migration status:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts status
```

Apply pending migrations:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts migrate
```

The migration runner records applied migrations in the `schema_migrations` table and skips migrations that have already been applied.

For an existing database created before v0.4.0, apply the pending migrations rather than recreating the database.

### 6. Start the Development Server

```bash
npm run dev
```

The API is available at:

`http://localhost:3000`

## Example API Requests

### Create a Product

**POST `/api/products`**

```json
{
  "name": "Keyboard",
  "price": 50
}
```

Example response (`201 Created`):

```json
{
  "id": 1,
  "name": "Keyboard",
  "price": "50.00",
  "stock_quantity": 0
}
```

New products start with zero inventory by default.

### Retrieve Products

**GET `/api/products`**

Example response:

```json
[
  {
    "id": 1,
    "name": "Keyboard",
    "price": "50.00",
    "stock_quantity": 10
  }
]
```

### Update a Product's Price

**PATCH `/api/products/1`**

```json
{
  "price": 65
}
```

This updates the product price without changing its inventory quantity.

### Adjust Inventory

**PATCH `/api/products/1/stock`**

Restock 10 units:

```json
{
  "adjustment": 10
}
```

Deduct 3 units:

```json
{
  "adjustment": -3
}
```

The adjustment must be a nonzero integer.

The API uses a conditional SQL update to prevent negative stock quantities and integer overflow.

Insufficient stock returns `409 Conflict`.

### Create a Customer

**POST `/api/customers`**

```json
{
  "name": "Sarah",
  "email": "sarah@example.com"
}
```

A successful request returns `201 Created`.

Duplicate email addresses return `409 Conflict`, while invalid request data returns `400 Bad Request`.

### Create an Order

**POST `/api/orders`**

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

The customer and product must already exist, and the product must have sufficient inventory.

When an order is submitted, the API:

1. Validates the incoming request.
2. Starts a PostgreSQL transaction.
3. Verifies that the customer exists.
4. Locks the relevant product rows using `SELECT ... FOR UPDATE`.
5. Checks available inventory and retrieves current product prices.
6. Creates the order and its items.
7. Deducts the purchased quantities from inventory.
8. Commits the transaction if all operations succeed.

If an operation fails, the transaction is rolled back.

The order items store historical unit-price snapshots, so subsequent changes to product prices do not alter previous purchases.

### Retrieve Orders

**GET `/api/orders`**

Returns orders with associated customer information, purchased products, quantities, historical unit prices, and calculated totals.

PostgreSQL `NUMERIC` monetary values are represented as strings to preserve decimal precision.

## Inventory Concurrency Protection

Concurrent purchases can cause overselling if multiple requests read the same inventory quantity without proper coordination.

This API protects inventory through:

- PostgreSQL transactions
- Row-level locking with `SELECT ... FOR UPDATE`
- Conditional inventory deduction
- Database constraints preventing negative stock
- Rollback when an order cannot be completed

For example, if only four units are available and two customers simultaneously attempt to purchase three units each, only one order can succeed.

The other request is rejected with `409 Conflict` because insufficient inventory remains.

## Database Migrations

Migration files are stored in:

`database/migrations/`

The migration runner is located at:

`scripts/migrate.ts`

The `schema_migrations` table tracks applied migration versions.

Migration execution uses transactions and PostgreSQL advisory locking to support consistent migration execution.

The initial stock migration is:

`001_add_product_stock.sql`

It adds the `stock_quantity` column and a constraint preventing negative inventory values.

## Testing

The API has been manually tested using Postman, PowerShell, and PostgreSQL SQL Shell.

Completed test scenarios include:

- Product CRUD operations
- Customer retrieval and creation
- Order creation and retrieval
- Invalid request validation
- Insufficient inventory rejection
- Inventory restocking and deduction
- Inventory integer overflow protection
- Transaction rollback
- PostgreSQL row-level locking
- Concurrent HTTP order submissions
- Database migration execution and rollback
- Regression testing of existing API functionality

Concurrency testing verified that two competing requests could not both purchase inventory beyond the available quantity.

Automated API and integration tests are not yet implemented.

TypeScript validation:

```bash
npx tsc --noEmit
```

## Current Limitations

- Authentication and authorization are not implemented.
- Idempotency protection for repeated order submissions is not implemented.
- Payment processing is not implemented.
- Automated API and integration tests are not yet implemented.
- Product deletion may fail when a product is referenced by existing orders; this currently requires improved foreign-key error handling.

## Version History

| Version | Features |
|---|---|
| v0.1.0 | Initial in-memory product CRUD API |
| v0.2.0 | PostgreSQL integration and persistent product CRUD |
| v0.3.0 | Customer and order management with relational database transactions |
| v0.4.0 | Stock management, automatic inventory deduction, concurrency protection, and database migrations |

## Future Improvements

- Authentication and role-based authorization
- Automated integration and regression testing
- Order cancellation and inventory restoration
- Idempotent order creation
- Improved database error handling
- API documentation using OpenAPI/Swagger
- Deployment and production configuration