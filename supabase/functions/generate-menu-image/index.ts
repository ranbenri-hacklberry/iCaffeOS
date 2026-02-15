import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { itemName, seedHint, businessId } = await req.json()

        if (!itemName) {
            return new Response(JSON.stringify({ error: 'itemName is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
        if (!GOOGLE_API_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Build prompt
        const name = itemName.toLowerCase()
        const isLarge = name.includes('גדול') || name.includes('כפול')

        // Detect type
        const isCoffee = ['קפה', 'אספרסו', 'הפוך', 'קפוצ', 'לאטה', 'מוקה'].some(k => name.includes(k))
        const isColdDrink = ['קר', 'אייס', 'מיץ', 'לימונדה'].some(k => name.includes(k))
        const isSalad = name.includes('סלט')
        const isPastry = ['מאפה', 'קרואסון', 'דניש', 'עוגה'].some(k => name.includes(k))
        const isSandwich = ['כריך', 'טוסט', 'באגט', 'טורטייה'].some(k => name.includes(k))

        let presentation = ''
        if (isCoffee) {
            presentation = `A high-quality WHITE disposable paper coffee cup. ${isLarge ? 'Larger size' : 'Regular size'}. Rich foam with art. Clean minimalist look.`
        } else if (isColdDrink) {
            presentation = `A professional CLEAR transparent disposable plastic cup with ice cubes and condensation.`
        } else if (isSalad) {
            presentation = `A rustic BROWN KRAFT PAPER round disposable salad bowl. Fresh vibrant ingredients visible.`
        } else if (isSandwich || isPastry) {
            presentation = `The item is served on natural BROWN greaseproof wrapping paper. Professional artisanal presentation.`
        } else {
            presentation = `Professional disposable boutique cafe packaging.`
        }

        // Add seed hint if provided
        const seedPart = seedHint ? `Container style: ${seedHint}. ` : ''

        const backgroundStyle = `
      Background: A breathtaking, extremely blurred (bokeh) panoramic vista of the Jordan Valley desert. 
      Distant desert mountains, soft golden sunrise light. 
      Composition: THE ITEM IS PERFECTLY CENTERED AND FILLS 75-80% OF THE FRAME. 
      Focus: SHARP BOLD FOCUS ON THE FOOD/DRINK. 
      Aesthetic: "Desert Edge" boutique cafe style. Professional product photography.
    `

        const prompt = `Item: ${itemName}. ${seedPart}${presentation} ${backgroundStyle} 4k high-resolution.`

        console.log('Generating image with prompt:', prompt)

        // Generate image with Gemini
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-image-preview",
            generationConfig: { responseModalities: ["image", "text"] }
        })

        const result = await model.generateContent(prompt)
        const response = await result.response

        // Extract image from response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data
                const mimeType = part.inlineData.mimeType || 'image/png'

                // Upload to Supabase Storage
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL')!,
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                )

                const filename = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('Photos')
                    .upload(`menu-ai/${filename}`, Uint8Array.from(atob(imageData), c => c.charCodeAt(0)), {
                        contentType: mimeType,
                        upsert: true
                    })

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    // Return base64 as fallback
                    return new Response(JSON.stringify({
                        success: true,
                        imageUrl: `data:${mimeType};base64,${imageData}`,
                        source: 'base64'
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('Photos')
                    .getPublicUrl(`menu-ai/${filename}`)

                return new Response(JSON.stringify({
                    success: true,
                    imageUrl: publicUrl,
                    source: 'storage'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        return new Response(JSON.stringify({ error: 'No image generated' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
