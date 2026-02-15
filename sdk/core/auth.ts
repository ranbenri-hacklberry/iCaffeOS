import { AuthInterface, EmployeeProfile } from '../types/index';

export class CoreAuth implements AuthInterface {
    async identify(): Promise<EmployeeProfile> {
        // In a real implementation, this would trigger FaceID/PIN via the host app
        // For now, we return a mock or fetch from a secure store if available
        console.log('[iCaffe Auth] Identifying user...');

        // Mock implementation for the SDK structure
        // This should be replaced with actual bridge calls to the host native layer
        return {
            id: 'mock-user-id',
            name: 'Mock User',
            role: 'staff',
            business_id: 'mock-biz-id',
            permissions: ['read:menu'],
        };
    }
}
