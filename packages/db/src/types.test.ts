import type {
  LayoutHistory,
  LayoutTrigger,
  NewLayoutHistory,
  NewOrganization,
  NewTenantConfig,
  NewUser,
  NewUserPreference,
  Organization,
  TenantConfig,
  TenantPlan,
  User,
  UserPreference,
  UserRole,
} from './types'

describe('@novasphere/db types', () => {
  it('defines the expected user role union', () => {
    const roles: UserRole[] = ['admin', 'ceo', 'engineer', 'viewer']
    expect(roles).toHaveLength(4)
  })

  it('defines the expected tenant plan union', () => {
    const plans: TenantPlan[] = ['free', 'pro', 'enterprise']
    expect(plans).toHaveLength(3)
  })

  it('defines the expected layout trigger union', () => {
    const triggers: LayoutTrigger[] = [
      'user_message',
      'anomaly',
      'role_load',
      'data_change',
    ]
    expect(triggers).toHaveLength(4)
  })

  it('allows constructing typed entities from plain objects', () => {
    const newUser: NewUser = {
      email: 'demo@example.com',
    }

    const newOrganization: NewOrganization = {
      name: 'Demo Org',
    }

    const newTenantConfig: NewTenantConfig = {
      organizationId: 'org_1',
      slug: 'demo',
      plan: 'pro',
    }

    const newPreference: NewUserPreference = {
      userId: 'user_1',
    }

    const newLayoutHistory: NewLayoutHistory = {
      userId: 'user_1',
      tenantId: 'tenant_1',
      trigger: 'user_message',
      layoutJson: '{}',
    }

    // These assignments are intentionally unused at runtime – they ensure
    // that the inferred types remain structurally sound as the schema evolves.
    const _user: User | null = null
    const _org: Organization | null = null
    const _tenant: TenantConfig | null = null
    const _pref: UserPreference | null = null
    const _history: LayoutHistory | null = null

    expect(newUser.email).toBe('demo@example.com')
    expect(newOrganization.name).toBe('Demo Org')
    expect(newTenantConfig.slug).toBe('demo')
    expect(newPreference.userId).toBe('user_1')
    expect(newLayoutHistory.trigger).toBe('user_message')
    expect(_user).toBeNull()
    expect(_org).toBeNull()
    expect(_tenant).toBeNull()
    expect(_pref).toBeNull()
    expect(_history).toBeNull()
  })
})
