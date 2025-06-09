export class DomManager {
  private currentTabId: number | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.getCurrentTab();
    await this.checkForActivePasswordField();
  }

  private async getCurrentTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id || null;
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  private async checkForActivePasswordField(): Promise<void> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return;
    }

    try {
      const tabState = await this.sendMessageWithTimeout(
        chrome.runtime.sendMessage({ type: 'GET_TAB_PASSWORD_STATE' }),
        2000
      );

      if (tabState?.hasActivePasswordField) {
        return;
      }

      await this.ensureContentScriptLoaded();
      
      await this.sendMessageWithTimeout(
        chrome.tabs.sendMessage(this.currentTabId, {
          type: 'GET_ACTIVE_PASSWORD_FIELD'
        }),
        2000
      );
    } catch (error) {
      console.error('Error checking password field:', error);
    }
  }

  private async ensureContentScriptLoaded(): Promise<void> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return;
    }

    try {
      await this.sendMessageWithTimeout(
        chrome.tabs.sendMessage(this.currentTabId, { type: 'PING' }),
        1000
      );
    } catch (error) {
      await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId },
        files: ['extension-scripts/content-script.js']
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async sendMessageWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Message timeout')), timeoutMs)
      )
    ]);
  }

  async getUsername(): Promise<string> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return "";
    }

    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'READ_USERNAME',
      })
      console.log("response:", response);
      return response?.success ? response.username : "";
    } catch (error) {
      console.error('Error reading username:', error);
      return "";
    }
  }

  async fillUsername(username: string): Promise<void> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return;
    }

    try {
      await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'FILL_USERNAME',
        username: username
      });
    } catch (error) {
      console.error('Error filling username:', error);
    }
  }

  async fillPassword(password: string): Promise<void> {
    if (!this.currentTabId) {
      await this.init();
    }
    
    if (!this.currentTabId) {
      return;
    }

    try {
      await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'FILL_PASSWORD',
        password: password
      });
    } catch (error) {
      console.error('Error filling password:', error);
    }
  }

  async getAllPasswordFields(): Promise<any[]> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return [];
    }

    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'GET_ALL_PASSWORD_FIELDS'
      });

      return response?.success ? response.fields : [];
    } catch (error) {
      console.error('Error getting password fields:', error);
      return [];
    }
  }

  async refreshDetection(): Promise<any[]> {
    if (!this.currentTabId) {
      await this.init();
    }

    if (!this.currentTabId) {
      return [];
    }

    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, {
        type: 'detectPasswordFields'
      });

      return response?.fields || [];
    } catch (error) {
      console.error('Error refreshing detection:', error);
      return [];
    }
  }

  async getWebsiteURL(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB_URL" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else if (response?.hostname) {
          resolve(response.hostname);
        } else {
          reject(response?.error || "Unknown error");
        }
      });
    });
  }
}