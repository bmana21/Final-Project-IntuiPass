import React from "react";
// @ts-ignore
import "./QrCodeDisplay.css"
import {useNavigation} from "../../components/AppRouter.tsx";

const QrCodeDisplay: React.FC = () => {
    // @ts-ignore
    const {goBack} = useNavigation();
    return (
        <h2>Hello</h2>
    )
}

export default QrCodeDisplay;