import { useEffect } from 'react';
import { useNavigation } from '../components/AppRouter';

export const useKeyboardCommands = () => {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    const messageListener = (message: any, _: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.action === 'navigate_to_page') {
        console.log('Navigation command received:', message);
        navigateTo(message.page, message.params);
        sendResponse({ success: true });
      }
    };

    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
    }

    return () => {
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, [navigateTo]);
};