import { ConfigService } from './config-service';

export class InitService {
  private static initialized = false;

  static async initializeCredentials(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      
      const existing = await ConfigService.getCredentials();
      
      if (!existing.appKey || !existing.hmacKey) {
        
        await ConfigService.setCredentials(
          '2a406c80-eeae-4c6d-bb5e-e017adb00941',
          'e5f32e89-90d6-4740-b2e9-398ce530fb1e'
        );
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize credentials:', error);
    }
  }

}