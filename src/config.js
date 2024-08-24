import fs from 'fs';
import path from 'path';
import { app } from 'electron'; 

const resourcePath = app.isPackaged ? process.resourcesPath : path.join(import.meta.dirname, '..');
const configPath = path.join(resourcePath, 'config.json')

export function getConfig() {
    if(!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}, null, 4));
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}