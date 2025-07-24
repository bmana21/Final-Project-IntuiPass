import React from 'react';
import AppRouter from './components/AppRouter';
import Route from './components/Route';
import Login from './pages/login/Login';
import PasswordModeSelection from './pages/password_mode_select/PasswordModeSelection';
import Popup from './pages/popup/Popup';
import ConnectTheDots from './pages/connect_the_dots/ConnectTheDots';
import PianoPassword from './pages/piano/PianoPassword';
import ChessPassword from './pages/chess/ChessPassword';
import MathFormulaPassword from './pages/mathematical_expression/MathFormulaPassword';
import PixelArt from './pages/pixel_art/PixelArt';
import { InitService } from './services/init-service';
import PasswordManager from './pages/password_manager/PasswordManager';


const App: React.FC = () => {
  InitService.initializeCredentials();

  return (
    <AppRouter>
      <div id="root">
        <Route path="login" component={Login} />
        <Route path="password_mode_selection" component={PasswordModeSelection} />
        <Route path="password_type_selection" component={Popup} />
        <Route path="connect_the_dots" component={ConnectTheDots} />
        <Route path="piano_password" component={PianoPassword} />
        <Route path="password-manager-page" component={PasswordManager} />
        <Route path="chess_password" component={ChessPassword} />
        <Route path="math_formula" component={MathFormulaPassword} />
        <Route path="pixel_art" component={PixelArt} />
      </div>
    </AppRouter>
  );
};

export default App;