import { expect, test } from '@playwright/test'

test('sign in and use copilot smoke flow', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill('ceo@demo.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Dashboard')).toBeVisible()

  await page
    .getByRole('button', { name: /open copilot|nova/i })
    .first()
    .click()
  await page.getByPlaceholder(/ask nova/i).fill('Show me what matters most')
  await page.getByRole('button', { name: /send/i }).click()

  await expect(page.getByText(/what matters|layout|signal/i).first()).toBeVisible()
})
