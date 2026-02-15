export * from './mockCore';

// Safe Runner Mock
export const runInSandbox = (component: any, context: any) => {
    console.log('[iCaffe Sandbox] Running component in restricted environment...');

    // Create mock SDK
    const mockSDK = createMockSDK(context.initialData);

    // Inject mock SDK into component context or props
    // For sandbox, we might just return the component with injected props
    return {
        ...component,
        sdk: mockSDK
    };
};

import { createMockSDK } from './mockCore';
