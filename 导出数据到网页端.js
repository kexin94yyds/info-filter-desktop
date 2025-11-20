#!/usr/bin/env node

/**
 * 导出桌面端数据到网页端
 * 使用方法：node 导出数据到网页端.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取数据存储路径
function getDataPath() {
  const platform = process.platform;
  let dataPath;
  
  if (platform === 'darwin') {
    // macOS
    dataPath = path.join(os.homedir(), 'Library', 'Application Support', 'info-filter-desktop', 'config.json');
  } else if (platform === 'win32') {
    // Windows
    dataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'info-filter-desktop', 'config.json');
  } else {
    // Linux
    dataPath = path.join(os.homedir(), '.config', 'info-filter-desktop', 'config.json');
  }
  
  return dataPath;
}

// 读取桌面端数据
function readDesktopData() {
  const dataPath = getDataPath();
  
  console.log(`📂 读取桌面端数据: ${dataPath}`);
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ 数据文件不存在: ${dataPath}`);
    console.log('💡 请确保桌面端应用已经运行过并保存了数据');
    process.exit(1);
  }
  
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    const config = JSON.parse(data);
    
    // electron-store 存储格式：{ items: [...] }
    const items = config.items || [];
    
    console.log(`✅ 成功读取 ${items.length} 条数据`);
    return items;
  } catch (error) {
    console.error('❌ 读取数据失败:', error.message);
    process.exit(1);
  }
}

// 导出数据到 JSON 文件
function exportToJSON(items, outputPath) {
  try {
    const jsonData = JSON.stringify(items, null, 2);
    fs.writeFileSync(outputPath, jsonData, 'utf8');
    console.log(`✅ 数据已导出到: ${outputPath}`);
    console.log(`📊 共 ${items.length} 条数据`);
    return outputPath;
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    process.exit(1);
  }
}

// 生成导入说明
function generateImportInstructions(outputPath) {
  const instructions = `
📋 导入到网页端的步骤：

1. 打开网页端：
   https://kexin94yyds.github.io/info-filter-desktop/

2. 点击"导入"按钮

3. 选择文件：${outputPath}

4. 确认导入

✨ 完成！数据已同步到网页端。
`;
  
  console.log(instructions);
}

// 主函数
function main() {
  console.log('🚀 开始导出桌面端数据...\n');
  
  // 读取数据
  const items = readDesktopData();
  
  if (items.length === 0) {
    console.log('⚠️  没有数据需要导出');
    return;
  }
  
  // 生成输出文件名
  const timestamp = new Date().toISOString().split('T')[0];
  const outputPath = path.join(__dirname, `info-filter-export-${timestamp}.json`);
  
  // 导出数据
  exportToJSON(items, outputPath);
  
  // 显示导入说明
  generateImportInstructions(outputPath);
  
  console.log('\n💡 提示：');
  console.log('   - 导出的 JSON 文件可以随时导入到网页端');
  console.log('   - 网页端数据存储在浏览器本地（localStorage）');
  console.log('   - 导入时会自动合并，不会覆盖现有数据');
}

// 运行
main();

