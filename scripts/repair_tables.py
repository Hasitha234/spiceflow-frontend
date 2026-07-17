import os
import re

src_dir = "c:/Users/bdils/OneDrive/Desktop/Sysco/spice_business/spiceflow-frontend/src"

for root, _, files in os.walk(src_dir):
    for file in files:
        if not file.endswith(".tsx"):
            continue
            
        file_path = os.path.join(root, file)
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "scroll={{ x: 'max-content' }}" not in content:
            continue
            
        # Fix 1: <Table<T scroll={{ x: 'max-content' }}> -> <Table<T> scroll={{ x: 'max-content' }}>
        content = re.sub(
            r'<Table<([^>]+)\s+scroll=\{\{\s*x:\s*\'max-content\'\s*\}\}>',
            r'<Table<\1> scroll={{ x: \'max-content\' }}>',
            content
        )
        
        # Fix 2: <Table ... / scroll={{ x: 'max-content' }}> -> <Table ... scroll={{ x: 'max-content' }} />
        content = re.sub(
            r'/\s*scroll=\{\{\s*x:\s*\'max-content\'\s*\}\}>',
            r' scroll={{ x: \'max-content\' }} />',
            content
        )
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
                
print("Repair Done")
