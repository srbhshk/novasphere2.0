import { expect, test } from '@playwright/test'

async function signIn(
  page: import('@playwright/test').Page,
  email: string,
): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openCopilot(page: import('@playwright/test').Page): Promise<void> {
  await page
    .getByRole('button', { name: /open copilot|nova/i })
    .first()
    .click()
  await expect(page.getByRole('textbox', { name: /message/i })).toBeVisible()
}

test('copilot supports multiple rounds of interaction (multi-turn)', async ({ page }) => {
  await signIn(page, 'eng@demo.com')
  await openCopilot(page)

  const input = page.getByRole('textbox', { name: /message/i })
  const send = page.getByRole('button', { name: /send/i })

  const m1 = 'Explain the top anomaly and refine the dashboard layout.'
  await input.fill(m1)
  await send.click()
  await expect(page.getByText(m1, { exact: true })).toBeVisible()

  // Wait for the turn to settle (input unlocked) before the next message.
  await expect(input).not.toBeDisabled({ timeout: 60_000 })

  const m2 = 'Update this for a board meeting.'
  await input.fill(m2)
  await send.click()
  await expect(page.getByText(m2, { exact: true })).toBeVisible()
  await expect(input).not.toBeDisabled({ timeout: 60_000 })

  const m3 = 'Now focus only on reliability risks for the next 24 hours.'
  await input.fill(m3)
  await send.click()
  await expect(page.getByText(m3, { exact: true })).toBeVisible()
  await expect(input).not.toBeDisabled({ timeout: 60_000 })
})
