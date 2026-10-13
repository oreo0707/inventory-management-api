import { products } from "@/lib/products";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const productId = Number(id);

  const product = products.find(
    (p) => p.id === productId
  );

  if (!product) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  return Response.json(product);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const product = products.find(
    (p) => p.id === Number(id)
  );

  if (!product) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
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

  product.price = body.price;

  return Response.json(product, {
    status: 200,
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const productId = Number(id);

  const productIndex = products.findIndex(
    (p) => p.id === productId
  );

  if (productIndex === -1) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  return Response.json({
    message: "Product deleted successfully",
    product: deletedProduct,
  });
}