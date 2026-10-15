
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       ORDER BY id`
    );

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to retrieve products:", error);

    return Response.json(
      { error: "Failed to retrieve products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON format" },
      { status: 400 }
    );
  }

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.name !== "string" ||
    body.name.trim() === "" ||
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price <= 0
  ) {
    return Response.json(
      { error: "Invalid product name or price" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price)
       VALUES ($1, $2)
       RETURNING id, name, price, stock_quantity`,
      [body.name.trim(), body.price]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);

    return Response.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
