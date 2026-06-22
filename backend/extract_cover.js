import fs from 'fs';
import { parseFile } from 'music-metadata';
import path from 'path';

async function ext() {
    const filePath = "/Volumes/RANTUNES/Chef (Original Motion Picture Soundtrack) 2014 {The.Phoenix}/01.  Pete Rodriguez - I Like It Like That.mp3";
    const outPath = "/tmp/chef_cover.jpg";
    try {
        const metadata = await parseFile(filePath);
        const cover = metadata.common.picture?.[0];
        if (cover) {
            fs.writeFileSync(outPath, cover.data);
            console.log("Extraction successful");
        } else {
            console.log("No cover found");
        }
    } catch(e) {
        console.log("Error extracting cover:", e.message);
    }
}
ext();
