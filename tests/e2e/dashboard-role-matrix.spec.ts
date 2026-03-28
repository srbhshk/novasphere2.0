import { expect, test } from '@playwright/test'

const roleCases = [
  {
    email: 'admin@demo.com',
    heading: 'Total Users',
  },
  {
    email: 'ceo@demo.com',
    heading: 'MRR',
  },
  {
    email: 'eng@demo.com',
    heading: 'API Latency',
  },
] as const

for (const { email, heading } of roleCases) {
  test(`dashboard shows role data for ${email}`, async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('textbox', { name: 'Password' }).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
  })
}

test('copilot opens and message field is usable after CEO sign-in', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill('ceo@demo.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.getByRole('button', { name: /open copilot/i }).click()
  const input = page.getByRole('textbox', { name: /message/i })
  await expect(input).toBeVisible()
  await expect(input).not.toBeDisabled()
})
