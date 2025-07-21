import React, { useState, createContext, useContext } from 'react';

export type Page = 'login' | 'password_mode_selection' | 'password_type_selection' | 'connect_the_dots' | 'pattern_lock' | 'color_sequence' | 'piano_password' | 'chess_password' | 'math_formula';

interface RouteParams {
  [key: string]: any;
}

interface NavigationContextType {
  currentPage: Page;
  currentParams: RouteParams | null;
  navigateTo: (page: Page, params?: RouteParams) => void;
  goBack: () => void;
  canGoBack: boolean;
  getRouteParams: () => RouteParams | null;
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

interface PageHistoryItem {
  page: Page;
  params: RouteParams | null;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentParams, setCurrentParams] = useState<RouteParams | null>(null);
  const [pageHistory, setPageHistory] = useState<PageHistoryItem[]>([
    { page: 'login', params: null }
  ]);

  const navigateTo = (page: Page, params?: RouteParams) => {
    const newParams = params || null;
    setCurrentPage(page);
    setCurrentParams(newParams);
    setPageHistory(prev => [...prev, { page, params: newParams }]);
  };

  const goBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = pageHistory.slice(0, -1);
      const previousItem = newHistory[newHistory.length - 1];
      
      setPageHistory(newHistory);
      setCurrentPage(previousItem.page);
      setCurrentParams(previousItem.params);
    }
  };

  const getRouteParams = () => {
    return currentParams;
  };

  const value: NavigationContextType = {
    currentPage,
    currentParams,
    navigateTo,
    goBack,
    canGoBack: pageHistory.length > 1,
    getRouteParams
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