import React, { createContext, useContext, useState } from 'react';
import { ICaffeSDK, AbraManifesto } from '../types/AbraTypes';

interface AbraHatContextType {
    isWearingHat: boolean; // Are we in sandbox mode?
    currentSpell: AbraManifesto | null;
    sdk: ICaffeSDK; // The Magic SDK (mocked if wearing hat)
    wearHat: (spell: AbraManifesto) => void;
    takeOffHat: () => void;
}

const AbraHatContext = createContext<AbraHatContextType | undefined>(undefined);

export const AbraHatProvider: React.FC<{ children: React.ReactNode, realSDK: ICaffeSDK }> = ({ children, realSDK }) => {
    const [currentSpell, setCurrentSpell] = useState<AbraManifesto | null>(null);
    const [mockSDK, setMockSDK] = useState<ICaffeSDK | null>(null);

    const wearHat = (spell: AbraManifesto) => {
        // Gates (V-003): Manager+ required for Sandbox (8)
        realSDK.auth.identify().then(profile => {
            if (profile.access_level < 8) {
                console.error(`🚫 Spell Refused: [${profile.name}] lacks magical rank (${profile.access_level} < 8)`);
                return;
            }
            console.log('🎩 Putting on the Abra Hat:', spell.spell_id);
            setCurrentSpell(spell);
            setMockSDK(realSDK);
        });
    };

    const takeOffHat = () => {
        console.log('🎩 Taking off the Abra Hat');
        setCurrentSpell(null);
        setMockSDK(null);
    };

    return (
        <AbraHatContext.Provider value={{
            isWearingHat: !!currentSpell,
            currentSpell,
            sdk: mockSDK || realSDK,
            wearHat,
            takeOffHat
        }}>
            {children}
        </AbraHatContext.Provider>
    );
};

export const useAbraHat = () => {
    const context = useContext(AbraHatContext);
    if (!context) {
        throw new Error('useAbraHat must be used within an AbraHatProvider');
    }
    return context;
};

// Hook to access the SDK (returns real or mock depending on context)
export const useMagicSDK = () => {
    return useAbraHat().sdk;
};
