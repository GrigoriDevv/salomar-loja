import { getAccessToken } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Address = {
  id: string;
  label: string | null;
  fullName: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

export type AddressInput = {
  label?: string;
  fullName: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

function headers(): HeadersInit {
  const token = getAccessToken();
  if (!token) throw new Error("Faça login");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listAddresses(): Promise<Address[]> {
  const res = await fetch(new URL("/me/addresses", API_URL), {
    headers: headers(),
  });
  if (!res.ok) throw new Error("Falha ao listar endereços");
  return res.json() as Promise<Address[]>;
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const res = await fetch(new URL("/me/addresses", API_URL), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Falha ao salvar endereço");
  return res.json() as Promise<Address>;
}

export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
): Promise<Address> {
  const res = await fetch(new URL(`/me/addresses/${id}`, API_URL), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Falha ao atualizar endereço");
  return res.json() as Promise<Address>;
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(new URL(`/me/addresses/${id}`, API_URL), {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Falha ao remover endereço");
}
