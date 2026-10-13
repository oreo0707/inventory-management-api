import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query("SELECT 1");

    return Response.json(
      {
        status: "ok",
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database health check failed:", error);

    return Response.json(
      {
        status: "error",
        database: "unavailable",
      },
      { status: 503 }
    );
  }
}