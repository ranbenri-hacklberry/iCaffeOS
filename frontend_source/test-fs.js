const fs = require('fs');
const path = require('path');
const songPath = "/mnt/rantunes/Bob Marley & The Wailers - Gold (2005) [FLAC] 88/CD 2/06. Satisfy Your Soul.flac";
const musicDir = process.env.MUSIC_DIRECTORY || "/mnt/RANTUNES";
const fullPath = path.isAbsolute(songPath) ? songPath : path.join(musicDir, songPath);
console.log("songPath:", songPath);
console.log("fullPath:", fullPath);
console.log("exists?", fs.existsSync(fullPath));
