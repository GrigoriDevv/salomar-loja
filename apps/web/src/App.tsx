import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router'
import { ArrowDown, ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react'
import { CartDrawer } from './components/CartDrawer'
import { IntentComposer } from './components/IntentComposer'
import { ProductListing } from './components/ProductListing'
import { ProductQuickView } from './components/ProductQuickView'
import { intentOptions, type IntentId, type Product } from './data/catalog'
import { getAccessToken } from './lib/auth-api'
import { CartProvider, useCart } from './state/store'
import {
  AccountIndexRedirect,
  AccountLayout,
} from './pages/account/AccountLayout'
import { ForgotPasswordPage } from './pages/account/ForgotPasswordPage'
import { LoginPage } from './pages/account/LoginPage'
import { OrdersPage } from './pages/account/OrdersPage'
import { ProfilePage } from './pages/account/ProfilePage'
import { RegisterPage } from './pages/account/RegisterPage'
import { ResetPasswordPage } from './pages/account/ResetPasswordPage'
import {
  AdminIndexRedirect,
  AdminLayout,
} from './pages/admin/AdminLayout'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminStockPage } from './pages/admin/AdminStockPage'
import { PrivacyRoot } from './components/privacy/PrivacyRoot'
import { SiteFooter } from './components/SiteFooter'
import { CheckoutPage } from './pages/CheckoutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ProductPage } from './pages/ProductPage'
import './styles.css'

const HERO_IMAGES = [
  { src: '/catalog/editorial-por-do-sol.jpg', focus: '50% 48%' },
  { src: '/catalog/editorial-palmeira.jpg', focus: '50% 8%' },
  { src: '/catalog/editorial-ondas.jpg', focus: '50% 38%' },
]

function Storefront() {
  const [activeIntent, setActiveIntent] = useState<IntentId>('essenciais')
  const [intentMessage, setIntentMessage] = useState('Uma base pequena para combinar muitas vezes.')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const { count, setOpen } = useCart()
  const activeOption = intentOptions.find((option) => option.id === activeIntent)!

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_IMAGES.length)
    }, 15_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="site-shell">
      <header className="site-header">
        <button
          className="mobile-menu-button icon-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <a className="brand-logo" href="#top" aria-label="Salomar, início">
          <img src="/salomar-logo.jpg" alt="" />
        </a>
        <nav className={menuOpen ? 'is-open' : ''} aria-label="Principal">
          <a href="#descobrir" onClick={() => setMenuOpen(false)}>Descobrir</a>
          <a href="#colecao" onClick={() => setMenuOpen(false)}>Coleção</a>
          <a href="#materia" onClick={() => setMenuOpen(false)}>Nossa matéria</a>
          <Link to={getAccessToken() ? '/conta/pedidos' : '/conta/login'} onClick={() => setMenuOpen(false)}>
            {getAccessToken() ? 'Minha conta' : 'Entrar'}
          </Link>
        </nav>
        <button className="bag-button" onClick={() => setOpen(true)} aria-label={`Abrir sacola com ${count} itens`}>
          <span>Sacola</span>
          <ShoppingBag aria-hidden="true" />
          <strong>{count}</strong>
        </button>
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt=""
                className={index === heroIndex ? 'is-active' : ''}
                style={{ objectPosition: image.focus }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
          <div className="hero-wash" />
          <div className="hero-copy">
            <p className="hero-intro">Sal, sol e movimento</p>
            <h1 id="hero-title">O mar<br /><em>veste a gente.</em></h1>
            <p>Moda masculina para atravessar o dia entre a areia, a brisa e a cidade — com leveza em cada camada.</p>
            <a className="hero-link" href="#descobrir">
              Começar a descoberta <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <div className="hero-note">
            <span>Salomar · Verão permanente</span>
            <span>Litoral brasileiro, 2026</span>
          </div>
          <div className="hero-progress" aria-hidden="true">
            {HERO_IMAGES.map((image, index) => (
              <span key={image.src} className={index === heroIndex ? 'is-active' : ''} />
            ))}
          </div>
        </section>

        <section className="welcome-section" id="descobrir" aria-labelledby="welcome-title">
          <div className="sketch sketch--sun" aria-hidden="true">
            <svg viewBox="0 0 220 180">
              <path d="M28 126c36-50 75-77 144-77M42 142c49-30 93-39 149-27M117 28c8 31 7 64-5 104M82 45c28 23 48 51 61 85" />
              <circle cx="114" cy="93" r="57" />
            </svg>
          </div>
          <div>
            <p className="meta">Do litoral para todos os dias</p>
            <h2 id="welcome-title">Não é só roupa de praia.<br />É roupa com alma de mar.</h2>
          </div>
          <p className="welcome-copy">A Salomar traduz a liberdade do litoral em peças leves, naturais e versáteis. Escolha um momento do seu verão ou conte o que pretende viver.</p>
        </section>

        <ProductListing
          intent={activeIntent}
          title={activeOption.label}
          message={intentMessage}
          onSelectProduct={setSelectedProduct}
        />

        <section className="material-section" id="materia" aria-labelledby="material-title">
          <div className="material-panel" aria-hidden="true">
            <p>Da areia à cidade · Naturalmente</p>
          </div>
          <div className="material-copy">
            <p className="meta">A matéria do litoral</p>
            <h2 id="material-title">Leve como a brisa. Feito para ficar.</h2>
            <p>Escolhemos algodões de fibra longa pelo frescor, pelo toque e pelo modo como ganham personalidade com o uso. Cada construção busca movimento e conforto sob o sol.</p>
            <a href="#colecao" className="text-link">Descobrir os materiais <ArrowUpRight aria-hidden="true" /></a>
            <svg className="thread-sketch" viewBox="0 0 360 140" aria-hidden="true">
              <path d="M8 102c49-73 87 37 137-22 45-53 83-25 88 8 8 46 81 28 116-39" />
              <path d="M286 37c24 4 44 17 63 38M298 24c18 14 33 34 41 58" />
            </svg>
          </div>
        </section>

        <section className="manifesto-section">
          <p>O verão não é uma estação.</p>
          <h2>É um jeito de seguir mais leve.</h2>
          <a href="#descobrir">Recomeçar pela intenção <ArrowUpRight aria-hidden="true" /></a>
        </section>
      </main>

      <SiteFooter homeAnchors />

      <IntentComposer
        activeIntent={activeIntent}
        onIntent={(intent, query) => {
          setActiveIntent(intent)
          setIntentMessage(query === intentOptions.find((item) => item.id === intent)?.label
            ? intentOptions.find((item) => item.id === intent)!.description
            : `Uma seleção pensada a partir de “${query}”.`)
          document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
      <ProductQuickView product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer />
    </div>
  )
}

function App() {
  return (
    <CartProvider>
      <PrivacyRoot />
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/produto/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/conta/cadastro" element={<RegisterPage />} />
        <Route path="/conta/login" element={<LoginPage />} />
        <Route path="/conta/recuperar" element={<ForgotPasswordPage />} />
        <Route path="/conta/redefinir" element={<ResetPasswordPage />} />
        <Route path="/conta" element={<AccountLayout />}>
          <Route index element={<AccountIndexRedirect />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="dados" element={<ProfilePage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminIndexRedirect />} />
          <Route path="produtos" element={<AdminProductsPage />} />
          <Route path="estoque" element={<AdminStockPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}

export default App
