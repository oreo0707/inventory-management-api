# Product Management REST API

A simple REST API built with **Next.js App Router** and **TypeScript** to practice backend development, CRUD operations, request validation, and HTTP status codes.

## Features

- Create, retrieve, update, and delete products
- RESTful API endpoints
- JSON request and response handling
- Input validation for product names and prices
- HTTP error handling using status codes such as `400` and `404`
- Basic product ID generation

## Tech Stack

- Next.js
- TypeScript
- Node.js

## API Endpoints

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| GET | `/api/products` | Retrieve all products | 200 |
| GET | `/api/products/:id` | Retrieve a product by ID | 200 |
| POST | `/api/products` | Create a new product | 201 |
| PATCH | `/api/products/:id` | Update a product's price | 200 |
| DELETE | `/api/products/:id` | Delete a product | 200 |

## Example Requests

### Create a product

`POST /api/products`

Request body:

```json
{
  "name": "Keyboard",
  "price": 50
}
```

### Update a product

`PATCH /api/products/1`

Request body:

```json
{
  "price": 45
}
```

### Retrieve all products

`GET /api/products`

### Delete a product

`DELETE /api/products/1`

## Error Handling

The API returns appropriate HTTP status codes:

- `400 Bad Request` — Invalid product data or malformed JSON
- `404 Not Found` — Requested product does not exist

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/product-api-lab.git
cd product-api-lab
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The API will be available at:

`http://localhost:3000/api/products`

## Testing

The API was manually tested using HTTP requests with `curl`.

Verified scenarios include:

- Creating a valid product
- Retrieving existing products
- Updating a product's price
- Deleting a product
- Retrieving a deleted product (`404`)
- Rejecting invalid product data (`400`)
- Rejecting deletion of nonexistent products (`404`)

## Current Limitations

This project is a backend learning lab, not a production-ready service.

- Products are stored in a shared in-memory array rather than a database.
- Data may reset when the development server restarts or reloads.
- Product IDs are generated from the current highest ID, without concurrency guarantees.
- PATCH currently supports updating product prices only.
- No authentication or authorization is implemented.
- Automated tests have not yet been added.

## Future Improvements

- PostgreSQL database integration
- Authentication and authorization
- Automated API testing
- Pagination and filtering
- Production-ready validation and unique ID generation

## Purpose

This project was created to strengthen practical backend development skills, including REST API design, CRUD operations, TypeScript, request validation, and HTTP response handling.