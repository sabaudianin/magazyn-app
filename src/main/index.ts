import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDb } from './db/connection'
import { runMigrations } from './db/runner'
import { registerAllHandlers } from './ipc'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  runMigrations(getDb())
  registerAllHandlers()

  // TEMP smoke test zadania 7 - do usunięcia po weryfikacji
  ;(async () => {
    const kontrahenciSvc = await import('./services/kontrahenciService')
    const dokumentySvc = await import('./services/dokumentyService')
    const { generateKartaPrzyjecia } = await import('./services/pdf/kartaPrzyjecia')
    const { generateKartaWydania } = await import('./services/pdf/kartaWydania')
    const { getKartaPdfPath, savePdfBytes } = await import('./services/pdf/pdfStorage')

    const nadawca = kontrahenciSvc.createKontrahent({
      nazwa: 'Zakłady Mięsne "Żubrówka" Sp. z o.o.',
      ulica: 'ul. Świętokrzyska 15/3',
      kodPocztowy: '00-001',
      miejscowosc: 'Wrocław',
      kraj: 'Polska',
      nip: '123-456-32-18',
      telefon: '+48 71 123 45 67',
      email: 'biuro@zubrowka.pl',
      uwagi: null
    })
    const odbiorca = kontrahenciSvc.createKontrahent({
      nazwa: 'Hurtownia Spożywcza Ćwikła i Wąs S.A.',
      ulica: 'Aleja Żołnierzy Łódzkich 9',
      kodPocztowy: '90-001',
      miejscowosc: 'Łódź',
      kraj: 'Polska',
      nip: '987-654-32-10',
      telefon: null,
      email: null,
      uwagi: null
    })

    const dokument = dokumentySvc.createDokument({
      typ: 'PZ',
      data: '2026-03-15',
      nadawcaId: nadawca.id,
      odbiorcaId: odbiorca.id,
      dokumentyTowarzyszace: 'List przewozowy CMR nr 998877, dołączona faktura VAT nr FV/22/2026',
      pozycje: [
        { opis: 'Żarówki LED E27, karton zbiorczy', ilosc: 240, jednostka: 'szt', waga: 96.5 },
        {
          opis: 'Śruby ocynkowane M8x40 z łbem sześciokątnym',
          ilosc: 12,
          jednostka: 'kg',
          waga: 12
        },
        { opis: 'Węże ogrodowe zbrojone 3/4", zwoje po 50m', ilosc: 8, jednostka: 'szt', waga: 64 }
      ]
    })
    console.log('SMOKE7 dokument.numer:', dokument.numer)

    const kartaBytes = await generateKartaPrzyjecia(dokument)
    const kartaPath = getKartaPdfPath(dokument)
    savePdfBytes(kartaPath, kartaBytes)
    console.log('SMOKE7 karta przyjęcia zapisana:', kartaPath, kartaBytes.length, 'bajtów')

    const wydaniaBytes = await generateKartaWydania(dokument)
    const wydaniaPath = kartaPath.replace('.pdf', '-wydanie.pdf')
    savePdfBytes(wydaniaPath, wydaniaBytes)
    console.log('SMOKE7 karta wydania zapisana:', wydaniaPath, wydaniaBytes.length, 'bajtów')
  })().catch((err) => console.error('SMOKE7 error:', err))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
