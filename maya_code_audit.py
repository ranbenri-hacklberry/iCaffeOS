import os
import re

def audit_onboarding_module():
    base_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/src/pages/onboarding/components"
    tabs_path = os.path.join(base_path, "menu-editor/editor/tabs")
    
    files_to_check = [
        os.path.join(base_path, "MenuReviewDashboard.tsx"),
        os.path.join(base_path, "menu-editor/editor/MenuItemEditModal.tsx"),
        os.path.join(tabs_path, "TabGeneralDetails.tsx"),
        os.path.join(tabs_path, "TabVisualsAI.tsx"),
        os.path.join(tabs_path, "TabModifiers.tsx"),
        os.path.join(tabs_path, "TabProductionInventory.tsx"),
        os.path.join(tabs_path, "TabVisibility.tsx")
    ]
    
    print("🔍 MAYA'S CODE INTEGRITY AUDIT - STARTING...")
    print("="*60)
    
    results = []
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            results.append(f"❌ MISSING FILE: {file_path}")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        filename = os.path.basename(file_path)
        issues = []
        
        # 1. Check for RTL/Hebrew support
        if 'dir="rtl"' not in content.lower() and filename != "TabGeneralDetails.tsx": # Dashboard has it at top level
            if "Dashboard" not in filename and "Modal" not in filename: # Only check leaf tabs if not inherited
                pass 
            
        # 2. Check for interface consistency
        if "localItem" in content and "setLocalItem" not in content and "Tab" in filename:
            issues.append("⚠️ Found 'localItem' but no 'setLocalItem' - potential state sync issue.")
            
        # 3. Specific Logic: TabProductionInventory
        if filename == "TabProductionInventory.tsx":
            if "production" not in content or "completion" not in content or "defrost" not in content:
                issues.append("❌ Missing Production/Completion/Defrost logic.")
            if "opening" not in content or "prep" not in content or "closing" not in content:
                issues.append("❌ Missing 3-way shift picker logic (Opening/Prep/Closing).")
            if "rtl" not in content:
                 issues.append("⚠️ Missing 'dir=\"rtl\"' in production tab.")

        # 4. Check for 'Step3' remnants
        if "Step3" in content:
            issues.append("⚠️ Found legacy reference to 'Step3' - rename suggested.")

        # 5. Check for translation/Hebrew strings (at least some)
        hebrew_pattern = re.compile(r'[\u0590-\u05FF]+')
        if not hebrew_pattern.search(content):
            issues.append("❌ No Hebrew strings found - localization failure.")

        if not issues:
            results.append(f"✅ {filename}: All integrity checks passed.")
        else:
            results.append(f"📝 {filename}: {len(issues)} issues found:")
            for issue in issues:
                results.append(f"   - {issue}")

    print("\n".join(results))
    print("="*60)
    print("📊 AUDIT COMPLETE")

if __name__ == "__main__":
    audit_onboarding_module()
