import {UserPatternService} from "./firestore-service.ts";
import {DomManager} from "./dom_manager.ts";
import {encrypt} from "./encryption.ts";
import {PatternType} from "../models/pattern-type.ts";
import {firebaseApp} from "../firebase/firebase-config.ts";

export class PasswordIntegrationService {
    private userPatternService: UserPatternService | undefined;
    private domManager: DomManager | undefined;

    constructor() {
        this.init();
    }

    private init(): void {
        this.userPatternService = new UserPatternService();
        this.domManager = new DomManager();
    }

    public async processPassword(key: string, patternType: PatternType, save: boolean, username: string): Promise<boolean> {
        if (this.domManager == undefined || this.userPatternService == undefined) {
            return false;
        }
        try {
            const user_uuid: string | undefined = firebaseApp.auth().currentUser?.uid;
            if (!user_uuid) {
                console.log("User not authenticated");
                return false;
            }
            const website_url: string = await this.domManager.getWebsiteURL();

            const [result, password] = await encrypt(key, user_uuid, username, patternType, website_url);
            if (save && !await this.userPatternService.addUserPatternData(result)) {
                console.log("Failed to add user pattern data");
                return false;
            }
            await this.domManager.fillPassword(password);
            await this.domManager.fillUsername(username);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}