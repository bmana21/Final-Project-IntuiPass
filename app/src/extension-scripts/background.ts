import { firebaseApp } from "../firebase/firebase-config";

interface TabPasswordState {
  hasActivePasswordField: boolean;
  fieldInfo?: any;
  lastInteraction?: number;
  hasPasswordField: boolean;
}

class BackgroundService {
  private tabStates: Map<number, TabPasswordState> = new Map();

  constructor() {
    this.init();
  }

  private init(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));
  }

  private handleCommand(command: string): void {
  console.log('Command received:', command);
  
  switch (command) {
    case 'open_piano_password':
      this.openPageIfPasswordDetected('navigate_to_page', 'piano_password');
      break;
    case 'open_chess_password':
      this.openPageIfPasswordDetected('navigate_to_page', 'chess_password');
  }
}

private async openPageIfPasswordDetected(action: string, page: string): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.id) {
      console.log('No active tab found');
      return;
    }

    const tabState = this.tabStates.get(activeTab.id);
    
    if (tabState && tabState.hasPasswordField) {
      this.openPage(action, page);
    } else {
      alert('Keyboard shortcut ignored - no password fields detected on this page');
    }
  } catch (error) {
    console.error('Error checking password fields:', error);
  }
}

private openPage(action: string, page: string): void {
  chrome.action.openPopup().then(() => {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: action,
        page: page,
        params: { isCreatingPassword: true }
      });
    }, 100);
  }).catch((error) => {
    console.log('Could not open page:', error);
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/popup/index.html')
    });
  });
}

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    const tabId = sender.tab?.id;
    switch (message.type) {
      case 'getAuthStatus':
        const user = firebaseApp.auth().currentUser;
        sendResponse({
          isLoggedIn: !!user,
          userData: user ? {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          } : null
        });
        return true;
      case 'signOut':
        firebaseApp.auth().signOut()
          .then(() => {
            console.log("Background: User signed out successfully");
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error("Background: Sign out failed:", error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      case 'PASSWORD_FIELD_CLICKED':
      case 'PASSWORD_FIELD_FOCUSED':
        if (tabId) {
          this.updateTabState(tabId, {
            hasActivePasswordField: true,
            fieldInfo: message.fieldInfo,
            lastInteraction: Date.now()
          });

          chrome.action.setIcon({
            path: {
              "16": "/assets/main-icon-highlighted.png",
              "32": "/assets/main-icon-highlighted.png",
              "48": "/assets/main-icon-highlighted.png",
              "128": "/assets/main-icon-highlighted.png"
            },
            tabId: tabId
          });
        }
        break;

      case 'PASSWORD_FIELDS_DETECTED':
        if (tabId && message.fieldCount) {

          this.updateTabState(tabId, {hasPasswordField: true});

          chrome.action.setIcon({
            path: {
              "16": "/assets/main-icon-highlighted.png",
              "32": "/assets/main-icon-highlighted.png",
              "48": "/assets/main-icon-highlighted.png",
              "128": "/assets/main-icon-highlighted.png"
            },
            tabId: tabId
          });
        }
        break;

      case 'PASSWORD_FIELDS_CLEARED':
        if (tabId) {
          chrome.action.setBadgeText({
            text: '',
            tabId: tabId
          });
        }
        break;

      case 'GET_TAB_PASSWORD_STATE':
        if (tabId) {
          const state = this.tabStates.get(tabId);
          sendResponse(state || { hasActivePasswordField: false });
        } else {
          sendResponse({ hasActivePasswordField: false });
        }
        return true;
      case "GET_CURRENT_TAB_URL":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab && tab.url) {
            try {
              const url = new URL(tab.url);
              sendResponse({ hostname: url.hostname });
            } catch (_err) {
              sendResponse({ error: "Invalid URL" });
            }
          } else {
            sendResponse({ error: "No active tab" });
          }
        });
        return true;
      default:
        return false;
    }

    return true;
  }

  private updateTabState(tabId: number, state: Partial<TabPasswordState>): void {
    const currentState = this.tabStates.get(tabId) || { hasActivePasswordField: false, hasPasswordField: false };
    this.tabStates.set(tabId, { ...currentState, ...state });
  }

  private handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo): void {
    if (changeInfo.status === 'loading') {
      this.tabStates.delete(tabId);
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }

  private handleTabRemoved(tabId: number): void {
    this.tabStates.delete(tabId);
  }

  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.id) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['extension-scripts/content-script.js']
      });
    } catch (error) {
      console.log('Content script might already be injected or failed to inject');
    }
  }
}

new BackgroundService();