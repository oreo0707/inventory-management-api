export type Product = {
  id: number;
  name: string;
  price: number;
};

export const products: Product[] = [
  { id: 1, name: "Keyboard", price: 50 },
  { id: 2, name: "Mouse", price: 25 },
  { id: 3, name: "Monitor", price: 200 },
  { id: 4, name: "Headphones", price: 80 },
];