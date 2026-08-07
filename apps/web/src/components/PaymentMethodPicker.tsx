export type CheckoutPayMethod = "card" | "pix" | "boleto";

type Props = {
  selected?: CheckoutPayMethod | null;
  onSelect: (method: CheckoutPayMethod) => void;
  disabled?: boolean;
};

const OPTIONS: {
  id: CheckoutPayMethod;
  title: string;
  description: string;
}[] = [
  {
    id: "card",
    title: "Cartão",
    description: "Crédito ou débito, tokenizado pelo Mercado Pago",
  },
  {
    id: "pix",
    title: "Pix",
    description: "Aprovação rápida após o pagamento",
  },
  {
    id: "boleto",
    title: "Boleto",
    description: "Compensação em até 1–3 dias úteis",
  },
];

export function PaymentMethodPicker({ selected, onSelect, disabled }: Props) {
  return (
    <section className="checkout-methods" aria-label="Forma de pagamento">
      <h2>Forma de pagamento</h2>
      <p className="meta">Escolha como deseja pagar</p>
      <ul className="checkout-methods__list">
        {OPTIONS.map((option) => {
          const isActive = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={
                  isActive
                    ? "checkout-methods__option is-active"
                    : "checkout-methods__option"
                }
                disabled={disabled}
                aria-pressed={isActive}
                onClick={() => onSelect(option.id)}
              >
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
