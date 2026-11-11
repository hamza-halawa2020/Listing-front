import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const browserBuildDir = '../dist/AmanMed/browser';
const fallbackBuildDir = '../dist/AmanMed';

const config: CapacitorConfig = {
  appId: 'com.AmanMed.mobile',
  appName: 'Aman-Med',
  webDir: existsSync(resolve(__dirname, browserBuildDir))
    ? browserBuildDir
    : fallbackBuildDir,
  bundledWebRuntime: false,
};

export default config;
