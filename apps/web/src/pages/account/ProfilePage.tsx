import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  getProfile,
  updateProfile,
  type UserProfile,
} from "../../lib/auth-api";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  type Address,
  type AddressInput,
} from "../../lib/addresses-api";
import { openPrivacyCenter } from "../../lib/consent";
import {
  anonymizeAccount,
  downloadJson,
  exportMyData,
} from "../../lib/privacy-api";

const emptyAddress: AddressInput = {
  fullName: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  label: "",
  isDefault: false,
};

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const reload = async () => {
    const [p, a] = await Promise.all([getProfile(), listAddresses()]);
    setProfile(p);
    setName(p.name);
    setEmail(p.email);
    setAddresses(a);
  };

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Falha ao carregar"),
    );
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        currentPassword: password ? currentPassword : undefined,
        password: password || undefined,
      });
      setProfile(updated);
      setCurrentPassword("");
      setPassword("");
      setMessage("Dados atualizados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  };

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createAddress({
        ...form,
        cep: form.cep.replace(/\D/g, ""),
        state: form.state.toUpperCase().slice(0, 2),
      });
      setForm(emptyAddress);
      setAddresses(await listAddresses());
      setMessage("Endereço salvo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no endereço");
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (id: string) => {
    setBusy(true);
    try {
      await deleteAddress(id);
      setAddresses(await listAddresses());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover");
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await exportMyData();
      downloadJson(
        `salomar-meus-dados-${new Date().toISOString().slice(0, 10)}.json`,
        data,
      );
      setMessage("Exportação baixada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na exportação");
    } finally {
      setBusy(false);
    }
  };

  const onAnonymize = async (e: FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== "EXCLUIR") {
      setError("Digite EXCLUIR para confirmar");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await anonymizeAccount();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
      setBusy(false);
    }
  };

  const set = (key: keyof AddressInput, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <section className="account-section">
      <h2>Meus dados</h2>
      {profile && (
        <form className="account-form" onSubmit={(e) => void saveProfile(e)}>
          <label>
            <span>Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Senha atual (para trocar a senha)</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            <span>Nova senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <button className="primary-action" type="submit" disabled={busy}>
            Salvar dados
          </button>
        </form>
      )}

      <h2>Endereços salvos</h2>
      <ul className="account-addresses">
        {addresses.map((addr) => (
          <li key={addr.id}>
            <div>
              <strong>
                {addr.label || "Endereço"}
                {addr.isDefault ? " · padrão" : ""}
              </strong>
              <p>
                {addr.fullName} — {addr.street}, {addr.number}
                {addr.complement ? `, ${addr.complement}` : ""} · {addr.city}/
                {addr.state} · CEP {addr.cep}
              </p>
            </div>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => void removeAddress(addr.id)}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      <form className="account-form" onSubmit={(e) => void saveAddress(e)}>
        <h3>Novo endereço</h3>
        <label>
          <span>Apelido</span>
          <input
            value={form.label ?? ""}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Casa, trabalho…"
          />
        </label>
        <label>
          <span>Nome</span>
          <input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            required
          />
        </label>
        <label>
          <span>CEP</span>
          <input
            value={form.cep}
            onChange={(e) => set("cep", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Rua</span>
          <input
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            required
          />
        </label>
        <div className="account-form__row">
          <label>
            <span>Número</span>
            <input
              value={form.number}
              onChange={(e) => set("number", e.target.value)}
              required
            />
          </label>
          <label>
            <span>Complemento</span>
            <input
              value={form.complement ?? ""}
              onChange={(e) => set("complement", e.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Bairro</span>
          <input
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            required
          />
        </label>
        <div className="account-form__row">
          <label>
            <span>Cidade</span>
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              required
            />
          </label>
          <label>
            <span>UF</span>
            <input
              value={form.state}
              onChange={(e) => set("state", e.target.value.slice(0, 2))}
              maxLength={2}
              required
            />
          </label>
        </div>
        <label className="account-form__check">
          <input
            type="checkbox"
            checked={Boolean(form.isDefault)}
            onChange={(e) => set("isDefault", e.target.checked)}
          />
          <span>Definir como padrão</span>
        </label>
        <button className="primary-action" type="submit" disabled={busy}>
          Salvar endereço
        </button>
      </form>

      <div className="account-privacy">
        <h2>Privacidade e direitos</h2>
        <p>
          Acesse, corrija, exporte ou exclua seus dados. Preferências de cookies
          podem ser alteradas a qualquer momento.
        </p>
        <div className="account-privacy__actions">
          <button
            type="button"
            className="primary-action"
            disabled={busy}
            onClick={() => void onExport()}
          >
            Exportar meus dados
          </button>
          <button
            type="button"
            className="text-link"
            onClick={openPrivacyCenter}
          >
            Preferências de cookies
          </button>
        </div>

        <form
          className="account-form account-privacy__delete"
          onSubmit={(e) => void onAnonymize(e)}
        >
          <h3>Excluir conta</h3>
          <p>
            Anonimiza seu perfil, remove endereços e encerra o acesso. Pedidos
            fiscais podem ser retidos sem identificação pessoal. Digite{" "}
            <strong>EXCLUIR</strong> para confirmar.
          </p>
          <label>
            <span>Confirmação</span>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
              autoComplete="off"
            />
          </label>
          <button
            className="primary-action account-privacy__danger"
            type="submit"
            disabled={busy || deleteConfirm !== "EXCLUIR"}
          >
            Excluir minha conta
          </button>
        </form>
      </div>

      {error && (
        <p className="account-form__error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="account-form__ok" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
