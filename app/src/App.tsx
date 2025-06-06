import React from 'react';
import AppRouter from './components/AppRouter';
import Route from './components/Route';
import Popup from './pages/popup/Popup';
import ConnectTheDots from './pages/connect_the_dots/ConnectTheDots';

const App: React.FC = () => {
  return (
    <AppRouter>
      <div id="root">
        <Route path="main" component={Popup} />
        <Route path="connect_the_dots" component={ConnectTheDots} />
      </div>
    </AppRouter>
  );
};

export default App;