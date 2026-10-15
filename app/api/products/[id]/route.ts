
import pool from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return Response.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error("Failed to retrieve product:", error);

    return Response.json(
      { error: "Failed to retrieve product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return Response.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

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
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price <= 0
  ) {
    return Response.json(
      { error: "Invalid product price" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET price = $1
       WHERE id = $2
       RETURNING id, name, price, stock_quantity`,
      [body.price, productId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error("Failed to update product:", error);

    return Response.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return Response.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING id, name, price, stock_quantity`,
      [productId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "Product deleted successfully",
        product: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete product:", error);

    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
