import React, { useState, createContext, useContext } from 'react';

export type Page = 'main' | 'connect_the_dots' | 'pattern_lock' | 'color_sequence';

interface NavigationContextType {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [pageHistory, setPageHistory] = useState<Page[]>(['main']);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    setPageHistory(prev => [...prev, page]);
  };

  const goBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = pageHistory.slice(0, -1);
      setPageHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    }
  };

  const value: NavigationContextType = {
    currentPage,
    navigateTo,
    goBack,
    canGoBack: pageHistory.length > 1
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

interface AppRouterProps {
  children: React.ReactNode;
}

const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <div className="app-router">
        {children}
      </div>
    </NavigationProvider>
  );
};

export default AppRouter;