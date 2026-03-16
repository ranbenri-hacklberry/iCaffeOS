// Use global fetch
const API_KEY = "AIzaSyBzrKmkf5X50ONyoFGR1WGVgG5mrNJLyj4";

async function testImagen() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;

    // Standard imagen format in Vertex AI typically, but Gemini API might be different. Let's try the standard generateContent
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateContent?key=${API_KEY}`;
    const req = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "A cute dog" }] }]
        })
    });

    const res = await req.json();
    console.log("Response:", JSON.stringify(res, null, 2));
}

async function testGemini3Pro() {
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
    const req = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "A cute dog" }] }]
        })
    });

    const res = await req.json();
    console.log("gemini-2.5-flash-image Response:", JSON.stringify(res, null, 2));
}

async function testGemini31() {
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`;
    const req = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "A cute dog" }] }]
        })
    });

    const res = await req.json();
    console.log("gemini-3.1-flash-image-preview Response:", JSON.stringify(res, null, 2));
}

testGemini31().then(testGemini3Pro).then(testImagen);
