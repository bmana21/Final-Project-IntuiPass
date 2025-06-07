interface PasswordFieldInfo {
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
    x: number;
    y: number;
  };
  formId?: string;
  fieldName?: string;
  fieldId?: string;
  fieldType: string;
  placeholder?: string;
}

class PasswordFieldDetector {
  private activePasswordField: HTMLInputElement | null = null;
  private passwordFields: HTMLInputElement[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupDetection();
      });
    } else {
      this.setupDetection();
    }
  }

  private setupDetection(): void {
    this.detectPasswordFields();
    this.observeDOM();
    this.attachEventListeners();
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    this.updateBadgeOnLoad();
  }

  private updateBadgeOnLoad(): void {
    setTimeout(() => {
      this.detectPasswordFields();
      
      if (this.passwordFields.length > 0) {
        chrome.runtime.sendMessage({
          type: 'PASSWORD_FIELDS_DETECTED',
          fieldCount: this.passwordFields.length
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'PASSWORD_FIELDS_CLEARED'
        });
      }
    }, 1000);
  }

  private detectPasswordFields(): void {
    const passwordInputs = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
    this.passwordFields = Array.from(passwordInputs);
    
    const potentialPasswordInputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
    potentialPasswordInputs.forEach(input => {
      if (this.isPotentialPasswordField(input)) {
        this.passwordFields.push(input);
      }
    });
  }

  private isPotentialPasswordField(input: HTMLInputElement): boolean {
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const className = input.className?.toLowerCase() || '';
    
    const passwordKeywords = ['password', 'pass', 'pwd', 'secret', 'pin', 'passphrase'];
    const allText = `${name} ${id} ${placeholder} ${className}`;
    
    return passwordKeywords.some(keyword => allText.includes(keyword));
  }

  private attachEventListeners(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (this.isPasswordField(target)) {
        this.handlePasswordFieldClick(target as HTMLInputElement);
      }
    });

    document.addEventListener('focus', (event) => {
      const target = event.target as HTMLElement;
      if (this.isPasswordField(target)) {
        this.handlePasswordFieldFocus(target as HTMLInputElement);
      }
    }, true);

    document.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (this.isPasswordField(target)) {
        this.activePasswordField = target as HTMLInputElement;
      }
    });
  }

  private isPasswordField(element: HTMLElement): boolean {
    if (!(element instanceof HTMLInputElement)) return false;
    
    return element.type === 'password' || 
           this.passwordFields.includes(element);
  }

  private handlePasswordFieldClick(field: HTMLInputElement): void {
    this.activePasswordField = field;
    
    chrome.runtime.sendMessage({
      type: 'PASSWORD_FIELD_CLICKED',
      fieldInfo: this.getSerializableFieldInfo(field)
    });
  }

  private handlePasswordFieldFocus(field: HTMLInputElement): void {
    this.activePasswordField = field;
    
    chrome.runtime.sendMessage({
      type: 'PASSWORD_FIELD_FOCUSED',
      fieldInfo: this.getSerializableFieldInfo(field)
    });
  }

  private getSerializableFieldInfo(field: HTMLInputElement): PasswordFieldInfo {
    const rect = field.getBoundingClientRect();
    const form = field.closest('form');
    
    return {
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        x: rect.x,
        y: rect.y
      },
      formId: form?.id || undefined,
      fieldName: field.name || field.id || undefined,
      fieldId: field.id || `field-${Date.now()}`,
      fieldType: field.type,
      placeholder: field.placeholder || undefined
    };
  }

  private observeDOM(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const newPasswordFields = element.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
              if (newPasswordFields.length > 0) {
                shouldRedetect = true;
              }
            }
          });
        }
      });
      
      if (shouldRedetect) {
        setTimeout(() => {
          const oldCount = this.passwordFields.length;
          this.detectPasswordFields();
          
          if (this.passwordFields.length !== oldCount) {
            chrome.runtime.sendMessage({
              type: 'PASSWORD_FIELDS_DETECTED',
              fieldCount: this.passwordFields.length
            });
          }
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private handleMessage(message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean {
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true, message: 'Content script ready' });
        return true;
        
      case 'GET_ACTIVE_PASSWORD_FIELD':
        if (this.activePasswordField) {
          sendResponse({
            success: true,
            fieldInfo: this.getSerializableFieldInfo(this.activePasswordField)
          });
        } else {
          sendResponse({ success: false, message: 'No active password field' });
        }
        return true;
        
      case 'FILL_PASSWORD':
        if (message.password) {
          const filledCount = this.fillAllPasswordFields(message.password);
          sendResponse({ 
            success: filledCount > 0, 
            message: `Filled ${filledCount} password field(s)`,
            fieldsCount: filledCount
          });
        } else {
          sendResponse({ success: false, message: 'No password provided' });
        }
        return true;
        
      case 'GET_ALL_PASSWORD_FIELDS':
        const allFields = this.passwordFields.map(field => this.getSerializableFieldInfo(field));
        sendResponse({ success: true, fields: allFields });
        return true;

      case 'DETECT_PASSWORD_FIELDS':
        this.detectPasswordFields();
        const fields = this.passwordFields.map((field, index) => ({
          id: field.id || `field-${index}`,
          name: field.name || `field-${index}`,
          type: field.type === 'password' ? 'password' : 'text-password',
          placeholder: field.placeholder || 'Password field'
        }));
        sendResponse({ 
          fields,
          totalCount: fields.length 
        });
        return true;
    }
    
    return false;
  }

  private fillAllPasswordFields(password: string): number {
    let filledCount = 0;
    
    this.detectPasswordFields();
    
    this.passwordFields.forEach((field, index) => {
      if (this.fillSinglePasswordField(field, password, index)) {
        filledCount++;
      }
    });
    
    return filledCount;
  }

  private fillSinglePasswordField(field: HTMLInputElement, password: string, index: number = 0): boolean {
    try {
      field.value = '';
      
      field.focus();
      
      field.value = password;
      
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      const keyupEvent = new KeyboardEvent('keyup', { bubbles: true });
      
      field.dispatchEvent(inputEvent);
      field.dispatchEvent(changeEvent);
      field.dispatchEvent(keyupEvent);
      
      this.showFieldFeedback(field, index);
      
      return true;
    } catch (error) {
      console.error('Error filling password field:', error);
      return false;
    }
  }

  private showFieldFeedback(field: HTMLInputElement, index: number): void {
    const originalStyle = field.style.border;
    const originalBackground = field.style.backgroundColor;
    
    setTimeout(() => {
      field.style.border = '2px solid #4CAF50';
      
      setTimeout(() => {
        field.style.border = originalStyle;
        field.style.backgroundColor = originalBackground;
      }, 1000);
    }, index * 200);
  }
}

new PasswordFieldDetector();