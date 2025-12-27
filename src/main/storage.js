import path from 'path';
import Storage from 'whistle/lib/rules/storage';
import { BASE_DIR } from './util';

export default new Storage(path.join(BASE_DIR, 'proxy_settings'));
