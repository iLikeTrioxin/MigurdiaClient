const { BrowserWindow, app, ipcMain } = require('electron');
const { autoUpdater                 } = require('electron-updater');
const   log                           = require('electron-log');

const browserMode = false;
const   debugMode = true ;

autoUpdater.autoDownload = false;
autoUpdater.logger       = log;

log.info('App starting...');

var mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
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

autoUpdater.setFeedURL({
    provider: "github",
    owner   : "iLikeTrioxin",
    repo    : "MigurdiaClient"
});

autoUpdater.on('update-not-available', (info) => { log.info("up-to-date"         ); });
autoUpdater.on('checking-for-update' , (    ) => { log.info("checking-for-update"); });

autoUpdater.on('error', (err) => {
    log.info("error have occured");
    mainWindow.webContents.send('update-error', err);
});

autoUpdater.on('update-available', (info) => {
    log.info("update available");
    mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info("download progress");
    mainWindow.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info("update downloaded");
    mainWindow.webContents.send('update-downloaded', info);
});

ipcMain.on('update-quitAndInstall', (event) => {
    autoUpdater.quitAndInstall(true, true);

    event.returnValue = null;
});

ipcMain.on('update-download', (event) => {
    autoUpdater.downloadUpdate();
    
    event.returnValue = null;
});

ipcMain.on('check', (event) => {
    log.info("check requested");
    autoUpdater.checkForUpdatesAndNotify();

    event.returnValue = null;
});

ipcMain.on('setWindowPosition', (event, args) => {
    mainWindow.setPosition(args[0], args[1]);

    event.returnValue = null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
