# Inventory Management API

A RESTful backend API built with **Next.js, TypeScript, and PostgreSQL** for managing product inventory.

The project demonstrates backend development fundamentals, including CRUD operations, relational database integration, request validation, parameterized SQL queries, and HTTP error handling.

## Tech Stack

- **Next.js 16** — API routes using the App Router
- **TypeScript** — Type-safe application development
- **PostgreSQL** — Relational database
- **node-postgres (`pg`)** — Database connection pooling and SQL queries
- **Postman** — Manual API testing

## Features

- Create products
- Retrieve all products
- Retrieve individual products by ID
- Update product prices
- Delete products
- Validate incoming requests
- Return appropriate HTTP status codes
- Store product data persistently in PostgreSQL
- Check database connectivity through a health-check endpoint

## API Endpoints
## Customer & Order Management (v0.3.0)

The API supports relational customer and order management using PostgreSQL.

### Database Tables

- `products` — stores product information and current prices.
- `customers` — stores customer names and unique email addresses.
- `orders` — stores orders associated with customers.
- `order_items` — stores products, quantities, and historical unit prices for each order.

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | Retrieve all customers |
| POST | `/api/customers` | Create a customer |
| GET | `/api/orders` | Retrieve orders with customer information, purchased items, and totals |
| POST | `/api/orders` | Create an order with one or more products |

The existing product CRUD endpoints remain available.

### Create a Customer

**POST `/api/customers`**

```json
{
  "name": "Sarah",
  "email": "sarah@example.com"
}
```

A successful request returns `201 Created`.

Duplicate email addresses return `409 Conflict`. Invalid request data returns `400 Bad Request`.

### Create an Order

**POST `/api/orders`**

```json
{
  "customer_id": 2,
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 2,
      "quantity": 2
    }
  ]
}
```

Replace the IDs with existing customer and product IDs.

The backend retrieves current product prices directly from PostgreSQL and stores them as historical unit-price snapshots in `order_items`.

Order creation uses a PostgreSQL transaction to ensure that the order and all its items are committed together or rolled back together.

### Retrieve Orders

**GET `/api/orders`**

Returns orders with nested customer information, purchased products, quantities, historical unit prices, subtotals, and calculated order totals.

Monetary values returned from PostgreSQL `NUMERIC` columns are represented as strings to preserve decimal precision.

### Data Integrity

The database enforces primary keys, foreign keys, uniqueness constraints, and positive-value checks.

The API also validates incoming requests and returns appropriate HTTP error responses.

### Current Limitations

- Stock quantities and inventory deduction are not implemented.
- Authentication and authorization are not implemented.
- Idempotency protection for repeated order submissions is not implemented.
- Payment processing is not implemented.
- Automated API tests and database migrations are planned for later milestones.
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve all products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Retrieve a product by ID |
| PATCH | `/api/products/:id` | Update a product's price |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/health/db` | Check database connectivity |

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/oreo0707/inventory-management-api.git
cd inventory-management-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Connect to PostgreSQL and run:

```sql
CREATE DATABASE inventory_db;
```

Then connect to the new database and execute the SQL in `database/schema.sql`.

Using `psql`:

```sql
\c inventory_db
\i database/schema.sql
```

The `\i` command requires a valid path relative to the current working directory. You can also provide the full path to the schema file.

### 4. Configure environment variables

Copy `.env.example` to `.env.local`.

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
```

Replace the placeholder password with your own PostgreSQL credentials.

Never commit `.env.local` to GitHub.

The `postgres` account is used here for local development. A dedicated, least-privilege database account is recommended for deployment.

### 5. Start the development server

```bash
npm run dev
```

The API is available at:

`http://localhost:3000`

## Example Requests

### Create a Product

**POST** `/api/products`

```json
{
  "name": "Keyboard",
  "price": 50
}
```

Example response — `201 Created`:

```json
{
  "id": 1,
  "name": "Keyboard",
  "price": "50.00"
}
```

### Retrieve All Products

**GET** `/api/products`

Example response:

```json
[
  {
    "id": 1,
    "name": "Keyboard",
    "price": "50.00"
  }
]
```

### Update a Product's Price

**PATCH** `/api/products/1`

```json
{
  "price": 65
}
```

### Delete a Product

**DELETE** `/api/products/1`

Returns the deleted product and a success message.

## Testing

API endpoints can be tested using Postman.

Create a collection called `Inventory Management API` and add requests for the supported endpoints.

## Current Scope

Version `v0.2.0` provides PostgreSQL-backed product CRUD functionality.

Future development is planned to include customer management, order processing