const { BrowserWindow, app, ipcMain } = require('electron');

'use strict';

const debugMode = process.argv.includes('--debug') || process.argv.includes('-d');

var mainWindow;
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000 + (debugMode ? 400 : 0),
        height: 600,
        icon: 'front-end/resources/roxy.png',
        backgroundColor: '#2c3338',
        webPreferences: {
            nodeIntegration : true,
            contextIsolation: false
        },
        frame: false
    });

    //mainWindow.setMaximumSize(800, 1000);
    mainWindow.setMinimumSize(350, 450);

    mainWindow.loadFile('front-end/signin.html');

    if(debugMode) mainWindow.webContents.openDevTools();
}

ipcMain.on('setWindowPosition', (event, args) => {
    mainWindow.setPosition(args[0], args[1]);

    event.returnValue = null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const { log } = require('electron-log');

function sendToRenderer(channel, args) {
    mainWindow.webContents.send(channel, args);

    if(!debugMode) return;

    log.info(`Message sent to renderer on channel '${channel}' args: `);
    log.info(args);
}

//
// autoUpdater setup
//

const { autoUpdater } = require('electron-updater');

if (debugMode)
    autoUpdater.logger = log;

autoUpdater.autoDownload = false;
autoUpdater.setFeedURL({
    provider: "github",
    owner   : "iLikeTrioxin",
    repo    : "MigurdiaClient"
});

autoUpdater.on('update-not-available', (info) => { sendToRenderer("update-not-available", info); });
autoUpdater.on('checking-for-update' , (    ) => { sendToRenderer("checking-for-update" , null); });
autoUpdater.on('download-progress'   , (info) => { sendToRenderer('download-progress'   , info); });
autoUpdater.on('update-downloaded'   , (info) => { sendToRenderer('update-downloaded'   , info); });
autoUpdater.on('update-available'    , (info) => { sendToRenderer('update-available'    , info); });
autoUpdater.on('error'               , (info) => { sendToRenderer('update-error'        , info); });

ipcMain.on('update-quitAndInstall', (event) => {
    autoUpdater.quitAndInstall(true, true);

    event.returnValue = null;
});

ipcMain.on('update-download', (event) => {
    autoUpdater.downloadUpdate();
    
    event.returnValue = null;
});

ipcMain.on('check', (event) => {
    autoUpdater.checkForUpdatesAndNotify();

    event.returnValue = null;
});

