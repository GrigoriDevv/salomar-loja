import { useEffect, useState, type FormEvent } from "react";
import type { ShippingData } from "../lib/checkout-api";
import {
  calculateShipping,
  type ShippingOption,
  type ShippingServiceCode,
} from "../lib/shipping-api";
import { formatPrice } from "../data/catalog";
import { useCart } from "../state/store";

export type ShippingSelection = {
  address: ShippingData;
  option: ShippingOption;
};

type Props = {
  initial?: Partial<ShippingData>;
  onSubmit: (data: ShippingSelection) => void;
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
  const { items } = useCart();
  const [form, setForm] = useState<ShippingData>({ ...empty, ...initial });
  const [cepLoading, setCepLoading] = useState(false);
  const [freightLoading, setFreightLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedCode, setSelectedCode] = useState<ShippingServiceCode | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ShippingData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const quoteFreight = async (cepDigits: string) => {
    if (cepDigits.length !== 8 || items.length === 0) {
      setOptions([]);
      setSelectedCode(null);
      return;
    }
    setFreightLoading(true);
    setError(null);
    try {
      const quote = await calculateShipping(
        cepDigits,
        items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
      );
      setOptions(quote.options);
      setSelectedCode((prev) => {
        if (prev && quote.options.some((o) => o.serviceCode === prev)) {
          return prev;
        }
        return quote.options[0]?.serviceCode ?? null;
      });
    } catch (e) {
      setOptions([]);
      setSelectedCode(null);
      setError(
        e instanceof Error ? e.message : "Não foi possível calcular o frete",
      );
    } finally {
      setFreightLoading(false);
    }
  };

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
        setOptions([]);
        setSelectedCode(null);
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro ?? f.street,
        district: data.bairro ?? f.district,
        city: data.localidade ?? f.city,
        state: data.uf ?? f.state,
      }));
      await quoteFreight(cep);
    } catch {
      setError("Não foi possível consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8 || items.length === 0) return;
    void quoteFreight(cep);
  }, [items]);

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
    const option = options.find((o) => o.serviceCode === selectedCode);
    if (!option) {
      setError("Selecione uma opção de frete");
      return;
    }
    setError(null);
    onSubmit({
      address: {
        ...form,
        fullName: form.fullName.trim(),
        cep: onlyDigits(form.cep),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement?.trim() || undefined,
        district: form.district.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase().slice(0, 2),
      },
      option,
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
            onChange={(e) => {
              set("cep", e.target.value);
              setOptions([]);
              setSelectedCode(null);
            }}
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
          disabled={disabled || cepLoading || freightLoading}
        >
          {cepLoading || freightLoading ? "Buscando…" : "Buscar CEP"}
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

      {options.length > 0 && (
        <fieldset className="checkout-shipping__freight" disabled={disabled}>
          <legend>Frete</legend>
          {options.map((opt) => (
            <label key={opt.serviceCode} className="checkout-shipping__option">
              <input
                type="radio"
                name="shipping-service"
                value={opt.serviceCode}
                checked={selectedCode === opt.serviceCode}
                onChange={() => setSelectedCode(opt.serviceCode)}
              />
              <span>
                <strong>{opt.serviceName}</strong>
                {" · "}
                {formatPrice(opt.priceCents / 100)}
                {" · "}
                até {opt.days} dia{opt.days === 1 ? "" : "s"} úteis
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {error && (
        <p className="checkout-shipping__error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-action"
        type="submit"
        disabled={disabled || freightLoading || options.length === 0}
      >
        Continuar para pagamento
      </button>
    </form>
  );
}
