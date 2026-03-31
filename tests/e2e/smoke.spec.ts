import { expect, test } from '@playwright/test'

test('sign in and use copilot smoke flow', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill('ceo@demo.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible()

  await page
    .getByRole('button', { name: /open copilot|nova/i })
    .first()
    .click()
  const prompt = 'Show me what matters most'
  const input = page.getByRole('textbox', { name: /message/i })
  await expect(input).toBeVisible()
  await input.fill(prompt)
  await page.getByRole('button', { name: /send/i }).click()

  await expect(page.getByText(prompt, { exact: true })).toBeVisible()
  await expect(input).not.toBeDisabled({ timeout: 60_000 })
})
