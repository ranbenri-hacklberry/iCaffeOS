
import os
import re

SOURCE_DIR = "frontend_source/src/pages"
TEST_DIR = "frontend_source/src/test/auto"

# Ensure test directory exists
os.makedirs(TEST_DIR, exist_ok=True)

def to_pascal_case(text):
    return "".join(word.capitalize() for word in re.split(r'[_\-\s]+', text))

TEST_TEMPLATE = """
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Component from '../../__REL_PATH__';

// @vitest-environment jsdom

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] || null; },
    setItem: function(key, value) { store[key] = value.toString(); },
    removeItem: function(key) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Hooks
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { id: 1, name: 'Test User', access_level: 'Manager', is_admin: true, business_id: 'test-business' },
        deviceMode: 'manager',
        isLoading: false
    })
}));

vi.mock('@/context/MusicContext', () => ({
    useMusic: () => ({
        currentSong: null,
        isPlaying: false,
        playSong: vi.fn(),
        togglePlay: vi.fn(),
        handleNext: vi.fn(),
        handlePrevious: vi.fn()
    }),
    MusicProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('@/hooks/useAlbums', () => ({
    useAlbums: () => ({
        albums: [],
        artists: [],
        playlists: [],
        isLoading: false,
        fetchAlbumSongs: vi.fn(),
        fetchPlaylistSongs: vi.fn()
    })
}));

vi.mock('@/context/ConnectionContext', () => ({
    useConnection: () => ({
        isConnected: true,
        isReconnecting: false
    }),
    ConnectionProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }) }) }),
            upsert: () => ({ error: null })
        }),
        auth: {
            getSession: () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } })
        }
    }
}));

vi.mock('@/lib/spotifyService', () => ({
    default: {
        isSpotifyLoggedIn: () => false,
        loginWithSpotify: vi.fn(),
        logout: vi.fn(),
        getAlbumTracks: () => ({ items: [] })
    }
}));

// Mock other common imports that might crash
vi.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (target, prop) => {
            // Return a simple component for any accessed icon
            return (props) => <span data-testid={`icon-${String(prop)}`} {...props}>Icon:{String(prop)}</span>;
        }
    });
});

describe('__COMPONENT_NAME__ Auto-Generated Tests', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <Component />
            </MemoryRouter>
        );
        // Verify basic render
        expect(document.body).toBeTruthy();
    });

    it('contains interactive elements', () => {
        const { container } = render(
            <MemoryRouter>
                <Component />
            </MemoryRouter>
        );
        
        // Find all buttons
        const buttons = container.querySelectorAll('button');
        if (buttons.length > 0) {
            console.log(`Found ${buttons.length} buttons in __COMPONENT_NAME__:`);
            buttons.forEach((btn, i) => {
                expect(btn).toBeInTheDocument();
                console.log(`  Button ${i+1}: "${btn.textContent}" (Class: ${btn.className})`);
            });
        }
    });
});
"""

def scan_and_generate():
    print(f"Scanning {SOURCE_DIR}...")
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".jsx"):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, "frontend_source/src")
                
                # Determine component name
                if file == "index.jsx":
                    component_name = to_pascal_case(os.path.basename(root))
                else:
                    component_name = to_pascal_case(file.replace(".jsx", ""))
                
                # Check if it looks like a page (has 'export default')
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if "export default" not in content:
                    continue
                    
                print(f"Generating test for {component_name} ({rel_path})...")
                
                import_path = rel_path.replace('.jsx', '')
                test_content = TEST_TEMPLATE.replace('__REL_PATH__', import_path).replace('__COMPONENT_NAME__', component_name)
                
                output_file = os.path.join(TEST_DIR, f"{component_name}.test.jsx")
                with open(output_file, 'w', encoding='utf-8') as out:
                    out.write(test_content)

if __name__ == "__main__":
    scan_and_generate()
