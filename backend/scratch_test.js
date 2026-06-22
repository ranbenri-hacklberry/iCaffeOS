import { LocalAssetScanner } from './localAssetScanner.js';
import { AudioPlayer } from './services/audioPlayer.js';
import { parseFile } from 'music-metadata';
import path from 'path';

async function runTest() {
    console.log("=== TEST 1: Album Grouping & Cover Art ===");
    const testFolder = "/Volumes/RANTUNES/Chef (Original Motion Picture Soundtrack)";
    
    const scanner = new LocalAssetScanner(testFolder);
    const result = await scanner.scan();
    
    console.log(`\nScanned Folder: ${testFolder}`);
    console.log(`Found ${result.albums.length} Albums.`);
    
    if (result.albums.length === 1) {
        console.log(`✅ SUCCESS: Grouped into EXACTLY ONE album: "${result.albums[0].name}"`);
    } else {
        console.log(`❌ FAILURE: Split into ${result.albums.length} albums!`);
        result.albums.forEach(a => console.log(`   - ${a.name} (Artist: ${a.artist_name})`));
    }
    
    console.log(`Found ${result.songs.length} Songs.`);
    
    // Test Cover Art Extraction
    if (result.songs.length > 0) {
        try {
            const firstSongOptions = result.songs[0].file_path;
            const metadata = await parseFile(firstSongOptions);
            const cover = metadata.common.picture?.[0];
            if (cover) {
                console.log(`✅ SUCCESS: Found embedded cover art! Format: ${cover.format}, Size: ${cover.data.length} bytes`);
            } else {
                console.log(`❌ FAILURE: No embedded cover art found in ${path.basename(firstSongOptions)}`);
            }
        } catch(e) {
            console.log(`❌ ERROR reading cover art: ${e.message}`);
        }
    }

    console.log("\n=== TEST 2: AudioPlayer & Turntable State ===");
    if (result.songs.length > 0) {
        const player = new AudioPlayer();
        const testSong = result.songs[0].file_path;
        
        let stateChanged = false;
        player.on('stateChange', () => {
            stateChanged = true;
            const state = player.getState();
            console.log(`✅ SUCCESS: Player stateChange fired. isPlaying = ${state.isPlaying}`);
            if (state.isPlaying) {
                console.log("   --> TURNTABLE WILL SPIN!");
                player.stop(); // Clean up
            }
        });
        
        console.log(`Attempting to play: ${path.basename(testSong)}`);
        await player.play(testSong, 0);
        
        // Wait a tiny bit for the player to start and emit
        await new Promise(r => setTimeout(r, 1000));
        if (!stateChanged) {
            console.log("❌ FAILURE: Player did not emit stateChange event!");
        }
    }
}

runTest().catch(console.error);
