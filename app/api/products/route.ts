import { products } from "@/lib/products";

export async function GET() {
  return Response.json(products);
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
    typeof body?.name !== "string" ||
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

  const nextId =
    Math.max(0, ...products.map((product) => product.id)) + 1;

  const newProduct = {
    id: nextId,
    name: body.name,
    price: body.price,
  };

  products.push(newProduct);

  return Response.json(newProduct, {
    status: 201,
  });
}