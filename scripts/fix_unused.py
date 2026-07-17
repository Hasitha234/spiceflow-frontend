import re

# Fix AppLayout
app_layout_path = "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/components/layout/AppLayout.tsx"
with open(app_layout_path, "r", encoding="utf-8") as f:
    content = f.read()

# navItems is assigned but unused at line 127
content = re.sub(r'const navItems = getNavItems\(\);\n', '', content)

with open(app_layout_path, "w", encoding="utf-8") as f:
    f.write(content)

# Fix WarehousesPage
wh_path = "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src/pages/settings/WarehousesPage.tsx"
with open(wh_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r',\s*SearchOutlined', '', content)
content = re.sub(r'SearchOutlined,\s*', '', content)

with open(wh_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed final unused imports")
