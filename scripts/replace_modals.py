import os
import re

files_to_check = [
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/DaySummaryPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/DeliveriesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/InventoryPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/LoadingSheetsPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/purchases/PurchasesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/features/dashboard/components/InventoryWarehouseTab.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/RepOrdersPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/SettingsPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/settings/CategoriesPage.tsx"
]

for file_path in files_to_check:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "<Modal" not in content:
        continue
        
    print(f"Modifying {file_path}")
    
    # Add import if not present
    if "ResponsiveModal" not in content:
        import_stmt = "import { ResponsiveModal } from '@/components/common';\n"
        # insert after the first line or antD imports
        content = re.sub(r"(import .*?from 'antd';)", r"\1\n" + import_stmt, content)
        
    # Replace tags
    content = content.replace("<Modal", "<ResponsiveModal")
    content = content.replace("</Modal>", "</ResponsiveModal>")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Done")
