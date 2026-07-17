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
            
        if "<Table" not in content:
            continue
            
        # We need to add scroll={{ x: 'max-content' }} to <Table elements
        # that don't already have scroll=
        
        # Simple regex to find <Table ... > tags that don't have scroll prop
        # It's a bit tricky to parse JSX with regex, but we can do a basic check
        new_content = re.sub(
            r'(<Table(?![^>]*scroll=)[^>]*)>',
            r"\1 scroll={{ x: 'max-content' }}>",
            content
        )
        
        # Also replace existing scroll={{ x: ... }} with max-content if it's there
        # but let's just stick to adding it if missing for now.
        
        if new_content != content:
            print(f"Adding horizontal scroll to {file_path}")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
print("Done")
