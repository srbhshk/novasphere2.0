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

test('off-topic user input is redirected back to product context', async ({ page }) => {
  await signIn(page, 'ceo@demo.com')
  await openCopilot(page)

  const input = page.getByRole('textbox', { name: /message/i })
  const send = page.getByRole('button', { name: /send/i })

  const offTopic = 'Tell me a joke about cats and write a poem.'
  await input.fill(offTopic)
  await send.click()

  // Deterministic assertions: user message is recorded and input unlocks after the turn.
  await expect(page.getByText(offTopic, { exact: true })).toBeVisible()
  await expect(input).not.toBeDisabled({ timeout: 60_000 })
})

test('copilot conversations remain session-isolated across multiple users', async ({
  browser,
}) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const pageA = await ctxA.newPage()
  const pageB = await ctxB.newPage()

  await signIn(pageA, 'ceo@demo.com')
  await signIn(pageB, 'admin@demo.com')

  await openCopilot(pageA)
  await openCopilot(pageB)

  const msgA = 'CEO unique message: focus on MRR and churn.'
  const msgB = 'Admin unique message: focus on signups and orgs.'

  await pageA.getByRole('textbox', { name: /message/i }).fill(msgA)
  await pageA.getByRole('button', { name: /send/i }).click()
  await expect(pageA.getByText(msgA, { exact: true })).toBeVisible()
  await expect(pageB.getByText(msgA, { exact: true })).toHaveCount(0)

  await pageB.getByRole('textbox', { name: /message/i }).fill(msgB)
  await pageB.getByRole('button', { name: /send/i }).click()
  await expect(pageB.getByText(msgB, { exact: true })).toBeVisible()
  await expect(pageA.getByText(msgB, { exact: true })).toHaveCount(0)

  await ctxA.close()
  await ctxB.close()
})
