import fs from 'fs';
import path from 'path';

const generatedDir = path.resolve('src/api/generated');
if (fs.existsSync(generatedDir)) {
  const entries = fs.readdirSync(generatedDir, { withFileTypes: true });
  const exportsList = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirName = entry.name;
      if (dirName === 'model') {
        exportsList.push(`export * from './model';`);
      } else {
        const tsPath = path.join(generatedDir, dirName, `${dirName}.ts`);
        if (fs.existsSync(tsPath)) {
          exportsList.push(`export * from './${dirName}/${dirName}';`);
        }
      }
    }
  }
  
  exportsList.sort();
  fs.writeFileSync(path.join(generatedDir, 'index.ts'), exportsList.join('\n') + '\n', 'utf8');
  console.log('✅ Generated src/api/generated/index.ts');
}
