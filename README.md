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