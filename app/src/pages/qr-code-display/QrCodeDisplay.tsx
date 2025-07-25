import React from "react";
// @ts-ignore
import "./QrCodeDisplay.css"
import {useNavigation} from "../../components/AppRouter.tsx";

const QrCodeDisplay: React.FC = () => {
    // @ts-ignore
    const {goBack, getRouteParams} = useNavigation();
    const routeParams = getRouteParams();
    const plainTextPassword = routeParams?.plainTextPassword ?? '';

    return (
        <h2>{plainTextPassword}</h2>
    )
}

export default QrCodeDisplay;