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
        const { itemName, styleHint, businessId } = await req.json()

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

        // Build prompt for ICON
        // Based on user history preference for Cyberpunk/Neon UI Assets
        const baseStyle = styleHint || "Cyberpunk / Neon UI Asset style, glowing edges, dark futuristic background"
        
        const presentation = `
      Type: Mobile App Icon / UI Asset.
      Style: ${baseStyle}. 
      Composition: Centered, clear silhouette, high contrast.
      Quality: 4k high-resolution, vector-like aesthetic, 3D render.
    `

        const prompt = `Create an icon for: ${itemName}. ${presentation}`

        console.log('Generating icon with prompt:', prompt)

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
                // Saving in a different folder for icons: 'menu-icons' or just 'icons'
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL')!,
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                )

                const filename = `icon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('Photos') // Keeping same bucket
                    .upload(`icons/${filename}`, Uint8Array.from(atob(imageData), c => c.charCodeAt(0)), {
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
                    .getPublicUrl(`icons/${filename}`)

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
