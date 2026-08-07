import { Link } from "react-router";
import { SiteFooter } from "../components/SiteFooter";
import { openPrivacyCenter, POLICY_VERSION } from "../lib/consent";

export function PrivacyPage() {
  return (
    <div className="site-shell privacy-page">
      <header className="site-header privacy-page__header">
        <Link className="brand-logo" to="/" aria-label="Salomar, início">
          <img src="/salomar-logo.jpg" alt="" />
        </Link>
        <nav aria-label="Principal">
          <Link to="/">Loja</Link>
          <Link to="/conta/login">Entrar</Link>
        </nav>
      </header>

      <main className="privacy-page__main">
        <p className="meta">Política {POLICY_VERSION}</p>
        <h1>Privacidade</h1>
        <p>
          A Salomar trata dados pessoais conforme a LGPD (Lei nº 13.709/2018).
          Esta página resume as práticas alinhadas ao ROPA interno e à versão de
          política <strong>{POLICY_VERSION}</strong>.
        </p>

        <h2>O que coletamos</h2>
        <ul>
          <li>
            Conta: nome, e-mail e credenciais (hash) para autenticação e
            pedidos.
          </li>
          <li>
            Pedidos e pagamento: itens, valores e identificadores da
            transação com operadores de pagamento.
          </li>
          <li>Endereços salvos na conta, quando você cadastra.</li>
          <li>
            Preferências de cookies (necessários, analytics, marketing) com
            carimbo de tempo e versão desta política.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          <strong>Necessários</strong> mantêm login, carrinho e segurança.{" "}
          <strong>Analytics</strong> e <strong>Marketing</strong> só são
          usados com o seu consentimento explícito — desmarcados por padrão.
        </p>
        <p>
          <button
            type="button"
            className="text-link"
            onClick={openPrivacyCenter}
          >
            Abrir central de preferências
          </button>
        </p>

        <h2>Seus direitos</h2>
        <p>
          Acesso, correção, portabilidade, revogação de consentimento e
          exclusão/anonimização da conta. Clientes autenticados usam{" "}
          <Link to="/conta/dados">Meus dados</Link> para exportar ou solicitar
          exclusão. Dúvidas:{" "}
          <a href="mailto:atelier@salomar.com.br">atelier@salomar.com.br</a>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
