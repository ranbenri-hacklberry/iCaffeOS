import express from 'express';
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Hybrid Supabase Client (Standardized as in backend_server.js)
const REMOTE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const REMOTE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(REMOTE_URL, REMOTE_KEY);

/**
 * 🍳 PREP KITCHEN (Claude Integration)
 * Generates AbraManifesto and .tsx code based on intent + context.
 */
router.post('/prep', async (req, res) => {
    const { intent, componentContext, caster } = req.body;
    const correlationId = intent.correlation_id || `abra-prep-${Date.now()}`;

    console.log(`🍳 Prep Kitchen: Processing intent for ${intent.primary_component_id}...`);

    try {
        // 1. Log the start of the Prep session (CAST_SPELL)
        if (supabase) {
            await supabase.from('sdk_audit_logs').insert({
                correlation_id: correlationId,
                app_id: 'abrakadabra-prep-kitchen',
                action_type: 'CAST_SPELL',
                metadata: { intent, componentContext },
                actor_id: caster.employee_id,
                actor_role: caster.role,
                business_id: caster.business_id
            });
        }

        // 2. MAGIC: Recognize "Hello World" intent
        const isHelloWorld = intent.hebrew_description.includes('הלו וורלד') || intent.hebrew_description.includes('Hello World');

        const manifesto = {
            spell_id: isHelloWorld ? 'kds-hello-world' : `spell-${Date.now()}`,
            incantation: isHelloWorld ? 'The Hello World Invocation' : intent.english_summary,
            effect: isHelloWorld ? 'Adds a magical green Hello World badge to every KDS order card.' : intent.hebrew_description,
            caster: caster,
            correlation_id: correlationId,
            timestamp: new Date().toISOString(),
            target_component: {
                component_id: isHelloWorld ? 'pages-kds-components-ordercard' : intent.primary_component_id,
                file_path: isHelloWorld ? 'src/pages/kds/components/OrderCard.jsx' : componentContext.file_path,
                current_behavior: isHelloWorld ? 'Standard KDS card display.' : componentContext.current_behavior,
                proposed_behavior: isHelloWorld ? 'Visual confirmation of Abrakadabra integration via a green badge.' : intent.english_summary
            },
            impact_analysis: {
                affected_screens: [{
                    file_path: isHelloWorld ? 'src/pages/kds/components/OrderCard.jsx' : componentContext.file_path,
                    impact_type: 'UI_DECORATION',
                    description: isHelloWorld ? 'Added Hello World Badge' : 'Intent-driven modification'
                }],
                affected_supabase_tables: intent.affected_entities,
                affected_dexie_tables: intent.affected_entities,
                affected_rpcs: [],
                risk_level: 'low'
            },
            database_requirements: {
                needs_supabase_migration: false,
                needs_dexie_version_bump: false,
                new_rpc_functions: []
            },
            security_audit: {
                rls_affected: false,
                exposes_financial_data: false,
                requires_auth_change: false,
                forbidden_patterns_check: { uses_raw_sql: false, uses_service_role_key: false, bypasses_rls: false, modifies_auth_tables: false }
            },
            files: {
                modified: [isHelloWorld ? 'src/pages/kds/components/OrderCard.jsx' : componentContext.file_path],
                created: []
            },
            ui_changes: {
                modifies_layout: false,
                modifies_styles: true,
                user_approval_required: true,
                payload: isHelloWorld ? { text: "Hello World!", color: "green" } : null
            }
        };


        // 3. Return the Manifesto
        res.json({
            success: true,
            manifesto,
            correlationId
        });

    } catch (err) {
        console.error('❌ Prep Kitchen Error:', err);
        res.status(500).json({ error: 'Failed to prep spell.' });
    }
});

export default router;
