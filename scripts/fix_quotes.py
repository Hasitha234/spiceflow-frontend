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
            
        if "\\'max-content\\'" not in content:
            continue
            
        content = content.replace("\\'max-content\\'", "'max-content'")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
                
print("Fix Done")
