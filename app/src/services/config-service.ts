export class ConfigService {
  private static readonly STORAGE_KEYS = {
    MYSCRIPT_APP_KEY: 'myscript_app_key',
    MYSCRIPT_HMAC_KEY: 'myscript_hmac_key'
  };

  static async setCredentials(appKey: string, hmacKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({
        [this.STORAGE_KEYS.MYSCRIPT_APP_KEY]: appKey,
        [this.STORAGE_KEYS.MYSCRIPT_HMAC_KEY]: hmacKey
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  static async getCredentials(): Promise<{appKey: string, hmacKey: string}> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([
        this.STORAGE_KEYS.MYSCRIPT_APP_KEY,
        this.STORAGE_KEYS.MYSCRIPT_HMAC_KEY
      ], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({
            appKey: result[this.STORAGE_KEYS.MYSCRIPT_APP_KEY] || '',
            hmacKey: result[this.STORAGE_KEYS.MYSCRIPT_HMAC_KEY] || ''
          });
        }
      });
    });
  }
}