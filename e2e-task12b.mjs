import { _electron as electron } from 'playwright'

const app = await electron.launch({ args: ['out/main/index.js'], cwd: process.cwd() })
const win = await app.firstWindow()
await win.waitForLoadState('domcontentloaded')
await win.waitForTimeout(600)

let bodyText = await win.locator('body').innerText()
console.log('--- START PAGE (via reused hooks) ---')
console.log(bodyText)

// Go to Nowy dokument, focus the opis input, then press Ctrl+1 -> should NOT navigate away.
await win.getByRole('link', { name: 'Nowy dokument', exact: true }).click()
await win.waitForTimeout(400)
const opisInput = win.locator('input[name="pozycje.0.opis"]')
await opisInput.click()
await opisInput.fill('Draft niezapisany')
await win.keyboard.down('Control')
await win.keyboard.press('1')
await win.keyboard.up('Control')
await win.waitForTimeout(400)

bodyText = await win.locator('body').innerText()
console.log('--- AFTER Ctrl+1 WHILE TYPING (expect still on Nowy dokument, draft intact) ---')
console.log(bodyText)

// Now blur the field (click on the heading area, not a form control) and press Ctrl+1 -> should navigate.
await win.getByRole('heading', { name: 'Nowy dokument' }).click()
await win.keyboard.down('Control')
await win.keyboard.press('1')
await win.keyboard.up('Control')
await win.waitForTimeout(400)

bodyText = await win.locator('body').innerText()
console.log('--- AFTER Ctrl+1 WITH FOCUS OUTSIDE FORM (expect Start page) ---')
console.log(bodyText)

await app.close()
