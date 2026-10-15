
import pool from "@/lib/db";

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

  let body: unknown;

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
    !("adjustment" in body) ||
    typeof body.adjustment !== "number" ||
    !Number.isSafeInteger(body.adjustment) ||
    body.adjustment === 0
  ) {
    return Response.json(
      { error: "Adjustment must be a non-zero integer" },
      { status: 400 }
    );
  }

  const adjustment = body.adjustment;

  try {
    const result = await pool.query(
      `UPDATE products
       SET stock_quantity = (stock_quantity::BIGINT + $1::BIGINT)::INTEGER
      WHERE id = $2
        AND stock_quantity::BIGINT + $1::BIGINT BETWEEN 0 AND 2147483647
      RETURNING id, name, price, stock_quantity`,
      [adjustment, productId]
    );

    if (result.rows.length > 0) {
      return Response.json(
        {
          message: "Stock adjusted successfully",
          product: result.rows[0],
        },
        { status: 200 }
      );
    }

    // No rows updated: determine why.
    const productResult = await pool.query(
      `SELECT stock_quantity
       FROM products
       WHERE id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const availableStock: number =
      productResult.rows[0].stock_quantity;

    if (adjustment < 0) {
      return Response.json(
        {
          error: "Insufficient stock",
          availableStock,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        error: "Stock adjustment exceeds maximum allowed quantity",
        availableStock,
        maximumStock: 2147483647,
      },
      { status: 409 }
    );
  } catch (error) {
    console.error("Failed to adjust product stock:", error);

    return Response.json(
      { error: "Failed to adjust product stock" },
      { status: 500 }
    );
  }
}
