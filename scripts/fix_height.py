import os
import re

files_to_check = [
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/settings/WarehousesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/QrScanPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/AdminUsersPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/AdminTenantsPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/features/suppliers/components/SupplierCatalogDrawer.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/components/finance/ExpenseFormDrawer.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/components/common/ResponsiveModal.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/components/common/EntityFormDrawer.tsx"
]

for file_path in files_to_check:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # replace height="100vh"
        new_content = re.sub(r'\s+height="100vh"', ' rootClassName="sf-full-height-drawer"', content)
        # replace height={isMobile ? '100vh' : undefined}
        new_content = re.sub(r"\s+height=\{isMobile \? '100vh' : undefined\}", " rootClassName={isMobile ? 'sf-full-height-drawer' : ''}", new_content)
        
        if content != new_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Failed {file_path}: {e}")

print("Done")
