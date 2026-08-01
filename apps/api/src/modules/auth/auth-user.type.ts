export type AuthUser = {
  id: string
  email: string
  role: 'cliente' | 'atendente' | 'admin'
}
