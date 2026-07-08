import re

# 1. DriverFormDrawer.tsx
path = "src/features/drivers/components/DriverFormDrawer.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = re.sub(r'import\s*\{\s*Form,\s*Input,\s*Button,\s*Drawer,\s*Space,\s*Select,\s*message\s*\}\s*from\s*\'antd\';', r"import { Form, Input, Button, Drawer, Space, Select } from 'antd';", content)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

# 2, 3, 4. DriverListPage.tsx
path = "src/features/drivers/pages/DriverListPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = re.sub(r'import\s*React,\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*\'react\';', r"import { useState, useEffect } from 'react';", content)
content = content.replace("record.status === 'UNAVAILABLE'", "record.status === 'SUSPENDED'")
content = content.replace("record.status === 'IN_TRANSIT'", "record.status === 'ON_ROUTE'")
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

# 5. ProductTable.tsx
path = "src/features/products/components/ProductTable.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = re.sub(r',\s*pagination', '', content) # Need to be careful here, let's just do a specific replace later if this fails. We'll refine this. Let's actually read it first.

