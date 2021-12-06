const { BrowserWindow, app, ipcMain, autoUpdater, ipcRenderer } = require('electron');
const { appUpdater                  } = require('electron-updater');
const log = require('electron-log');

const browserMode = false;
const   debugMode = true ;

//autoUpdater.autoDownload = false;
autoUpdater.logger       = log;

autoUpdater.setFeedURL({
    provider: "generic",
    url     : "https://github.com/iLikeTrioxin/MigurdiaClient"
})

autoUpdater.on('update-not-available', () => { 
    console.log("update-not-available");
});
autoUpdater.on('checking-for-update' , () => { 
    console.log("checking-for-update");
 });

autoUpdater.on('update-available', () => {
    console.log("update-available");
    ipcMain.sendSync('update-available');
});

autoUpdater.on('error', () => {
    console.log("error have occured");
});

autoUpdater.on('download-progress', () => {
    console.log("download-progress");
    ipcMain.sendSync('download-progress');
});

autoUpdater.on('update-downloaded', () => {
    console.log("update-downloaded");
    ipcMain.sendSync('update-downloaded');
});

ipcMain.on('check', (event) => {
    console.log("eee");
    autoUpdater.checkForUpdates();
    console.log("aaaaa");

    event.returnValue = null;
});

ipcMain.on('aa', (event) => {
    console.log("nii");

    event.returnValue = null;
});

ipcMain.on('install', (event) => {
    console.log("install");
    autoUpdater.quitAndInstall();

    event.returnValue = null;
});

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

// Event handler for synchronous incoming messages
ipcMain.on('relaunch', (event, arg) => {
    app.relaunch();
 });

 ipcMain.on('relaunch', (event, arg) => {
    appUpdater.checkForUpdatesAndNotify();
 });

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
