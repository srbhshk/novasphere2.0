import { render, screen } from '@testing-library/react'

import NavItem from './NavItem'
import styles from './NavItem.module.css'

const exampleItem = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: 'LayoutGrid',
  href: '/demo/dashboard',
} as const

describe('NavItem', () => {
  it('renders icon and label', () => {
    render(<NavItem item={exampleItem} isActive={false} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('applies active styles when isActive=true', () => {
    render(<NavItem item={exampleItem} isActive />)
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link.className).toContain(styles.active)
  })

  it('renders badge when item.badge is provided', () => {
    render(
      <NavItem
        item={{ ...exampleItem, badge: '3' }}
        isActive={false}
        isCollapsed={false}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
