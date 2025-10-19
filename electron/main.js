const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

const isDev = process.env.NODE_ENV === 'development'
let mainWindow
let nextServer

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    title: 'نظام إدارة الصالة الرياضية',
  })

  const startURL = 'http://localhost:4001'
  
  mainWindow.loadURL(startURL)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startNextServer() {
  if (isDev) {
    // في وضع التطوير، Next.js شغال بالفعل
    return
  }

  // في production، شغّل Next.js server
  const nextPath = path.join(__dirname, '../node_modules/.bin/next')
  nextServer = spawn(nextPath, ['start'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
  })

  nextServer.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`)
  })

  nextServer.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`)
  })
}

app.whenReady().then(() => {
  startNextServer()
  
  // انتظر Next.js يبدأ
  setTimeout(() => {
    createWindow()
  }, isDev ? 0 : 3000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  if (nextServer) {
    nextServer.kill()
  }
})