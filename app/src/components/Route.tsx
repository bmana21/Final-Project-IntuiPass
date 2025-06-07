import React from 'react';
import { useNavigation, Page } from './AppRouter';

interface RouteProps {
  path: Page;
  component: React.ComponentType<any>;
  props?: any;
}

const Route: React.FC<RouteProps> = ({ path, component: Component, props = {} }) => {
  const { currentPage } = useNavigation();
  
  if (currentPage !== path) {
    return null;
  }

  return <Component {...props} />;
};

export default Route;