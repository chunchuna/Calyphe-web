// 创建保存目录
const saveDir = path.join(__dirname, 'save');
if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
}

// 处理保存游戏
ipcMain.handle('save-game', async (event, saveData, filename) => {
    try {
        const saveFilePath = path.join(saveDir, `${filename}.json`);
        fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
        return { success: true, path: saveFilePath };
    } catch (error) {
        console.error('保存游戏失败:', error);
        return { success: false, error: error.message };
    }
});

// 处理加载游戏
ipcMain.handle('load-game', async (event, filename) => {
    try {
        const saveFilePath = path.join(saveDir, `${filename}.json`);
        if (!fs.existsSync(saveFilePath)) {
            return { success: false, error: '存档文件不存在' };
        }
        const data = fs.readFileSync(saveFilePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('加载游戏失败:', error);
        return { success: false, error: error.message };
    }
});

// 获取所有存档文件
ipcMain.handle('get-save-files', async (event) => {
    try {
        if (!fs.existsSync(saveDir)) {
            return { success: true, files: [] };
        }
        
        const files = fs.readdirSync(saveDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
        
        return { success: true, files };
    } catch (error) {
        console.error('获取存档文件失败:', error);
        return { success: false, error: error.message };
    }
}); 