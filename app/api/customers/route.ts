import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM customers ORDER BY id"
    );

    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to retrieve customers:", error);

    return Response.json(
      { error: "Failed to retrieve customers" },
      { status: 500 }
    );
  }
}

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
      { error: "Invalid customer data" },
      { status: 400 }
    );
  }

  const { name, email } = body as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100 ||
    typeof email !== "string" ||
    email.trim().length === 0 ||
    email.trim().length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return Response.json(
      { error: "Invalid customer name or email" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email`,
      [name.trim(), email.trim().toLowerCase()]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json(
        { error: "Customer email already exists" },
        { status: 409 }
      );
    }

    console.error("Failed to create customer:", error);

    return Response.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}