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
    },
  }

  const tokens = {
    issueTokens: jest.fn(),
    rotateRefresh: jest.fn(),
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
})
