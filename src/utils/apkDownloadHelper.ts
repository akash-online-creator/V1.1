src/utils/apkDownloadHelper.tsimport { db } from '../lib/firebase';

import { doc, getDoc, setDoc } from 'firebase/firestore';

/**

 * APK Direct Download & In-App Update Helper

 * Dynamically resolves the latest release APK from GitHub Releases for Lanka24online

 * Fully integrated with Firebase Firestore for Real-Time Admin On/Off Control.

 */

export const GITHUB_REPO_OWNER = 'akash-online-creator';

export const GITHUB_REPO_NAME = 'Lanka24online';

/**

 * The current version of the installed app.

 */

export const CURRENT_APP_VERSION = 'v1.0';

export const FALLBACK_APK_DIRECT_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest/download/app-release.apk`;

export const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

export interface LatestReleaseInfo {

  tagName?: string;

  apkDownloadUrl: string;

  name?: string;

  publishedAt?: string;

  body?: string;

}

export interface AppUpdateInfo {

  hasUpdate: boolean;

  currentVersion: string;

  latestVersion: string;

  releaseTitle?: string;

  releaseNotes?: string;

  downloadUrl: string;

  publishedAt?: string;

}

export interface AppUpdateSettings {

  enabled: boolean;          // Master On/Off switch controlled by Admin

  showOnWeb: boolean;        // Whether to show on regular web browser (default: false)

  targetVersion?: string;    // Custom latest version override (e.g. 'v1.0.8')

  releaseNotes?: string;     // Custom release notes in Sinhala / English

  downloadUrl?: string;      // Custom APK download URL

  updatedAt?: string;

}

export const DEFAULT_UPDATE_SETTINGS: AppUpdateSettings = {

  enabled: false,           // Default is OFF so users are not interrupted until admin turns it on

  showOnWeb: false,         // Default is OFF on web browser

  targetVersion: 'v1.0.8',

  releaseNotes: 'සහය සේවා නවතම සංස්කරණය (Direct APK Download & Update Support)',

  downloadUrl: FALLBACK_APK_DIRECT_URL,

};

/**

 * Fetches the current admin update settings from Firestore

 */

export async function getAppUpdateSettings(): Promise<AppUpdateSettings> {

  try {

    const docRef = doc(db, 'system_settings', 'app_update');

    const snap = await getDoc(docRef);

    if (snap.exists()) {

      const data = snap.data();

      return {

        enabled: data.enabled !== undefined ? Boolean(data.enabled) : DEFAULT_UPDATE_SETTINGS.enabled,

        showOnWeb: data.showOnWeb !== undefined ? Boolean(data.showOnWeb) : DEFAULT_UPDATE_SETTINGS.showOnWeb,

        targetVersion: data.targetVersion || DEFAULT_UPDATE_SETTINGS.targetVersion,

|---|

        downloadUrl: data.downloadUrl || DEFAULT_UPDATE_SETTINGS.downloadUrl,

        updatedAt: data.updatedAt,

      };

    }

  } catch (err) {

    console.warn('Could not read app_update settings from Firestore, using default:', err);

  }

  return DEFAULT_UPDATE_SETTINGS;

}

/**

 * Saves updated settings to Firestore (Used by Admin Panel)

 */

export async function saveAppUpdateSettings(settings: Partial<AppUpdateSettings>): Promise<void> {

  try {

    const docRef = doc(db, 'system_settings', 'app_update');

    await setDoc(docRef, {

      ...settings,

      updatedAt: new Date().toISOString(),

    }, { merge: true });

  } catch (err) {

    console.error('Failed to save app_update settings to Firestore:', err);

    throw err;

  }

}

/**

 * Compares two semantic version strings or tag names (e.g. 'v1.1' vs 'v1.0')

 * Returns 1 if vA > vB, -1 if vA < vB, 0 if equal

 */

export function compareVersions(vA: string, vB: string): number {

  const cleanA = (vA || '').replace(/^v/i, '').trim();

  const cleanB = (vB || '').replace(/^v/i, '').trim();

  if (!cleanA && !cleanB) return 0;

  if (!cleanA) return -1;

  if (!cleanB) return 1;

  const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);

  const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {

    const numA = partsA[i] || 0;

    const numB = partsB[i] || 0;

    if (numA > numB) return 1;

    if (numA < numB) return -1;

  }

  return 0;

}

/**

 * Fetches the exact direct download URL for the latest APK from GitHub API

 */

export async function fetchLatestApkDownloadUrl(): Promise<LatestReleaseInfo> {

  try {

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`, {

      headers: {

        Accept: 'application/vnd.github.v3+json',

      },

    });

    if (response.ok) {

      const data = await response.json();

      const assets = data.assets || [];

      

      const apkAsset = assets.find((a: any) => a.name && a.name.toLowerCase().endsWith('.apk')) || assets[0];

      

      return {

        tagName: data.tag_name || 'v1.0',

        apkDownloadUrl: apkAsset?.browser_download_url || `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/download/${data.tag_name}/app-release.apk`,

        name: data.name || data.tag_name,

        publishedAt: data.published_at,

        body: data.body || '',

      };

    }

  } catch (err) {

    console.warn('Could not fetch latest release from GitHub API, falling back to direct release download:', err);

  }

  return {

    apkDownloadUrl: FALLBACK_APK_DIRECT_URL,

    tagName: 'v1.0',

  };

}

/**

 * Checks if a newer version of the application is available

 * Honors Admin ON/OFF switch from Firebase Firestore!

 */

export async function checkForAppUpdate(): Promise<AppUpdateInfo> {

  try {

    // 1. Check Admin master switch from Firestore

    const settings = await getAppUpdateSettings();

    if (!settings.enabled) {

      // 🛑 Admin has turned OFF the notification!

      return {

        hasUpdate: false,

        currentVersion: CURRENT_APP_VERSION,

        latestVersion: CURRENT_APP_VERSION,

        downloadUrl: FALLBACK_APK_DIRECT_URL,

      };

    }

    // 2. Check if running on web browser vs installed Android app

    if (typeof window !== 'undefined') {

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||

        (window.navigator as any).standalone === true ||

        navigator.userAgent.includes('SahayaApp') ||

        navigator.userAgent.includes('wv');

      // If user is on a standard web browser and admin disabled web prompt

      if (!isStandalone && !settings.showOnWeb) {

        return {

          hasUpdate: false,

          currentVersion: CURRENT_APP_VERSION,

          latestVersion: CURRENT_APP_VERSION,

          downloadUrl: FALLBACK_APK_DIRECT_URL,

        };

      }

    }

    // 3. Resolve latest version info

    const latest = await fetchLatestApkDownloadUrl();

    const latestTag = settings.targetVersion || latest.tagName || 'v1.0';

    const isNewer = compareVersions(latestTag, CURRENT_APP_VERSION) > 0;

    return {

      hasUpdate: isNewer,

      currentVersion: CURRENT_APP_VERSION,

      latestVersion: latestTag,

      releaseTitle: latest.name || `Sahaya Sewa ${latestTag}`,

      releaseNotes: settings.releaseNotes || latest.body || '',

      downloadUrl: settings.downloadUrl || latest.apkDownloadUrl || FALLBACK_APK_DIRECT_URL,

      publishedAt: latest.publishedAt,

    };

  } catch (err) {

    console.warn('Update check failed:', err);

    return {

      hasUpdate: false,

      currentVersion: CURRENT_APP_VERSION,

      latestVersion: CURRENT_APP_VERSION,

      downloadUrl: FALLBACK_APK_DIRECT_URL,

    };

  }

}

/**

 * Triggers direct APK download in the user's browser/phone

 */

export async function triggerDirectApkDownload(explicitUrl?: string): Promise<void> {

  try {

    const downloadUrl = explicitUrl || (await fetchLatestApkDownloadUrl()).apkDownloadUrl || FALLBACK_APK_DIRECT_URL;

    const link = document.createElement('a');

    link.href = downloadUrl;

    link.setAttribute('download', 'SahayaSewa.apk');

    link.setAttribute('target', '_blank');

    link.setAttribute('rel', 'noopener noreferrer');

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  } catch (err) {

    console.error('APK direct download trigger failed:', err);

    window.location.href = explicitUrl || FALLBACK_APK_DIRECT_URL;

  }

}

