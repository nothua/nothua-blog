import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import {log, error, readLog, clearLog} from './logger.js';
import {getConfig, saveConfig} from './config.js';
import { deleteBlog, getBlog, getBlogs, newBlog } from './blogs.js';

let mainWindow;
const __dirname = import.meta.dirname;
const resourcePath = app.isPackaged ? process.resourcesPath : path.join(import.meta.dirname, '..');

app.whenReady().then(async () => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    ipcMain.handle("logger", (event, action, message) => {
        switch(action) {
            case "log":
                log(message);
                break;
            case "error":
                error(message);
                break;
            case "read":
                return readLog();
            case "clear":
                clearLog();
                break;
        }
    });

    ipcMain.handle("config", (event, action, data) => {
        switch(action) {
            case "read":
                return getConfig();
            case "save":
                saveConfig(data);
                break;
        }
    });

    ipcMain.handle("blogs", async (event, action, data) => {
        switch(action) {
            case "read":
                const response = await getBlogs();
                return response;
            case "save":
                return await newBlog(data);
            case "get":
                return await getBlog(data);
            case "delete":
                return await deleteBlog(data);
                

        }
    })
})

app.on("window-all-closed", () => {
    if(process.platform !== "darwin")
        app.quit()
})

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolated: true,
            nodeIntegration: true,
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile(path.join(__dirname, "views", 'index.html')).then(() => {
        log('Window loaded')
    }).catch((err) => {
        error(`Error loading window: ${err.message}`);
        console.log(err)
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
