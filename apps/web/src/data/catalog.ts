export type IntentId = "por-do-sol" | "beira-mar" | "ilha" | "essenciais";

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  category: string;
  material: string;
  fit: string;
  sizes: string[];
  image: string;
  alt: string;
  intents: IntentId[];
  tone: string;
  focus: string;
  stock?: number;
  inStock?: boolean;
  variants?: ProductVariant[];
}

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

export const intentOptions: {
  id: IntentId;
  label: string;
  description: string;
}[] = [
  {
    id: "por-do-sol",
    label: "Pôr do sol",
    description: "Camadas leves para quando a brisa encontra o fim da tarde.",
  },
  {
    id: "beira-mar",
    label: "À beira-mar",
    description: "Peças claras e cores que respiram com o litoral.",
  },
  {
    id: "ilha",
    label: "Fim de semana na ilha",
    description: "Conforto preciso para dias inteiros entre areia e cidade.",
  },
  {
    id: "essenciais",
    label: "Essenciais de verão",
    description: "Uma mala pequena para viver muitos dias de sol.",
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    price,
  );
