import React from 'react';
import AppRouter from './components/AppRouter';
import Route from './components/Route';
import Login from './pages/login/Login';
import PasswordModeSelection from './pages/password_mode_select/PasswordModeSelection';
import Popup from './pages/popup/Popup';
import ConnectTheDots from './pages/connect_the_dots/ConnectTheDots';

const App: React.FC = () => {
  return (
    <AppRouter>
      <div id="root">
        <Route path="login" component={Login} />
        <Route path="password_mode_selection" component={PasswordModeSelection} />
        <Route path="password_type_selection" component={Popup} />
        <Route path="connect_the_dots" component={ConnectTheDots} />
      </div>
    </AppRouter>
  );
};

export default App;