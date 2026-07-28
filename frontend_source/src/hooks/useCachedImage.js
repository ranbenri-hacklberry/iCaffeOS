import { useState, useEffect } from 'react';
import { getCachedImageURL } from '@/services/imageSyncService';
import { getActiveEndpoint } from '../services/networkResolver';

/**
 * Hook to automatically provide a local object URL if an image is cached in Dexie.
 * Falls back to the original URL if not cached or offline.
 */
export const normalizeImageUrl = (url) => {
    if (!url) return null;
    
    let host = 'localhost';
    if (typeof window !== 'undefined') {
        if (window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            host = window.location.hostname;
        } else {
            const activeEndpoint = getActiveEndpoint();
            host = activeEndpoint.replace(/https?:\/\//, '').split(':')[0];
        }
    }

    if (url.startsWith('/')) {
        return `http://${host}:8081${url}`;
    }

    if (url.includes(':54321')) {
        return url.replace(/http:\/\/[^\/]+:54321/g, `http://${host}:54321`);
    }
    if (url.includes(':4028')) {
        return url.replace(/http:\/\/[^\/]+:4028/g, `http://${host}:4028`);
    }
    if (url.includes(':8081')) {
        return url.replace(/http:\/\/[^\/]+:8081/g, `http://${host}:8081`);
    }
    
    return url;
};

export const useCachedImage = (originalUrl) => {
    const normalized = normalizeImageUrl(originalUrl);
    const [displayUrl, setDisplayUrl] = useState(normalized);
    const [isCached, setIsCached] = useState(false);

    useEffect(() => {
        const norm = normalizeImageUrl(originalUrl);
        if (!norm) {
            setDisplayUrl(null);
            return;
        }

        let objectUrl = null;

        const checkCache = async () => {
            try {
                const localUrl = await getCachedImageURL(norm);
                if (localUrl) {
                    objectUrl = localUrl;
                    setDisplayUrl(localUrl);
                    setIsCached(true);
                } else {
                    setDisplayUrl(norm);
                    setIsCached(false);
                }
            } catch (err) {
                console.warn('Failed to check image cache:', err);
                setDisplayUrl(norm);
            }
        };

        checkCache();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [originalUrl]);

    return { displayUrl, isCached };
};

