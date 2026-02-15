# AI Coding Assistant Guidelines & Constraints

## 🛑 MISSION-CRITICAL RULE: UI & DESIGN INTEGRITY

**CRITICAL:** Any changes to the application's design, aesthetics, UI layouts, colors, typography, or component structures MUST be explicitly approved by the USER before implementation.

- DO NOT 'innovate', 'modernize', or 'improve' the look and feel without a direct, specific request.
- DO NOT change grid layouts, button styles (rounding, padding, shadows), or visibility logic.
- If a task requires data logic changes, ensure they are implemented WITHOUT touching the JSX/CSS that defines the visual presentation, unless asked.
- **FAILURE TO ADHERE TO THIS RULES CAUSES EXTREME FRUSTRATION AND WASTE OF TIME.**

## 🖼️ DATA & ASSET INTEGRITY

- **Product Images:** Images stored in the database (`image_url`) are the absolute source of truth. They must ALWAYS be displayed if they exist.
- **Onboarding/Wizard:** When merging local data with database data, database images MUST take precedence or be preserved. If a user sees a missing image for a product that has one in the DB, it is a critical bug.

## 🔒 SECURITY & AUTHORIZATION

- **Sensitive Actions:** Deleting menu items, changing prices, or modifying business settings requires manager-level authorization.
- **PIN Code:** Use the `ManagerAuthModal` component to verify identity for these actions. Deletion of a dish MUST trigger a PIN check.

## 🔄 DATA SYNCING

- When updating items, ensure all related fields (english names, costs, inventory settings) are synced correctly to Supabase.
- Always use the `image_url` field from the database as the primary source for product visuals.
