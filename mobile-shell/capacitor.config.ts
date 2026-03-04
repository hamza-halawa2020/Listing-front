import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const browserBuildDir = '../dist/careandshare/browser';
const fallbackBuildDir = '../dist/careandshare';

const config: CapacitorConfig = {
  appId: 'com.careandshare.mobile',
  appName: 'Care & Share',
  webDir: existsSync(resolve(__dirname, browserBuildDir))
    ? browserBuildDir
    : fallbackBuildDir,
  bundledWebRuntime: false,
};

export default config;
