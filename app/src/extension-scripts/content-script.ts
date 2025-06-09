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

interface UsernameFieldInfo {
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
  priority: number;
}

class PasswordFieldDetector {
  private activePasswordField: HTMLInputElement | null = null;
  private passwordFields: HTMLInputElement[] = [];
  private usernameFields: HTMLInputElement[] = [];
  private activeUsernameField: HTMLInputElement | null = null;

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
    this.detectUsernameFields();
    this.observeDOM();
    this.attachEventListeners();
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    this.updateBadgeOnLoad();
  }

  private updateBadgeOnLoad(): void {
    setTimeout(() => {
      this.detectPasswordFields();
      this.detectUsernameFields();
      if (this.passwordFields.length > 0) {
        chrome.runtime.sendMessage({
          type: 'PASSWORD_FIELDS_DETECTED',
          fieldCount: this.passwordFields.length,
          usernameFieldCount: this.usernameFields.length
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

  private detectUsernameFields(): void {
    const textInputs = document.querySelectorAll('input:not([type]), input[type="text"], input[type="email"], input[type="search"]') as NodeListOf<HTMLInputElement>;
    const candidates: Array<{field: HTMLInputElement, priority: number}> = [];

    Array.from(textInputs).forEach(input => {
      const priority = this.getUsernameFieldPriority(input);
      if (priority > 0) {
        candidates.push({ field: input, priority });
      }
    });

    candidates.sort((a, b) => b.priority - a.priority);

    const usernameCandidate = candidates.find(c => this.isUsernameField(c.field));
    const emailCandidate = candidates.find(c => this.isEmailField(c.field));

    if (usernameCandidate) {
      this.usernameFields = [usernameCandidate.field];
      this.activeUsernameField = usernameCandidate.field;
    } else if (emailCandidate) {
      this.usernameFields = [emailCandidate.field];
      this.activeUsernameField = emailCandidate.field;
    } else if (candidates.length > 0) {
      this.usernameFields = [candidates[0].field];
      this.activeUsernameField = candidates[0].field;
    } else {
      this.usernameFields = [];
      this.activeUsernameField = null;
    }
  }

  private getUsernameFieldPriority(input: HTMLInputElement): number {
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const className = input.className?.toLowerCase() || '';
    const type = input.type?.toLowerCase() || '';

    const allText = `${name} ${id} ${placeholder} ${className}`;

    const highPriorityKeywords = [
      'username', 'user', 'userid', 'login', 'handle', 'nickname', 'screenname',
      'user_name', 'user-id', 'user_id', 'loginid', 'login_id', 'userlogin',
      'accountname', 'membername', 'profile', 'uname'
    ];
    const mediumPriorityKeywords = [
      'email', 'e-mail', 'gmail', 'mail', 'emailaddress', 'email_address',
      'email-id', 'emailid', 'email_input', 'useremail', 'e_address'
    ];
    const lowPriorityKeywords = [
      'account', 'identifier', 'clientid', 'customerid', 'usercode', 'memberid',
      'contact', 'loginname', 'authid', 'personid', 'usernumber'
    ];

    let priority = 0;

    if (highPriorityKeywords.some(keyword => allText.includes(keyword))) {
      priority += 100;
    }

    if (mediumPriorityKeywords.some(keyword => allText.includes(keyword))) {
      priority += 50;
    }

    if (lowPriorityKeywords.some(keyword => allText.includes(keyword))) {
      priority += 25;
    }

    if (type === 'email') {
      priority += 30;
    }

    const form = input.closest('form');
    if (form) {
      const passwordFieldsInForm = form.querySelectorAll('input[type="password"]');
      if (passwordFieldsInForm.length > 0) {
        const textFieldsInForm = form.querySelectorAll('input[type="text"], input[type="email"]');
        if (textFieldsInForm[0] === input) {
          priority += 20;
        }
      }
    }

    return priority;
  }

  private isUsernameField(input: HTMLInputElement): boolean {
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const className = input.className?.toLowerCase() || '';

    const allText = `${name} ${id} ${placeholder} ${className}`;
    const usernameKeywords = [
      'username', 'user', 'userid', 'user_id', 'user-id', 'user_name', 'user-name',
      'login', 'loginid', 'login_id', 'login-name', 'handle', 'nickname',
      'screenname', 'membername', 'accountname', 'uname', 'profile', 'signin'
    ];

    return usernameKeywords.some(keyword => allText.includes(keyword));
  }

  private isEmailField(input: HTMLInputElement): boolean {
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const className = input.className?.toLowerCase() || '';
    const type = input.type?.toLowerCase() || '';

    const allText = `${name} ${id} ${placeholder} ${className}`;
    const emailKeywords = [
      'email', 'e-mail', 'gmail', 'mail', 'emailaddress', 'email_address',
      'email-id', 'emailid', 'email_input', 'useremail', 'e_address',
      'emailField', 'emailAddr', 'emailentry', 'contactemail'
    ];

    return type === 'email' || emailKeywords.some(keyword => allText.includes(keyword));
  }

  private readUsernameValue(): string | null {
    if (this.activeUsernameField?.value) {
      return this.activeUsernameField.value;
    }

    this.detectUsernameFields();

    if (this.activeUsernameField?.value) {
      return this.activeUsernameField.value;
    }

    return this.activeUsernameField ? '' : null;
  }

  private fillUsernameField(username: string): boolean {
    if (!this.activeUsernameField) {
      this.detectUsernameFields();
    }

    if (this.activeUsernameField) {
      return this.fillSingleUsernameField(this.activeUsernameField, username);
    }

    return false;
  }

  private fillSingleUsernameField(field: HTMLInputElement, username: string): boolean {
    try {
      field.value = '';

      field.focus();

      field.value = username;

      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      const keyupEvent = new KeyboardEvent('keyup', { bubbles: true });
      const blurEvent = new Event('blur', { bubbles: true });

      field.dispatchEvent(inputEvent);
      field.dispatchEvent(changeEvent);
      field.dispatchEvent(keyupEvent);
      field.dispatchEvent(blurEvent);

      this.showFieldFeedback(field, 0);

      return true;
    } catch (error) {
      console.error('Error filling username field:', error);
      return false;
    }
  }

  private getSerializableUsernameFieldInfo(field: HTMLInputElement): UsernameFieldInfo {
    const rect = field.getBoundingClientRect();
    const form = field.closest('form');
    const priority = this.getUsernameFieldPriority(field);

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
      fieldId: field.id || `username-field-${Date.now()}`,
      fieldType: field.type,
      placeholder: field.placeholder || undefined,
      priority: priority
    };
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
      } else if (this.isUsernameFieldElement(target)) {
        this.activeUsernameField = target as HTMLInputElement;
      }
    });
  }

  private isUsernameFieldElement(element: HTMLElement): boolean {
    if (!(element instanceof HTMLInputElement)) return false;
    return this.usernameFields.includes(element);
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
              const newTextFields = element.querySelectorAll('input[type="text"], input[type="email"]') as NodeListOf<HTMLInputElement>;
              if (newPasswordFields.length > 0 || newTextFields.length > 0) {
                shouldRedetect = true;
              }
            }
          });
        }
      });

      if (shouldRedetect) {
        setTimeout(() => {
          const oldPasswordCount = this.passwordFields.length;
          const oldUsernameCount = this.usernameFields.length;
          this.detectPasswordFields();
          this.detectUsernameFields();

          if (this.passwordFields.length !== oldPasswordCount || this.usernameFields.length !== oldUsernameCount) {
            chrome.runtime.sendMessage({
              type: 'PASSWORD_FIELDS_DETECTED',
              fieldCount: this.passwordFields.length,
              usernameFieldCount: this.usernameFields.length
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

      case 'GET_ACTIVE_USERNAME_FIELD':
        if (this.activeUsernameField) {
          sendResponse({
            success: true,
            fieldInfo: this.getSerializableUsernameFieldInfo(this.activeUsernameField)
          });
        } else {
          sendResponse({ success: false, message: 'No active username field' });
        }
        return true;

      case 'READ_USERNAME':
        {
          const username = this.readUsernameValue();
        if (username !== null) {
          sendResponse({
            success: true,
            username: username,
            fieldInfo: this.activeUsernameField ? this.getSerializableUsernameFieldInfo(this.activeUsernameField) : null
          });
        } else {
          sendResponse({ success: false, message: 'No username field found or username is empty' });
        }
        return true; }

      case 'FILL_USERNAME':
        if (message.username) {
          const filled = this.fillUsernameField(message.username);
          sendResponse({
            success: filled,
            message: filled ? 'Username filled successfully' : 'Failed to fill username',
            fieldInfo: this.activeUsernameField ? this.getSerializableUsernameFieldInfo(this.activeUsernameField) : null
          });
        } else {
          sendResponse({ success: false, message: 'No username provided' });
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
        { const allFields = this.passwordFields.map(field => this.getSerializableFieldInfo(field));
        sendResponse({ success: true, fields: allFields });
        return true; }

      case 'GET_ALL_USERNAME_FIELDS':
        { const allUsernameFields = this.usernameFields.map(field => this.getSerializableUsernameFieldInfo(field));
        sendResponse({ success: true, fields: allUsernameFields });
        return true; }

      case 'DETECT_PASSWORD_FIELDS':
        { this.detectPasswordFields();
        this.detectUsernameFields();
        const fields = this.passwordFields.map((field, index) => ({
          id: field.id || `field-${index}`,
          name: field.name || `field-${index}`,
          type: field.type === 'password' ? 'password' : 'text-password',
          placeholder: field.placeholder || 'Password field'
        }));

        const usernameFields = this.usernameFields.map((field, index) => ({
          id: field.id || `username-field-${index}`,
          name: field.name || `username-field-${index}`,
          type: field.type,
          placeholder: field.placeholder || 'Username field',
          priority: this.getUsernameFieldPriority(field)
        }));

        sendResponse({
          passwordFields: fields,
          usernameFields: usernameFields,
          passwordCount: fields.length,
          usernameCount: usernameFields.length
        });
        return true; }
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