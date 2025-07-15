import React from 'react';
import {useNavigation} from "../../components/AppRouter.tsx";

const PasswordManager: React.FC = () => {
    // @ts-ignore
    const { _navigateTo, _getRouteParams, goBack } = useNavigation();

    return (
        <div className="popup-container">
            <div className="header">
                <button className="back-button" onClick={goBack}>
                    ← Back
                </button>
            </div>
        </div>
    );
}

export default PasswordManager;