import fs from 'fs';
import path from 'path';
import { app } from 'electron'; 

const resourcePath = app.isPackaged ? process.resourcesPath : path.join(import.meta.dirname, '..');
const logPath = path.join(resourcePath, "logs", 'log.txt');

if(!fs.existsSync(logPath)){
    fs.mkdirSync(path.join(resourcePath, "logs"));
    fs.writeFileSync(logPath, '');
}

export function log(message) {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
}

export function error(message) {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ERROR: ${message}\n`);
}

export function readLog() {
    return fs.readFileSync(logPath, 'utf8');
}

export function clearLog() {
    fs.writeFileSync(logPath, '');
}