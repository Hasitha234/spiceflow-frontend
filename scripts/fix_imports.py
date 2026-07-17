import re

files_to_fix = [
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/DeliveriesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/InventoryPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/RepOrdersPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/SettingsPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/purchases/PurchasesPage.tsx"
]

for file_path in files_to_fix:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove Modal from imports
    content = re.sub(r',\s*Modal', '', content)
    content = re.sub(r'Modal,\s*', '', content)
    content = re.sub(r'{\s*Modal\s*}', '{}', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
# Fix AppLayout
app_layout_path = "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/components/layout/AppLayout.tsx"
with open(app_layout_path, "r", encoding="utf-8") as f:
    content = f.read()
content = re.sub(r',\s*SettingOutlined', '', content)
content = re.sub(r'SettingOutlined,\s*', '', content)
content = re.sub(r'const navItems = getNavItems\(\);\n', '', content)

with open(app_layout_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed unused imports")
