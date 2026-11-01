import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { createHash } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { TokenService } from './token.service'

describe('TokenService', () => {
  let service: TokenService

  const jwt = {
    signAsync: jest.fn(),
    decode: jest.fn(),
    verifyAsync: jest.fn(),
  }

  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'access-secret'
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret'
      throw new Error(`missing ${key}`)
    }),
    get: jest.fn((_key: string, fallback?: string) => fallback),
  }

  const prisma = {
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(TokenService)
  })

  describe('issueTokens', () => {
    it('assina access/refresh e persiste o hash do refresh', async () => {
      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      jwt.decode.mockReturnValue({ exp: 1_900_000_000 })
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' })

      const result = await service.issueTokens({
        id: 'u1',
        email: 'gabriel@salomar.com',
        role: 'cliente',
      })

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          tokenHash: createHash('sha256').update('refresh-token').digest('hex'),
          expiresAt: new Date(1_900_000_000 * 1000),
        },
      })
    })
  })

  describe('rotateRefresh', () => {
    it('lança UnauthorizedException quando o JWT é inválido', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('invalid'))

      await expect(service.rotateRefresh('bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('lança UnauthorizedException quando typ não é refresh', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        email: 'gabriel@salomar.com',
        typ: 'access',
      })

      await expect(service.rotateRefresh('access-as-refresh')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('lança UnauthorizedException quando o refresh já foi revogado', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        email: 'gabriel@salomar.com',
        typ: 'refresh',
      })
      prisma.refreshToken.findFirst.mockResolvedValue(null)

      await expect(service.rotateRefresh('old-refresh')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('revoga o refresh antigo e emite um novo par', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        email: 'gabriel@salomar.com',
        typ: 'refresh',
      })
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-old',
        expiresAt: new Date(Date.now() + 60_000),
        user: { email: 'gabriel@salomar.com', role: 'cliente', sessionVersion: 0, anonymizedAt: null },
      })
      prisma.refreshToken.update.mockResolvedValue({})
      jwt.signAsync
        .mockResolvedValueOnce('access-new')
        .mockResolvedValueOnce('refresh-new')
      jwt.decode.mockReturnValue({ exp: 1_900_000_000 })
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' })

      const result = await service.rotateRefresh('old-refresh')

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-old' },
        data: { revokedAt: expect.any(Date) },
      })
      expect(result).toEqual({
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
      })
    })
  })

  describe('verifyAccess', () => {
    const dbUser = {
      id: 'u1',
      email: 'gabriel@salomar.com',
      role: 'admin',
      sessionVersion: 2,
      anonymizedAt: null,
    }

    it('aceita token de acesso da versão de sessão atual e usa o papel do banco', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', typ: 'access', sv: 2, role: 'cliente' })
      prisma.user.findUnique.mockResolvedValue(dbUser)

      await expect(service.verifyAccess('t')).resolves.toEqual({
        id: 'u1',
        email: 'gabriel@salomar.com',
        role: 'admin',
      })
    })

    it('recusa token emitido antes do logout ou da troca de senha', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', typ: 'access', sv: 1 })
      prisma.user.findUnique.mockResolvedValue(dbUser)

      await expect(service.verifyAccess('t')).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('recusa conta anonimizada', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', typ: 'access', sv: 2 })
      prisma.user.findUnique.mockResolvedValue({ ...dbUser, anonymizedAt: new Date() })

      await expect(service.verifyAccess('t')).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('recusa refresh token usado como token de acesso', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', typ: 'refresh', sv: 2 })

      await expect(service.verifyAccess('t')).rejects.toBeInstanceOf(UnauthorizedException)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('revokeAll', () => {
    it('incrementa a versão de sessão e revoga os refresh tokens abertos', async () => {
      await service.revokeAll('u1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { sessionVersion: { increment: 1 } },
      })
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }),
      )
    })
  })
})
