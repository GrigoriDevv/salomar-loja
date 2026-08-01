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
    },
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
        user: { email: 'gabriel@salomar.com', role: 'cliente' },
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
})
