import { useState, type FormEvent } from "react";
import type { ShippingData } from "../lib/checkout-api";

type Props = {
  initial?: Partial<ShippingData>;
  onSubmit: (data: ShippingData) => void;
  disabled?: boolean;
};

const empty: ShippingData = {
  fullName: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export function ShippingForm({ initial, onSubmit, disabled }: Props) {
  const [form, setForm] = useState<ShippingData>({ ...empty, ...initial });
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ShippingData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const lookupCep = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    setCepLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        localidade?: string;
        bairro?: string;
        uf?: string;
      };
      if (data.erro) {
        setError("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro ?? f.street,
        district: data.bairro ?? f.district,
        city: data.localidade ?? f.city,
        state: data.uf ?? f.state,
      }));
    } catch {
      setError("Não foi possível consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || onlyDigits(form.cep).length !== 8) {
      setError("Preencha nome e CEP válidos");
      return;
    }
    if (
      !form.street.trim() ||
      !form.number.trim() ||
      !form.district.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      setError("Complete o endereço");
      return;
    }
    setError(null);
    onSubmit({
      ...form,
      fullName: form.fullName.trim(),
      cep: onlyDigits(form.cep),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement?.trim() || undefined,
      district: form.district.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase().slice(0, 2),
    });
  };

  return (
    <form
      className="checkout-shipping"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Dados de entrega"
    >
      <h2>Dados de entrega</h2>
      <label>
        <span>Nome completo</span>
        <input
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          autoComplete="name"
          required
          disabled={disabled}
        />
      </label>
      <div className="checkout-shipping__row">
        <label>
          <span>CEP</span>
          <input
            value={form.cep}
            onChange={(e) => set("cep", e.target.value)}
            onBlur={() => void lookupCep()}
            inputMode="numeric"
            autoComplete="postal-code"
            required
            disabled={disabled}
          />
        </label>
        <button
          type="button"
          className="text-link"
          onClick={() => void lookupCep()}
          disabled={disabled || cepLoading}
        >
          {cepLoading ? "Buscando…" : "Buscar CEP"}
        </button>
      </div>
      <label>
        <span>Rua</span>
        <input
          value={form.street}
          onChange={(e) => set("street", e.target.value)}
          autoComplete="address-line1"
          required
          disabled={disabled}
        />
      </label>
      <div className="checkout-shipping__row">
        <label>
          <span>Número</span>
          <input
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label>
          <span>Complemento</span>
          <input
            value={form.complement ?? ""}
            onChange={(e) => set("complement", e.target.value)}
            disabled={disabled}
          />
        </label>
      </div>
      <label>
        <span>Bairro</span>
        <input
          value={form.district}
          onChange={(e) => set("district", e.target.value)}
          required
          disabled={disabled}
        />
      </label>
      <div className="checkout-shipping__row">
        <label>
          <span>Cidade</span>
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            autoComplete="address-level2"
            required
            disabled={disabled}
          />
        </label>
        <label>
          <span>UF</span>
          <input
            value={form.state}
            onChange={(e) => set("state", e.target.value.slice(0, 2))}
            maxLength={2}
            autoComplete="address-level1"
            required
            disabled={disabled}
          />
        </label>
      </div>
      {error && (
        <p className="checkout-shipping__error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-action" type="submit" disabled={disabled}>
        Continuar para pagamento
      </button>
    </form>
  );
}
