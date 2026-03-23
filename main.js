const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    fullscreenable: true,
    title: 'Productivity Tracker',
    backgroundColor: '#131313',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // F11 toggles fullscreen
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.on('resize-window', (event, height) => {
  if (mainWindow && !mainWindow.isFullScreen()) {
    mainWindow.setSize(1000, height, true);
  }
});
