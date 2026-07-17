import os

files_to_fix = [
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/DeliveriesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/LoadingSheetsPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/purchases/PurchasesPage.tsx",
    "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/RepOrdersPage.tsx"
]

import_statement = "import { ResponsiveModal } from '@/components/common/ResponsiveModal';\n"

for file_path in files_to_fix:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "import { ResponsiveModal }" not in content:
        # insert after the last import statement or at the top
        lines = content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import_idx = i
                
        lines.insert(last_import_idx + 1, import_statement.strip())
        new_content = '\n'.join(lines)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
            
print("Fixed missing ResponsiveModal imports")
