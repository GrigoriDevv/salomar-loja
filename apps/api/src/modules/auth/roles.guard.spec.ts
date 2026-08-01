import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from './roles.guard'
import { ROLES_KEY } from './roles.decorators'

function mockContext(user?: { role?: string }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  }
  const guard = new RolesGuard(reflector as unknown as Reflector)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('libera quando a rota não exige roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)

    expect(guard.canActivate(mockContext({ role: 'cliente' }))).toBe(true)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ])
  })

  it('libera quando a role do user está na lista', () => {
    reflector.getAllAndOverride.mockReturnValue(['atendente', 'admin'])

    expect(guard.canActivate(mockContext({ role: 'admin' }))).toBe(true)
  })

  it('lança ForbiddenException quando a role não basta', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin'])

    expect(() => guard.canActivate(mockContext({ role: 'cliente' }))).toThrow(
      ForbiddenException,
    )
  })

  it('lança ForbiddenException quando não há user no request', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin'])

    expect(() => guard.canActivate(mockContext(undefined))).toThrow(ForbiddenException)
  })
})
