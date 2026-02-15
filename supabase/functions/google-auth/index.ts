import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Real Refresh Call
async function refreshGoogleToken(refreshToken: string) {
    const params = new URLSearchParams();
    params.append('client_id', Deno.env.get('GOOGLE_CLIENT_ID') ?? '');
    params.append('client_secret', Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '');
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    console.log('🔄 Refreshing Google Token...');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Failed to refresh token at Google', err);
        throw new Error('Failed to refresh token at Google');
    }
    return await res.json();
}


// --- The Smart Wrapper (fetchWithGoogleAuth) ---
async function fetchWithGoogleAuth(businessId: string, url: string, options: RequestInit = {}) {
    // Admin client to access 'business_secrets'
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch Secrets from Vault
    const { data: secret, error } = await supabaseAdmin
        .from('business_secrets')
        .select('*')
        .eq('business_id', businessId)
        .single();

    if (error || !secret) {
        console.error('No secrets found for:', businessId, error);
        throw new Error('No Google credentials found for this business.');
    }

    let accessToken = secret.google_access_token;
    let driveFolderId = secret.google_drive_folder_id;
    const expiry = new Date(secret.google_token_expiry);
    const now = new Date();

    // 2. Check Expiry (Buffer: 5 minutes)
    // If no expiry is stored, we assume it's expired to force refresh (safer)
    if (!expiry || now.getTime() > expiry.getTime() - 5 * 60 * 1000) {
        console.log(`⏳ Token expiring/expired for ${businessId}, refreshing...`);

        try {
            if (!secret.google_refresh_token) throw new Error('No refresh token available');

            const newTokens = await refreshGoogleToken(secret.google_refresh_token);

            // Update Vault
            const updatePayload: any = {
                google_access_token: newTokens.access_token,
                // Google doesn't always return a new refresh token, but if it does, save it
                updated_at: new Date().toISOString()
            };

            if (newTokens.refresh_token) {
                updatePayload.google_refresh_token = newTokens.refresh_token;
            }

            if (newTokens.expires_in) {
                updatePayload.google_token_expiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
            }

            await supabaseAdmin
                .from('business_secrets')
                .update(updatePayload)
                .eq('business_id', businessId);

            accessToken = newTokens.access_token;
            console.log('✅ Token refreshed successfully');

        } catch (refreshError) {
            console.error('Refresh failed, revoking connection:', refreshError);
            // Failsafe: Mark as disconnected so UI shows error
            await supabaseAdmin.from('businesses').update({ is_google_connected: false }).eq('id', businessId);
            throw new Error('Google connection expired. Please reconnect.');
        }
    }

    // 3. Execute Request
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    // 4. Handle 401 (Race Condition Retry) - Simple implementation
    if (response.status === 401) {
        console.warn('Got 401 despite valid check. This might be a race condition or revoked token.');
        // In a full implementation, we might Force Refresh here.
    }

    return response;
}

// --- Helper for Folder Hierarchy ---
async function getUploadFolderId(businessId: string, rootFolderId: string, date: Date) {
    const year = date.getFullYear().toString();

    // Search for Year Folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${year}' and '${rootFolderId}' in parents and trashed=false`)}`;

    const res = await fetchWithGoogleAuth(businessId, searchUrl);
    const data = await res.json();

    let yearFolderId;

    if (data.files && data.files.length > 0) {
        yearFolderId = data.files[0].id;
    } else {
        // Create Year Folder
        const createRes = await fetchWithGoogleAuth(businessId, 'https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: year,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [rootFolderId]
            })
        });
        const createData = await createRes.json();
        yearFolderId = createData.id;
        console.log(`📂 Created Year Folder: ${year}`);
    }

    return yearFolderId;
}

// --- Helper: Ensure Root Folder Exists (Self-Healing) ---
async function ensureRootFolder(businessId: string, supabaseAdmin: any) {
    // 1. Check DB first
    const { data: secret } = await supabaseAdmin
        .from('business_secrets')
        .select('google_drive_folder_id')
        .eq('business_id', businessId)
        .single();

    if (secret?.google_drive_folder_id) {
        console.log('📁 Root folder ID found in DB:', secret.google_drive_folder_id);
        return secret.google_drive_folder_id;
    }

    console.log('⚠️ Root folder ID missing in DB. Searching in Drive...');

    // 2. Search in Drive
    const folderName = '📂 icaffeOS Data (Do Not Delete)';
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`)}`;

    let rootFolderId;
    const res = await fetchWithGoogleAuth(businessId, searchUrl);

    // Handle API errors
    if (!res.ok) {
        const errData = await res.json();
        console.error('❌ Google Drive search failed:', errData);
        throw new Error(`Google Drive API Error: ${errData.error?.message || res.statusText}`);
    }

    const data = await res.json();

    if (data.files && data.files.length > 0) {
        rootFolderId = data.files[0].id;
        console.log('✅ Found existing Root Folder in Drive:', rootFolderId);
    } else {
        console.log('⚠️ Root Folder not found in Drive. Creating new one...');
        const createRes = await fetchWithGoogleAuth(businessId, 'https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        // Handle creation errors
        if (!createRes.ok) {
            const errData = await createRes.json();
            console.error('❌ Google Drive folder creation failed:', errData);
            throw new Error(`Failed to create folder: ${errData.error?.message || createRes.statusText}`);
        }

        const createData = await createRes.json();
        rootFolderId = createData.id;
        console.log('✅ Created new Root Folder:', rootFolderId);
    }

    // 3. Update DB
    if (rootFolderId) {
        await supabaseAdmin
            .from('business_secrets')
            .update({ google_drive_folder_id: rootFolderId })
            .eq('business_id', businessId);
        console.log('💾 Saved Root Folder ID to DB');
    }

    return rootFolderId;
}


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS })
    }

    try {
        // 1. Read body
        const { action, code, business_id: bodyBusinessId, user_email: bodyEmail, file_base64, filename, folder_type, target_email, role } = await req.json()

        // 2. Auth Check (Supabase User or Manual Context)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()

        let actingBusinessId = bodyBusinessId;
        if (user) {
            const { data: employeeData } = await supabaseClient
                .from('employees')
                .select('business_id, email')
                .eq('email', user.email)
                .single();
            if (employeeData) actingBusinessId = employeeData.business_id;
        }

        if (!actingBusinessId) {
            return new Response(JSON.stringify({ error: 'Unauthorized: No valid business context.' }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // Google OAuth Configuration
        const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!;

        // --- ACTION: GET URL ---
        if (action === 'get_url') {
            const SCOPES = [
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/business.manage",
                "https://www.googleapis.com/auth/gmail.send"
            ].join(' ');

            console.log('Building Google Auth URL with:', {
                redirect_uri: GOOGLE_REDIRECT_URI,
                client_id: GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
                prompt: 'select_account'
            });

            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', SCOPES);
            authUrl.searchParams.set('access_type', 'offline');
            authUrl.searchParams.set('prompt', 'select_account'); // Fixed: allow account selection
            authUrl.searchParams.set('state', 'icaffeos-auth');

            return new Response(JSON.stringify({ url: authUrl.toString() }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --- ACTION: EXCHANGE ---
        if (action === 'exchange') {
            if (!code) throw new Error('No code provided');

            console.log('🔄 Exchanging code for tokens...');

            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    grant_type: 'authorization_code',
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);

            console.log('✅ Tokens received. Creating root folder...');

            // Create Root Folder
            let folderId = null;
            try {
                const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: '📂 icaffeOS Data (Do Not Delete)',
                        mimeType: 'application/vnd.google-apps.folder'
                    })
                });

                if (createFolderRes.ok) {
                    const folderData = await createFolderRes.json();
                    folderId = folderData.id;
                }
            } catch (e) {
                console.error('Folder creation failed', e);
            }

            // Save to VAULT (business_secrets)
            const insertPayload: any = {
                business_id: actingBusinessId,
                google_access_token: tokenData.access_token,
                google_refresh_token: tokenData.refresh_token, // Critical!
                google_token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                google_drive_folder_id: folderId
            };

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Upsert secrets
            const { error: limitError } = await supabaseAdmin
                .from('business_secrets')
                .upsert(insertPayload);

            if (limitError) throw limitError;

            // Update public flag
            await supabaseAdmin
                .from('businesses')
                .update({ is_google_connected: true })
                .eq('id', actingBusinessId);

            return new Response(JSON.stringify({ success: true, folderId }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --- ACTION: UPLOAD_FILE ---
        if (action === 'upload_file') {
            if (!file_base64 || !filename) throw new Error('Missing file data');

            // 1. Get Root Folder ID from Secrets (Self-Healing)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // This function handles DB lookup, Drive search, and Creation if needed!
            const rootFolderId = await ensureRootFolder(actingBusinessId, supabaseAdmin);

            if (!rootFolderId) throw new Error('Failed to resolve Root Folder ID');

            // 2. Get/Create Target Hierarchy (Year folder)
            const targetFolderId = await getUploadFolderId(actingBusinessId, rootFolderId, new Date());

            console.log(`🚀 Uploading ${filename} to folder ${targetFolderId}...`);

            // 3. Upload File (Simple Multipart)
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = {
                name: filename,
                parents: [targetFolderId]
            };

            // Using fetchWithGoogleAuth to automatically handle token refresh!
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/pdf\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                file_base64 +
                close_delim;

            const uploadRes = await fetchWithGoogleAuth(actingBusinessId, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(`Upload failed: ${errText}`);
            }

            const uploadData = await uploadRes.json();
            console.log('✅ Upload success:', uploadData.id);

            return new Response(JSON.stringify({ success: true, fileId: uploadData.id }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --- ACTION: SHARE_FOLDER (Accountant Access) ---
        if (action === 'share_folder') {
            if (!target_email) throw new Error('Missing target_email');

            // 1. Get Root Folder ID (Self-Healing)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            const rootFolderId = await ensureRootFolder(actingBusinessId, supabaseAdmin);
            if (!rootFolderId) throw new Error('Failed to resolve Root Folder ID');

            console.log(`🤝 Sharing folder ${rootFolderId} with ${target_email} (${role})...`);

            // 2. Call Google Permissions API
            // Note: We use sendNotificationEmail=true to ensure the accountant gets an email.
            const shareUrl = `https://www.googleapis.com/drive/v3/files/${rootFolderId}/permissions?sendNotificationEmail=true`;

            const shareBody = {
                role: role || 'reader',
                type: 'user',
                emailAddress: target_email
            };

            const shareRes = await fetchWithGoogleAuth(actingBusinessId, shareUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shareBody)
            });

            const shareData = await shareRes.json();

            if (!shareRes.ok) {
                // If permission already exists, Google might return 200 or 400 depending on exact state, but generally upserts.
                // If it creates a new one, we get 200.
                throw new Error(`Share failed: ${shareData.error?.message || JSON.stringify(shareData)}`);
            }

            console.log('✅ Share success:', shareData.id);

            // TODO: In the future, we might want to list existing permissions here.

            return new Response(JSON.stringify({ success: true, permissionId: shareData.id }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --- ACTION: BACKUP_ORDERS (Export all orders to JSON) ---
        if (action === 'backup_orders') {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            console.log(`📦 Starting orders backup for business ${actingBusinessId}...`);

            // 1. Fetch all orders with items
            const { data: orders, error: ordersError } = await supabaseAdmin
                .from('orders')
                .select(`
                    *,
                    order_items (*)
                `)
                .eq('business_id', actingBusinessId)
                .order('created_at', { ascending: false });

            if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`);

            console.log(`📊 Found ${orders?.length || 0} orders`);

            // 2. Get Root Folder and create backup structure
            const rootFolderId = await ensureRootFolder(actingBusinessId, supabaseAdmin);
            if (!rootFolderId) throw new Error('Failed to resolve Root Folder ID');

            // 3. Create JSON content
            const backupData = {
                export_date: new Date().toISOString(),
                business_id: actingBusinessId,
                total_orders: orders?.length || 0,
                orders: orders || []
            };

            const jsonContent = JSON.stringify(backupData, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

            // 4. Upload to Drive
            const now = new Date();
            const filename = `orders_backup_${now.toISOString().split('T')[0]}.json`;

            const targetFolderId = await getUploadFolderId(actingBusinessId, rootFolderId, now);

            const boundary = '-------314159265358979323846';
            const metadata = {
                name: filename,
                mimeType: 'application/json',
                parents: [targetFolderId]
            };

            const multipartBody =
                `--${boundary}\r\n` +
                `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
                `${JSON.stringify(metadata)}\r\n` +
                `--${boundary}\r\n` +
                `Content-Type: application/json\r\n` +
                `Content-Transfer-Encoding: base64\r\n\r\n` +
                `${base64Content}\r\n` +
                `--${boundary}--`;

            const uploadRes = await fetchWithGoogleAuth(actingBusinessId, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
                body: multipartBody
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(`Upload failed: ${errData.error?.message || uploadRes.statusText}`);
            }

            const uploadData = await uploadRes.json();
            console.log('✅ Backup uploaded:', uploadData.id);

            return new Response(JSON.stringify({
                success: true,
                fileId: uploadData.id,
                ordersCount: orders?.length || 0,
                filename
            }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
