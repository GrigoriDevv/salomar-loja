import { Link } from "react-router";
import { openPrivacyCenter } from "../lib/consent";

type Props = {
  /** When true, Coleção/Matéria use in-page anchors (storefront). */
  homeAnchors?: boolean;
};

export function SiteFooter({ homeAnchors = false }: Props) {
  return (
    <footer className="site-footer">
      <Link className="footer-logo" to="/" aria-label="Salomar, início">
        <img src="/salomar-logo.jpg" alt="" />
      </Link>
      <p>
        Moda masculina com alma de mar.
        <br />
        Feita para um verão permanente.
      </p>
      <div>
        {homeAnchors ? (
          <>
            <a href="#colecao">Coleção</a>
            <a href="#materia">Matéria</a>
          </>
        ) : (
          <>
            <Link to="/#colecao">Coleção</Link>
            <Link to="/#materia">Matéria</Link>
          </>
        )}
        <a href="mailto:atelier@salomar.com.br">Contato</a>
        <Link to="/privacidade">Privacidade</Link>
        <button type="button" className="footer-link-btn" onClick={openPrivacyCenter}>
          Preferências
        </button>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Salomar</span>
        <span>Brasil · BRL</span>
      </div>
    </footer>
  );
}
