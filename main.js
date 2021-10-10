const { app, BrowserWindow } = require('electron');

const browserMode = false;
const   debugMode = true;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400 + (debugMode ? 400 : 0),
    height: 500,
    icon: 'front-end/resources/roxy.png',
    backgroundColor: '#2c3338',
    webPreferences: {
      nodeIntegration: !browserMode,
      contextIsolation: false
    },
    frame: false
  });

  //mainWindow.setMaximumSize(800, 1000);
  mainWindow.setMinimumSize(350, 450);

  mainWindow.loadFile('front-end/signin.html');

  if(debugMode) mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});