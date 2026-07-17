import os

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
            
        # Revert the table tag changes
        content = content.replace(" scroll={{ x: 'max-content' }}", "")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
                
print("Revert Done")
