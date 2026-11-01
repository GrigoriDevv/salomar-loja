import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthService } from './auth.service'
import { MailService } from './mail'
import { TokenService } from './token.service'

describe('AuthService', () => {
  let service: AuthService

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  }

  const tokens = {
    issueTokens: jest.fn(),
    rotateRefresh: jest.fn(),
    revokeAll: jest.fn(),
  }

  const mail = {
    sendPasswordReset: jest.fn(),
  }

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'WEB_ORIGIN') return 'http://localhost:5173'
      if (key === 'CORS_ORIGIN') return 'http://localhost:5173'
      return undefined
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenService, useValue: tokens },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  describe('login', () => {
    it('devolve user + tokens quando as credenciais são válidas', async () => {
      const passwordHash = await bcrypt.hash('senha1234', 4)
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Gabriel',
        email: 'gabriel@salomar.com',
        role: 'cliente',
        passwordHash,
      })
      tokens.issueTokens.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      })

      const result = await service.login({
        email: '  Gabriel@Salomar.com ',
        password: 'senha1234',
      })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'gabriel@salomar.com' },
      })
      expect(tokens.issueTokens).toHaveBeenCalledWith({
        id: 'u1',
        email: 'gabriel@salomar.com',
        role: 'cliente',
      })
      expect(result).toMatchObject({
        id: 'u1',
        name: 'Gabriel',
        email: 'gabriel@salomar.com',
        role: 'cliente',
        accessToken: 'access',
        refreshToken: 'refresh',
      })
    })

    it('lança UnauthorizedException quando o e-mail não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'sumido@salomar.com', password: 'senha1234' }),
      ).rejects.toBeInstanceOf(UnauthorizedException)

      expect(tokens.issueTokens).not.toHaveBeenCalled()
    })

    it('lança UnauthorizedException quando a senha está errada', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'gabriel@salomar.com',
        role: 'cliente',
        passwordHash: await bcrypt.hash('senha1234', 4),
      })

      await expect(
        service.login({ email: 'gabriel@salomar.com', password: 'erradaaaaa' }),
      ).rejects.toBeInstanceOf(UnauthorizedException)

      expect(tokens.issueTokens).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('cria usuário e devolve tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'u2',
        name: 'Maria',
        email: 'maria@salomar.com',
        role: 'cliente',
        createdAt: new Date('2026-01-01'),
      })
      tokens.issueTokens.mockResolvedValue({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      })

      const result = await service.register({
        name: ' Maria ',
        email: 'Maria@Salomar.com',
        password: 'senha1234',
      })

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Maria',
          email: 'maria@salomar.com',
          passwordHash: expect.any(String),
        },
      })
      expect(result).toMatchObject({
        id: 'u2',
        email: 'maria@salomar.com',
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      })
    })

    it('lança ConflictException quando o e-mail já existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' })

      await expect(
        service.register({
          name: 'Gabriel',
          email: 'gabriel@salomar.com',
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(ConflictException)

      expect(prisma.user.create).not.toHaveBeenCalled()
      expect(tokens.issueTokens).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('delega para TokenService.rotateRefresh', async () => {
      tokens.rotateRefresh.mockResolvedValue({
        accessToken: 'a2',
        refreshToken: 'r2',
      })

      await expect(service.refresh('old-refresh')).resolves.toEqual({
        accessToken: 'a2',
        refreshToken: 'r2',
      })
      expect(tokens.rotateRefresh).toHaveBeenCalledWith('old-refresh')
    })
  })

  describe('padrão de segurança (Elo)', () => {
    it('gera hash bcrypt com custo 12 no cadastro', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockImplementation(({ data }) => ({ id: 'u1', role: 'cliente', ...data }))
      tokens.issueTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' })

      await service.register({ name: 'Ana', email: 'ana@x.com', password: 'senha1234' })

      const { passwordHash } = prisma.user.create.mock.calls[0][0].data
      expect(bcrypt.getRounds(passwordHash)).toBe(12)
    })

    it('logout encerra todas as sessões', async () => {
      await service.logout('u1')
      expect(tokens.revokeAll).toHaveBeenCalledWith('u1')
    })

    it('troca de senha confere a atual, derruba as outras sessões e emite token novo', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@x.com',
        passwordHash: await bcrypt.hash('antiga123', 4),
      })
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        name: 'Ana',
        email: 'ana@x.com',
        role: 'cliente',
        createdAt: new Date(),
        sessionVersion: 3,
      })
      tokens.issueTokens.mockResolvedValue({ accessToken: 'novo', refreshToken: 'r' })

      const result = await service.updateProfile('u1', {
        currentPassword: 'antiga123',
        password: 'nova12345',
      })

      expect(prisma.user.update.mock.calls[0][0].data.sessionVersion).toEqual({ increment: 1 })
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled()
      expect(tokens.issueTokens).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1', sessionVersion: 3 }))
      expect(result.tokens?.accessToken).toBe('novo')
      expect(result.profile).not.toHaveProperty('sessionVersion')
    })

    it('redefinir a senha pelo link derruba as sessões', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      })

      await service.resetPassword('a'.repeat(40), 'nova12345')

      expect(prisma.user.update.mock.calls[0][0].data.sessionVersion).toEqual({ increment: 1 })
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }),
      )
    })
  })
})
