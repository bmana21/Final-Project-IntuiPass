import React from 'react';
import AppRouter from './components/AppRouter';
import Route from './components/Route';
import Login from './pages/login/Login';
import PasswordModeSelection from './pages/password_mode_select/PasswordModeSelection';
import Popup from './pages/popup/Popup';
import ConnectTheDots from './pages/connect_the_dots/ConnectTheDots';
import PianoPassword from './pages/piano/PianoPassword';
import ChessPassword from './pages/chess/ChessPassword';

const App: React.FC = () => {
  return (
    <AppRouter>
      <div id="root">
        <Route path="login" component={Login} />
        <Route path="password_mode_selection" component={PasswordModeSelection} />
        <Route path="password_type_selection" component={Popup} />
        <Route path="connect_the_dots" component={ConnectTheDots} />
        <Route path="piano_password" component={PianoPassword} />
        <Route path="chess_password" component={ChessPassword} />
      </div>
    </AppRouter>
  );
};

export default App;