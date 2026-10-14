
import pool from "@/lib/db";

type OrderRow = {
  order_id: number;
  status: string;
  created_at: Date;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  order_item_id: number | null;
  product_id: number | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: string | null;
  subtotal: string | null;
  total_amount: string;
};

type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

type Order = {
  id: number;
  status: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItem[];
  total_amount: string;
  created_at: Date;
};

export async function GET() {
  try {
    const result = await pool.query<OrderRow>(
      `SELECT
         o.id AS order_id,
         o.status,
         o.created_at,
         c.id AS customer_id,
         c.name AS customer_name,
         c.email AS customer_email,
         oi.id AS order_item_id,
         p.id AS product_id,
         p.name AS product_name,
         oi.quantity,
         oi.unit_price,
         (oi.quantity * oi.unit_price) AS subtotal,
         COALESCE(
           SUM(oi.quantity * oi.unit_price)
             OVER (PARTITION BY o.id),
           0
         )::NUMERIC(12, 2) AS total_amount
       FROM orders AS o
       INNER JOIN customers AS c
         ON o.customer_id = c.id
       LEFT JOIN order_items AS oi
         ON o.id = oi.order_id
       LEFT JOIN products AS p
         ON oi.product_id = p.id
       ORDER BY o.id, oi.id`
    );

    const ordersMap = new Map<number, Order>();

    for (const row of result.rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          status: row.status,
          customer: {
            id: row.customer_id,
            name: row.customer_name,
            email: row.customer_email,
          },
          items: [],
          total_amount: row.total_amount,
          created_at: row.created_at,
        });
      }

      const order = ordersMap.get(row.order_id)!;

      if (
        row.order_item_id !== null &&
        row.product_id !== null &&
        row.product_name !== null &&
        row.quantity !== null &&
        row.unit_price !== null &&
        row.subtotal !== null
      ) {
        order.items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          unit_price: row.unit_price,
          subtotal: row.subtotal,
        });
      }
    }

    return Response.json(
      Array.from(ordersMap.values()),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retrieve orders:", error);

    return Response.json(
      { error: "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}

type CreateOrderItem = {
  product_id: number;
  quantity: number;
};

type ProductPriceRow = {
  id: number;
  price: string;
};

type CreatedOrderRow = {
  id: number;
  customer_id: number;
  status: string;
  created_at: Date;
};

export async function POST(request: Request) {
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
    Array.isArray(body)
  ) {
    return Response.json(
      { error: "Invalid order data" },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;
  const customerId = data.customer_id;
  const rawItems = data.items;

  if (
    typeof customerId !== "number" ||
    !Number.isSafeInteger(customerId) ||
    customerId <= 0 ||
    !Array.isArray(rawItems) ||
    rawItems.length === 0
  ) {
    return Response.json(
      { error: "Invalid customer ID or order items" },
      { status: 400 }
    );
  }

  const items: CreateOrderItem[] = [];
  const productIds = new Set<number>();

  for (const rawItem of rawItems) {
    if (
      rawItem === null ||
      typeof rawItem !== "object" ||
      Array.isArray(rawItem)
    ) {
      return Response.json(
        { error: "Invalid order item" },
        { status: 400 }
      );
    }

    const item = rawItem as Record<string, unknown>;

    if (
      typeof item.product_id !== "number" ||
      !Number.isSafeInteger(item.product_id) ||
      item.product_id <= 0 ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return Response.json(
        { error: "Invalid product ID or quantity" },
        { status: 400 }
      );
    }

    if (productIds.has(item.product_id)) {
      return Response.json(
        { error: "Duplicate products are not allowed" },
        { status: 400 }
      );
    }

    productIds.add(item.product_id);

    items.push({
      product_id: item.product_id,
      quantity: item.quantity,
    });
  }

  const client = await pool.connect().catch((error) => {
    console.error("Database connection failed:", error);
    return null;
  });

  if (!client) {
    return Response.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }

  try {
    await client.query("BEGIN");

    // Verify the customer exists.
    const customerResult = await client.query(
      "SELECT id FROM customers WHERE id = $1",
      [customerId]
    );

    if (customerResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return Response.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch current product prices from PostgreSQL.
    const productResult = await client.query<ProductPriceRow>(
      `SELECT id, price
       FROM products
       WHERE id = ANY($1::integer[])
       FOR SHARE`,
      [Array.from(productIds)]
    );

    if (productResult.rows.length !== items.length) {
      await client.query("ROLLBACK");

      return Response.json(
        { error: "One or more products were not found" },
        { status: 404 }
      );
    }

    const priceMap = new Map<number, string>();

    for (const product of productResult.rows) {
      priceMap.set(product.id, product.price);
    }

    // Create the order.
    const orderResult = await client.query<CreatedOrderRow>(
      `INSERT INTO orders (customer_id)
       VALUES ($1)
       RETURNING id, customer_id, status, created_at`,
      [customerId]
    );

    const order = orderResult.rows[0];

    // Insert order items using trusted database prices.
    for (const item of items) {
      const unitPrice = priceMap.get(item.product_id);

      if (unitPrice === undefined) {
        throw new Error("Product price missing");
      }

      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [
          order.id,
          item.product_id,
          item.quantity,
          unitPrice,
        ]
      );
    }

    await client.query("COMMIT");

    return Response.json(
      {
        message: "Order created successfully",
        order_id: order.id,
        customer_id: order.customer_id,
        status: order.status,
        created_at: order.created_at,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Transaction rollback failed:", rollbackError);
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      if (error.code === "23503") {
        return Response.json(
          { error: "Referenced customer or product no longer exists" },
          { status: 409 }
        );
      }

      if (error.code === "23505") {
        return Response.json(
          { error: "Order contains conflicting duplicate data" },
          { status: 409 }
        );
      }

      if (error.code === "23514") {
        return Response.json(
          { error: "Order violates a database validation rule" },
          { status: 400 }
        );
      }

      if (error.code === "40P01" || error.code === "40001") {
        return Response.json(
          { error: "Database transaction conflict. Please retry." },
          {
            status: 503,
            headers: { "Retry-After": "1" },
          }
        );
      }
    }

    console.error("Failed to create order:", error);

    return Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
