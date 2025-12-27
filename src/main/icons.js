import path from 'path';
import { app } from 'electron';

const RESOURCES_PATH = app.isPackaged
  ? path.join(app.getAppPath(), 'resources')
  : path.join(process.cwd(), 'resources');

export const ICON = path.join(RESOURCES_PATH, 'whistle.png');
export const DOCK_ICON = path.join(RESOURCES_PATH, 'dock.png');
export const TRAY_ICON =
  process.platform === 'darwin' ? path.join(RESOURCES_PATH, 'tray.png') : ICON;
export const UNCHECK_ICON_PATH = path.join(RESOURCES_PATH, 'uncheck.png');
export const CHECKED_ICON_PATH = path.join(RESOURCES_PATH, 'checked.png');
