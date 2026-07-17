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
            
        if "span=" not in content:
            continue
            
        # Replace <Col span={X}> with <Col xs={24} md={X}>
        new_content = re.sub(
            r'<Col\s+span=\{(\d+)\}',
            r'<Col xs={24} md={\1}',
            content
        )
        
        # Replace <Col span="X"> with <Col xs={24} md="X">
        new_content = re.sub(
            r'<Col\s+span="(\d+)"',
            r'<Col xs={24} md="\1"',
            new_content
        )
        
        if new_content != content:
            print(f"Modifying Col spans in {file_path}")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
print("Done")
