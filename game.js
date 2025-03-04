// 游戏类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 40; // 每个方格的大小
        this.map = []; // 地图数据
        this.player = {
            x: 0,
            y: 0,
            gridX: 0, // 添加网格坐标
            gridY: 0,
            size: 30, // 玩家尺寸小于方格
            color: 'blue',
            speed: 5, // 移动速度
            sprite: '🧙‍♂️', // 添加玩家形象 - 使用魔法师表情
            direction: 'down', // 添加方向属性
            isMoving: false, // 是否正在移动中
            targetX: 0, // 移动目标X坐标
            targetY: 0, // 移动目标Y坐标
            visionRadius: 5 // 视野半径（格子数）
        };
        
        // 按键状态
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // 事件监听
        this.setupEventListeners();
        
        // 游戏循环
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        this.npcs = []; // 存储地图上的NPC
        this.npcConfig = {}; // NPC配置数据
        this.showNpcInfo = false; // 是否显示NPC信息
        this.activeNpc = null; // 当前活跃（交互中）的NPC
        
        // 添加摄像机/视图系统
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // 预加载图像
        this.images = {};
        this.loadImages();
        
        // 玩家配置和游戏UI
        this.playerConfig = {};
        this.console = {
            messages: [],
            maxMessages: 100
        };
        this.mapName = "初始迷宫";
        
        // 初始化UI
        this.initUI();
        
        // 加载玩家配置
        this.loadPlayerConfig()
            .then(() => {
                // 然后再加载NPC配置
                return this.loadNpcConfig();
            })
            .then(() => {
                // 然后尝试加载地图
                return this.loadMapFromFile('map.txt');
            })
            .then(success => {
                if (!success) {
                    console.log('无法加载map.txt，使用默认地图');
                    this.createDefaultMap();
                }
                this.processNpcs(); // 处理地图中的NPC
                this.drawMap();
                this.startGame();
                
                // 添加初始日志消息
                this.addConsoleMessage("欢迎来到Calyphe世界！", "system");
                this.addConsoleMessage("使用WASD移动，空格键与NPC交互", "system");
                this.addConsoleMessage("在控制台输入'help'获取更多命令", "info");
            });
        
        // 视野数据
        this.visibilityGrid = []; // 存储哪些格子可见
    }
    
    // 新增：从文件加载地图的方法
    loadMapFromFile(filename) {
        return fetch(filename)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载${filename}: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(content => {
                console.log(`成功加载地图文件: ${filename}`);
                this.loadMap(content);
                return true;
            })
            .catch(error => {
                console.error(`加载地图文件失败: ${error.message}`);
                return false;
            });
    }
    
    setupEventListeners() {
        // 键盘按下事件
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = true;
            if (e.key.toLowerCase() === 'a') this.keys.a = true;
            if (e.key.toLowerCase() === 's') this.keys.s = true;
            if (e.key.toLowerCase() === 'd') this.keys.d = true;
            
            // 更新玩家方向
            if (e.key.toLowerCase() === 'w') this.player.direction = 'up';
            if (e.key.toLowerCase() === 'a') this.player.direction = 'left';
            if (e.key.toLowerCase() === 's') this.player.direction = 'down';
            if (e.key.toLowerCase() === 'd') this.player.direction = 'right';
            
            // 空格键交互
            if (e.key === ' ' || e.code === 'Space') {
                if (this.showNpcInfo) {
                    // 如果已经显示NPC信息，则关闭
                    this.showNpcInfo = false;
                    this.activeNpc = null;
                } else {
                    // 检查是否有附近的NPC
                    const nearbyNpc = this.getNearbyNpc();
                    if (nearbyNpc) {
                        this.activeNpc = nearbyNpc;
                        this.showNpcInfo = true;
                    }
                }
            }
        });
        
        // 键盘释放事件
        window.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = false;
            if (e.key.toLowerCase() === 'a') this.keys.a = false;
            if (e.key.toLowerCase() === 's') this.keys.s = false;
            if (e.key.toLowerCase() === 'd') this.keys.d = false;
        });
    }
    
    createDefaultMap() {
        // 创建一个简单的默认地图
        this.map = [
            '##########',
            '#P       #',
            '#  ####  #',
            '#  #     #',
            '#  #  ####',
            '#        #',
            '#  #     #',
            '#  ####  #',
            '#        #',
            '##########'
        ];
        
        // 找到玩家位置
        this.findPlayerPosition();
    }
    
    loadMap(mapContent) {
        // 按行分割地图内容
        this.map = mapContent.split('\n').filter(line => line.trim() !== '');
        
        // 找到玩家位置
        this.findPlayerPosition();
        
        // 记录日志
        console.log('地图已加载:', this.map);
        console.log('玩家位置:', this.player.x, this.player.y);
        
        // 加载完地图后处理NPC
        this.processNpcs();
        
        // 初始化视野网格
        this.initVisibilityGrid();
        this.calculateVisibility();
    }
    
    findPlayerPosition() {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'P') {
                    this.player.gridX = x;
                    this.player.gridY = y;
                    this.player.x = x * this.tileSize + (this.tileSize - this.player.size) / 2;
                    this.player.y = y * this.tileSize + (this.tileSize - this.player.size) / 2;
                    
                    // 立即计算初始视野
                    this.calculateVisibility();
                    return;
                }
            }
        }
    }
    
    drawMap() {
        // 更新摄像机位置
        this.updateCamera();
        
        // 清除整个画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算可见区域的网格范围
        const startCol = Math.floor(this.camera.x / this.tileSize);
        const endCol = Math.ceil((this.camera.x + this.canvas.width) / this.tileSize);
        const startRow = Math.floor(this.camera.y / this.tileSize);
        const endRow = Math.ceil((this.camera.y + this.canvas.height) / this.tileSize);
        
        // 定义不同类型的墙壁颜色
        const wallColors = ['#444', '#555', '#3a3a3a', '#4d4d4d'];
        
        // 先绘制黑色背景（表示完全不可见的区域）
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制可见区域的地图
        for (let y = startRow; y < endRow; y++) {
            if (y < 0 || y >= this.map.length) continue;
            
            for (let x = startCol; x < endCol; x++) {
                if (x < 0 || x >= this.map[y].length) continue;
                
                // 检查格子是否可见
                const isVisible = this.visibilityGrid[y] && this.visibilityGrid[y][x];
                
                if (isVisible) {
                    // 绘制灰色地面底色
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(
                        x * this.tileSize - this.camera.x,
                        y * this.tileSize - this.camera.y,
                        this.tileSize,
                        this.tileSize
                    );
                    
                    // 为每个单元格绘制稍浅的灰色网格线
                    this.ctx.strokeStyle = '#3a3a3a';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.tileSize - this.camera.x,
                        y * this.tileSize - this.camera.y,
                        this.tileSize,
                        this.tileSize
                    );
                    
                    if (this.map[y][x] === '#') {
                        // 根据坐标选择不同的墙壁颜色
                        const colorIndex = (x * 7 + y * 13) % wallColors.length;
                        this.ctx.fillStyle = wallColors[colorIndex];
                        
                        // 绘制墙壁
                        this.ctx.fillRect(
                            x * this.tileSize - this.camera.x,
                            y * this.tileSize - this.camera.y,
                            this.tileSize,
                            this.tileSize
                        );
                        
                        // 绘制墙壁边缘高光
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        this.ctx.fillRect(
                            x * this.tileSize - this.camera.x,
                            y * this.tileSize - this.camera.y,
                            this.tileSize,
                            2
                        );
                        this.ctx.fillRect(
                            x * this.tileSize - this.camera.x,
                            y * this.tileSize - this.camera.y,
                            2,
                            this.tileSize
                        );
                    }
                } else {
                    // 绘制半透明的黑色遮罩（表示已探索但当前不可见的区域）
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(
                        x * this.tileSize - this.camera.x,
                        y * this.tileSize - this.camera.y,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
        
        // 绘制NPC（只显示可见区域的NPC）
        this.drawNpcs();
        
        // 绘制玩家
        this.drawPlayer();
        
        // 绘制小地图指示器
        this.drawMinimap();
    }
    
    updatePlayer(deltaTime) {
        // 如果正在显示NPC信息，不允许移动
        if (this.showNpcInfo) {
            return;
        }
        
        // 如果玩家正在移动中，继续移动到目标格子
        if (this.player.isMoving) {
            const dx = this.player.targetX - this.player.x;
            const dy = this.player.targetY - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果已经接近目标位置，直接设置到目标位置
            if (distance < this.player.speed) {
                this.player.x = this.player.targetX;
                this.player.y = this.player.targetY;
                this.player.isMoving = false;
                
                // 更新玩家的网格坐标
                this.player.gridX = Math.floor(this.player.x / this.tileSize);
                this.player.gridY = Math.floor(this.player.y / this.tileSize);
                
                // 计算新的视野
                this.calculateVisibility();
            } else {
                // 否则继续移动
                const moveRatio = this.player.speed / distance;
                this.player.x += dx * moveRatio;
                this.player.y += dy * moveRatio;
            }
            
            return; // 正在移动中，不接受新的移动指令
        }
        
        // 如果没有移动，检查是否有新的移动指令
        let targetGridX = this.player.gridX;
        let targetGridY = this.player.gridY;
        let wantsToMove = false;
        
        if (this.keys.w) {
            targetGridY--;
            this.player.direction = 'up';
            wantsToMove = true;
        } else if (this.keys.s) {
            targetGridY++;
            this.player.direction = 'down';
            wantsToMove = true;
        } else if (this.keys.a) {
            targetGridX--;
            this.player.direction = 'left';
            wantsToMove = true;
        } else if (this.keys.d) {
            targetGridX++;
            this.player.direction = 'right';
            wantsToMove = true;
        }
        
        // 如果玩家想移动，检查是否可以移动到新位置
        if (wantsToMove) {
            // 检查新位置是否有效（不是墙壁）
            if (this.isValidMove(targetGridX, targetGridY)) {
                // 设置移动目标
                this.player.targetX = targetGridX * this.tileSize + (this.tileSize - this.player.size) / 2;
                this.player.targetY = targetGridY * this.tileSize + (this.tileSize - this.player.size) / 2;
                this.player.isMoving = true;
            }
        }
        
        // 更新顶部面板位置信息
        this.updateTopPanel();
    }
    
    checkCollision(x, y, width, height) {
        // 计算玩家在网格中的位置
        const gridX1 = Math.floor(x / this.tileSize);
        const gridY1 = Math.floor(y / this.tileSize);
        const gridX2 = Math.floor((x + width - 1) / this.tileSize);
        const gridY2 = Math.floor((y + height - 1) / this.tileSize);
        
        // 检查四个角是否碰到墙壁
        for (let gridY = gridY1; gridY <= gridY2; gridY++) {
            for (let gridX = gridX1; gridX <= gridX2; gridX++) {
                if (gridY >= 0 && gridY < this.map.length && 
                    gridX >= 0 && gridX < this.map[gridY].length) {
                    if (this.map[gridY][gridX] === '#') {
                        return true; // 发生碰撞
                    }
                }
            }
        }
        
        return false; // 没有碰撞
    }
    
    gameLoop(timestamp) {
        // 计算两帧之间的时间差
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新游戏状态
        this.updatePlayer(deltaTime);
        
        // 更新摄像机位置
        this.updateCamera();
        
        // 重绘地图（包含摄像机偏移的应用）
        this.drawMap();
        
        // 继续循环
        requestAnimationFrame(this.gameLoop);
    }
    
    startGame() {
        // 启动游戏循环
        requestAnimationFrame(this.gameLoop);
    }
    
    // 加载NPC配置
    loadNpcConfig() {
        // 如果在浏览器控制台中设置了全局npcConfig，直接使用
        if (typeof npcConfig !== 'undefined') {
            console.log('使用全局npcConfig对象');
            this.npcConfig = npcConfig;
            return Promise.resolve(true);
        }
        
        // 尝试从npc-config.js加载
        return fetch('npc-config.js')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载NPC配置: ${response.status}`);
                }
                return response.text();
            })
            .then(content => {
                try {
                    // 临时创建一个安全的执行环境
                    const configFunc = new Function('', content + '; return npcConfig;');
                    const loadedConfig = configFunc();
                    
                    if (loadedConfig && typeof loadedConfig === 'object') {
                        this.npcConfig = loadedConfig;
                        console.log('NPC配置加载成功:', Object.keys(this.npcConfig).length, '个NPC');
                        return true;
                    } else {
                        throw new Error('加载的npcConfig不是一个有效对象');
                    }
                } catch (error) {
                    console.error('解析NPC配置失败:', error);
                    
                    // 使用内置默认配置作为备用
                    this.npcConfig = {
                        "1": {
                            id: "1", name: "村长", sprite: "👴",
                            items: ["任务卷轴"], dialogue: "欢迎来到我们的村庄！"
                        },
                        "5": {
                            id: "5", name: "守卫", sprite: "💂",
                            items: ["钢剑"], dialogue: "止步！这里是禁地！"
                        }
                    };
                    console.log('使用默认NPC配置');
                    return true;
                }
            })
            .catch(error => {
                console.error('加载NPC配置文件失败:', error.message);
                
                // 使用内置默认配置作为备用
                this.npcConfig = {
                    "1": {
                        id: "1", name: "村长", sprite: "👴",
                        items: ["任务卷轴"], dialogue: "欢迎来到我们的村庄！"
                    },
                    "5": {
                        id: "5", name: "守卫", sprite: "💂",
                        items: ["钢剑"], dialogue: "止步！这里是禁地！"
                    }
                };
                console.log('使用默认NPC配置');
                return true;
            });
    }
    
    // 处理地图中的NPC标记
    processNpcs() {
        this.npcs = []; // 清空现有NPC
        
        // 先查找基本NPC标记
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'N') {
                    console.log(`在地图上发现NPC标记: (${x},${y})`);
                    // 创建基本NPC（没有ID）
                    this.npcs.push({
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        size: this.tileSize,
                        id: '1', // 默认ID
                        gridX: x,
                        gridY: y
                    });
                }
            }
        }
        
        // 尝试从map.txt整个字符串中提取NPC配置
        const mapText = this.map.join('\n');
        console.log("检查地图是否包含NPC配置信息...");
        
        // 检查是否有注释行
        const commentLines = mapText.split('\n').filter(line => line.trim().startsWith('//'));
        console.log(`找到${commentLines.length}行注释`);
        
        // 专门查找NPC配置行
        let npcConfigLine = '';
        for (const line of commentLines) {
            if (line.includes('NPC配置') || line.includes(':')) {
                npcConfigLine = line;
                console.log(`找到NPC配置行: ${line}`);
            }
        }
        
        if (npcConfigLine) {
            // 提取所有x,y:id格式的配置
            const npcMatches = npcConfigLine.match(/(\d+),(\d+):(\d+)/g);
            
            if (npcMatches && npcMatches.length > 0) {
                console.log(`从配置中解析到${npcMatches.length}个NPC定义`);
                
                npcMatches.forEach(match => {
                    const parts = match.match(/(\d+),(\d+):(\d+)/);
                    if (parts && parts.length >= 4) {
                        const gridX = parseInt(parts[1]);
                        const gridY = parseInt(parts[2]);
                        const id = parts[3];
                        
                        console.log(`NPC配置: 位置(${gridX},${gridY}), ID=${id}`);
                        
                        // 检查这个位置是否已经有NPC
                        let npc = this.npcs.find(n => n.gridX === gridX && n.gridY === gridY);
                        
                        if (!npc) {
                            // 如果没有找到NPC，创建一个新的
                            npc = {
                                x: gridX * this.tileSize,
                                y: gridY * this.tileSize,
                                size: this.tileSize,
                                gridX: gridX,
                                gridY: gridY,
                                id: id
                            };
                            this.npcs.push(npc);
                            
                            // 确保地图上该位置标记为N
                            if (gridY < this.map.length && gridX < this.map[gridY].length) {
                                this.map[gridY] = this.map[gridY].substring(0, gridX) + 'N' + 
                                                  this.map[gridY].substring(gridX + 1);
                            }
                        } else {
                            // 更新现有NPC的ID
                            npc.id = id;
                        }
                        
                        // 关联NPC配置数据
                        if (this.npcConfig[id]) {
                            npc.config = this.npcConfig[id];
                            console.log(`关联NPC配置: ${npc.config.name}`);
                        } else {
                            console.warn(`警告: ID=${id}的NPC配置不存在`);
                        }
                    }
                });
            } else {
                console.log("未能在配置行中找到有效的NPC定义");
            }
        } else {
            console.log("未找到NPC配置行");
        }
        
        console.log('地图中发现', this.npcs.length, '个NPC');
        
        // 添加额外调试信息
        if (this.npcs.length > 0) {
            console.log('NPC列表:');
            this.npcs.forEach((npc, index) => {
                console.log(`  ${index+1}. 位置(${npc.gridX},${npc.gridY}), ID=${npc.id}, 配置:`, npc.config ? npc.config.name : '无');
            });
        }
    }
    
    // 绘制NPC
    drawNpcs() {
        for (const npc of this.npcs) {
            // 检查NPC是否在可见区域内
            if (this.isEntityVisible(npc) && 
                this.visibilityGrid[npc.gridY] && 
                this.visibilityGrid[npc.gridY][npc.gridX]) {
                
                // 绘制NPC底色，应用摄像机偏移
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(
                    npc.x - this.camera.x,
                    npc.y - this.camera.y,
                    npc.size,
                    npc.size
                );
                
                // 绘制边框
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    npc.x - this.camera.x,
                    npc.y - this.camera.y,
                    npc.size,
                    npc.size
                );
                
                // 绘制NPC图标
                if (npc.config && npc.config.sprite) {
                    this.ctx.font = '24px Arial';
                    this.ctx.fillStyle = 'white';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        npc.config.sprite,
                        npc.x + npc.size / 2 - this.camera.x,
                        npc.y + npc.size / 2 - this.camera.y
                    );
                } else {
                    this.ctx.font = 'bold 24px Arial';
                    this.ctx.fillStyle = 'white';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        'N',
                        npc.x + npc.size / 2 - this.camera.x,
                        npc.y + npc.size / 2 - this.camera.y
                    );
                }
                
                // 绘制NPC名称
                if (npc.config) {
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.fillStyle = 'white';
                    this.ctx.textAlign = 'center';
                    
                    // 绘制黑色轮廓
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeText(
                        npc.config.name,
                        npc.x + npc.size / 2 - this.camera.x,
                        npc.y - 5 - this.camera.y
                    );
                    
                    this.ctx.fillText(
                        npc.config.name,
                        npc.x + npc.size / 2 - this.camera.x,
                        npc.y - 5 - this.camera.y
                    );
                }
            }
        }
        
        // 如果玩家靠近NPC，显示交互提示
        const nearbyNpc = this.getNearbyNpc();
        if (nearbyNpc && !this.showNpcInfo) {
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = 'yellow';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                '按空格键交谈',
                nearbyNpc.x + nearbyNpc.size / 2 - this.camera.x,
                nearbyNpc.y - 20 - this.camera.y
            );
        }
        
        // 显示NPC信息面板
        if (this.showNpcInfo && this.activeNpc && this.activeNpc.config) {
            this.drawNpcInfoPanel();
        }
    }
    
    // 绘制NPC信息面板
    drawNpcInfoPanel() {
        const npc = this.activeNpc;
        const panelWidth = 300;
        const panelHeight = 200;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;
        
        // 绘制半透明背景 - 这个不受摄像机影响，应该覆盖整个屏幕
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制面板背景 - 固定在屏幕中央
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // 绘制边框
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 绘制NPC信息 - 这些都是相对于面板位置，不受摄像机影响
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(npc.config.name, panelX + panelWidth / 2, panelY + 30);
        
        // 对话文本
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            npc.config.dialogue || '...',
            panelX + panelWidth / 2,
            panelY + 60
        );
        
        // 其他NPC信息
        if (npc.config.items && npc.config.items.length > 0) {
            this.ctx.fillText(
                `携带物品: ${npc.config.items.join(', ')}`,
                panelX + panelWidth / 2,
                panelY + 90
            );
        }
        
        if (npc.config.function) {
            this.ctx.fillText(
                `功能: ${npc.config.function}`,
                panelX + panelWidth / 2,
                panelY + 120
            );
        }
        
        // 绘制关闭提示
        this.ctx.fillText(
            '按空格键关闭',
            panelX + panelWidth / 2,
            panelY + 170
        );
    }
    
    // 获取玩家附近的NPC
    getNearbyNpc() {
        const playerCenterX = this.player.x + this.player.size / 2;
        const playerCenterY = this.player.y + this.player.size / 2;
        const interactionDistance = this.tileSize * 1.5;
        
        for (const npc of this.npcs) {
            const npcCenterX = npc.x + npc.size / 2;
            const npcCenterY = npc.y + npc.size / 2;
            
            const distance = Math.sqrt(
                Math.pow(playerCenterX - npcCenterX, 2) +
                Math.pow(playerCenterY - npcCenterY, 2)
            );
            
            if (distance < interactionDistance) {
                // 发现NPC时添加消息
                this.addConsoleMessage(`发现附近的NPC: ${npc.config ? npc.config.name : '未知NPC'}`, 'info');
                return npc;
            }
        }
        
        return null;
    }
    
    // 更新摄像机位置以跟随玩家
    updateCamera() {
        // 计算玩家中心坐标
        const playerCenterX = this.player.x + this.player.size / 2;
        const playerCenterY = this.player.y + this.player.size / 2;
        
        // 更新摄像机位置，使玩家保持在画布中心
        this.camera.x = playerCenterX - this.canvas.width / 2;
        this.camera.y = playerCenterY - this.canvas.height / 2;
        
        // 限制摄像机不要超出地图边界（可选）
        // 如果地图边界明确，可以取消注释以下代码
        /*
        const maxWidth = this.map[0].length * this.tileSize - this.canvas.width;
        const maxHeight = this.map.length * this.tileSize - this.canvas.height;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxHeight));
        */
    }
    
    // 检查实体是否在可见区域内
    isEntityVisible(entity) {
        return (
            entity.x + entity.size > this.camera.x &&
            entity.x < this.camera.x + this.canvas.width &&
            entity.y + entity.size > this.camera.y &&
            entity.y < this.camera.y + this.canvas.height
        );
    }
    
    // 添加小地图功能（可选）
    drawMinimap() {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 10;
        const minimapY = 10;
        const scale = 0.1; // 小地图比例
        
        // 绘制小地图背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // 计算地图实际大小
        const mapWidth = this.map[0].length * this.tileSize * scale;
        const mapHeight = this.map.length * this.tileSize * scale;
        
        // 绘制地图元素（只绘制已探索区域）
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                // 仅绘制可见或已探索区域
                if (this.visibilityGrid[y][x]) {
                    // 绘制墙壁
                    this.ctx.fillStyle = '#777';
                    this.ctx.fillRect(
                        minimapX + x * this.tileSize * scale,
                        minimapY + y * this.tileSize * scale,
                        this.tileSize * scale,
                        this.tileSize * scale
                    );
                }
            }
        }
        
        // 绘制NPC
        for (const npc of this.npcs) {
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(
                minimapX + npc.gridX * this.tileSize * scale,
                minimapY + npc.gridY * this.tileSize * scale,
                this.tileSize * scale,
                this.tileSize * scale
            );
        }
        
        // 绘制玩家位置
        const playerMapX = this.player.x / this.tileSize;
        const playerMapY = this.player.y / this.tileSize;
        
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(
            minimapX + playerMapX * this.tileSize * scale,
            minimapY + playerMapY * this.tileSize * scale,
            this.tileSize * scale,
            this.tileSize * scale
        );
        
        // 绘制当前视图范围
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            minimapX + (this.camera.x / this.tileSize) * this.tileSize * scale,
            minimapY + (this.camera.y / this.tileSize) * this.tileSize * scale,
            (this.canvas.width / this.tileSize) * this.tileSize * scale,
            (this.canvas.height / this.tileSize) * this.tileSize * scale
        );
    }
    
    // 添加图像加载函数
    loadImages() {
        // 这里可以加载更多图像，例如为玩家加载不同朝向的图像
        // 现在我们使用emoji作为简易替代
    }
    
    // 添加专门的玩家绘制函数
    drawPlayer() {
        // 首先绘制玩家底色/阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.size/2 - this.camera.x,
            this.player.y + this.player.size - this.camera.y,
            this.player.size/2,
            this.player.size/4,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        if (this.player.sprite) {
            // 使用表情符号作为玩家角色
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.player.sprite,
                this.player.x + this.player.size/2 - this.camera.x,
                this.player.y + this.player.size/2 - this.camera.y
            );
        } else {
            // 如果没有定义sprite，则回退到彩色方块
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(
                this.player.x - this.camera.x,
                this.player.y - this.camera.y,
                this.player.size,
                this.player.size
            );
        }
    }
    
    // 检查移动是否有效
    isValidMove(gridX, gridY) {
        // 检查边界
        if (gridX < 0 || gridY < 0 || 
            gridY >= this.map.length || 
            gridX >= this.map[gridY].length) {
            return false;
        }
        
        // 检查是否是墙壁
        const isValid = this.map[gridY][gridX] !== '#';
        
        // 如果移动有效，添加记录
        if (isValid) {
            this.addConsoleMessage(`移动到 (${gridX},${gridY})`, 'info');
        }
        
        return isValid;
    }
    
    // 初始化视野网格
    initVisibilityGrid() {
        this.visibilityGrid = [];
        for (let y = 0; y < this.map.length; y++) {
            const row = [];
            for (let x = 0; x < this.map[y].length; x++) {
                row.push(false); // 默认不可见
            }
            this.visibilityGrid.push(row);
        }
    }
    
    // 计算可见格子
    calculateVisibility() {
        // 初始化视野网格
        this.initVisibilityGrid();
        
        const playerGridX = this.player.gridX;
        const playerGridY = this.player.gridY;
        const radius = this.player.visionRadius;
        
        // 遍历周围的格子
        for (let y = playerGridY - radius; y <= playerGridY + radius; y++) {
            for (let x = playerGridX - radius; x <= playerGridX + radius; x++) {
                // 检查是否在地图范围内
                if (y < 0 || x < 0 || y >= this.map.length || x >= this.map[0].length) {
                    continue;
                }
                
                // 计算到玩家的距离
                const distance = Math.sqrt(
                    Math.pow(x - playerGridX, 2) + 
                    Math.pow(y - playerGridY, 2)
                );
                
                // 如果在视野半径内，检查是否有墙壁阻挡
                if (distance <= radius) {
                    if (this.hasLineOfSight(playerGridX, playerGridY, x, y)) {
                        this.visibilityGrid[y][x] = true;
                    }
                }
            }
        }
    }
    
    // 检查是否有视线（使用Bresenham's算法）
    hasLineOfSight(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        
        while (x0 !== x1 || y0 !== y1) {
            // 如果不是终点，且是墙壁，则阻挡视线
            if ((x0 !== x1 || y0 !== y1) && 
                this.map[y0][x0] === '#') {
                return false;
            }
            
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
        
        return true;
    }
    
    // 加载玩家配置
    loadPlayerConfig() {
        // 检查是否已经有全局playerConfig对象
        if (typeof playerConfig !== 'undefined') {
            this.playerConfig = playerConfig;
            this.updateInventoryUI();
            this.updateAttributesUI();
            return Promise.resolve(true);
        }
        
        // 尝试从文件加载
        return fetch('player-config.js')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载玩家配置: ${response.status}`);
                }
                return response.text();
            })
            .then(content => {
                try {
                    // 临时创建一个安全的执行环境
                    const configFunc = new Function('', content + '; return playerConfig;');
                    const loadedConfig = configFunc();
                    
                    if (loadedConfig && typeof loadedConfig === 'object') {
                        this.playerConfig = loadedConfig;
                        console.log('玩家配置加载成功');
                        this.updateInventoryUI();
                        this.updateAttributesUI();
                        return true;
                    } else {
                        throw new Error('加载的playerConfig不是一个有效对象');
                    }
                } catch (error) {
                    console.error('解析玩家配置失败:', error);
                    // 使用默认配置
                    this.playerConfig = {
                        attributes: {
                            health: 100,
                            maxHealth: 100,
                            mana: 50,
                            maxMana: 50,
                            level: 1
                        },
                        inventory: []
                    };
                    this.updateInventoryUI();
                    this.updateAttributesUI();
                    return true;
                }
            })
            .catch(error => {
                console.error('加载玩家配置文件失败:', error.message);
                // 使用默认配置
                this.playerConfig = {
                    attributes: {
                        health: 100,
                        maxHealth: 100,
                        mana: 50,
                        maxMana: 50,
                        level: 1
                    },
                    inventory: []
                };
                this.updateInventoryUI();
                this.updateAttributesUI();
                return true;
            });
    }
    
    // 初始化UI元素
    initUI() {
        // 控制台输入处理
        const consoleInput = document.getElementById('consoleInput');
        consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = consoleInput.value.trim();
                if (command) {
                    this.processCommand(command);
                    consoleInput.value = '';
                }
            }
        });
        
        // 设置画布大小以适应新的布局
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 更新顶部面板信息
        this.updateTopPanel();
    }
    
    // 调整画布大小
    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        const consolePanel = document.querySelector('.console-panel');
        
        // 画布应该填充游戏区域，但减去控制台的高度
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight - consolePanel.clientHeight;
    }
    
    // 更新顶部面板信息
    updateTopPanel() {
        const locationInfo = document.querySelector('.location-info');
        locationInfo.textContent = `位置: (${this.player.gridX},${this.player.gridY}) | 地图: ${this.mapName}`;
    }
    
    // 添加控制台消息
    addConsoleMessage(message, type = 'info') {
        const consoleOutput = document.getElementById('consoleOutput');
        const messageElement = document.createElement('div');
        messageElement.className = `console-message ${type}`;
        messageElement.textContent = message;
        
        consoleOutput.appendChild(messageElement);
        
        // 自动滚动到底部
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        
        // 存储消息
        this.console.messages.push({
            text: message,
            type: type,
            timestamp: Date.now()
        });
        
        // 限制消息数量
        if (this.console.messages.length > this.console.maxMessages) {
            this.console.messages.shift();
        }
    }
    
    // 处理控制台命令
    processCommand(command) {
        this.addConsoleMessage(`> ${command}`, 'player');
        
        // 命令解析
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        
        switch (cmd) {
            case 'help':
                this.addConsoleMessage('可用命令: help, look, stats, inventory, map, clear', 'system');
                break;
            
            case 'look':
                this.addConsoleMessage('你环顾四周...', 'info');
                // 检查附近的实体
                const nearbyNpc = this.getNearbyNpc();
                if (nearbyNpc) {
                    this.addConsoleMessage(`你看到 ${nearbyNpc.config ? nearbyNpc.config.name : '一个NPC'} 就在附近。`, 'info');
                } else {
                    this.addConsoleMessage('这里没有其他生物。', 'info');
                }
                break;
            
            case 'stats':
                this.addConsoleMessage('你的属性:', 'system');
                const attrs = this.playerConfig.attributes;
                for (const key in attrs) {
                    this.addConsoleMessage(`${key}: ${attrs[key]}`, 'info');
                }
                break;
            
            case 'inventory':
                if (this.playerConfig.inventory.length === 0) {
                    this.addConsoleMessage('你的背包是空的。', 'info');
                } else {
                    this.addConsoleMessage('背包内容:', 'system');
                    this.playerConfig.inventory.forEach(item => {
                        this.addConsoleMessage(`${item.name} x${item.quantity} ${item.equipped ? '[已装备]' : ''}`, 'info');
                    });
                }
                break;
            
            case 'map':
                this.addConsoleMessage(`当前地图: ${this.mapName}`, 'system');
                this.addConsoleMessage(`你的位置: (${this.player.gridX},${this.player.gridY})`, 'info');
                break;
            
            case 'clear':
                document.getElementById('consoleOutput').innerHTML = '';
                this.console.messages = [];
                break;
            
            default:
                this.addConsoleMessage(`未知命令: ${cmd}。输入'help'获取可用命令列表。`, 'error');
                break;
        }
    }
    
    // 更新背包UI
    updateInventoryUI() {
        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';
        
        if (!this.playerConfig.inventory || this.playerConfig.inventory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'inventory-empty';
            emptyMsg.textContent = '背包是空的';
            inventoryList.appendChild(emptyMsg);
            return;
        }
        
        this.playerConfig.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `inventory-item ${item.equipped ? 'equipped' : ''}`;
            
            itemElement.innerHTML = `
                <div class="inventory-item-icon">${item.icon || '📦'}</div>
                <div class="inventory-item-details">
                    <div class="inventory-item-name">${item.name}</div>
                    <div class="inventory-item-description">${item.description || ''}</div>
                </div>
                <div class="inventory-item-quantity">x${item.quantity}</div>
            `;
            
            // 点击道具显示详情
            itemElement.addEventListener('click', () => {
                this.addConsoleMessage(`物品: ${item.name}`, 'system');
                this.addConsoleMessage(`${item.description || '没有描述'}`, 'info');
                if (item.effect) {
                    const effects = Object.entries(item.effect)
                        .map(([key, value]) => `${key}: ${value > 0 ? '+' : ''}${value}`)
                        .join(', ');
                    this.addConsoleMessage(`效果: ${effects}`, 'info');
                }
            });
            
            inventoryList.appendChild(itemElement);
        });
    }
    
    // 更新属性UI
    updateAttributesUI() {
        const attributesList = document.getElementById('attributesList');
        attributesList.innerHTML = '';
        
        if (!this.playerConfig.attributes) return;
        
        const attrs = this.playerConfig.attributes;
        
        // 创建生命值、魔法值和经验条
        const hpElement = document.createElement('div');
        hpElement.innerHTML = `
            <div class="attribute">
                <span class="attribute-name">生命值</span>
                <span class="attribute-value">${attrs.health}/${attrs.maxHealth}</span>
            </div>
            <div class="health-bar">
                <div class="health-bar-fill" style="width: ${(attrs.health / attrs.maxHealth) * 100}%"></div>
            </div>
        `;
        attributesList.appendChild(hpElement);
        
        const mpElement = document.createElement('div');
        mpElement.innerHTML = `
            <div class="attribute">
                <span class="attribute-name">魔法值</span>
                <span class="attribute-value">${attrs.mana}/${attrs.maxMana}</span>
            </div>
            <div class="mana-bar">
                <div class="mana-bar-fill" style="width: ${(attrs.mana / attrs.maxMana) * 100}%"></div>
            </div>
        `;
        attributesList.appendChild(mpElement);
        
        if (attrs.experience !== undefined && attrs.nextLevel !== undefined) {
            const expElement = document.createElement('div');
            expElement.innerHTML = `
                <div class="attribute">
                    <span class="attribute-name">经验值</span>
                    <span class="attribute-value">${attrs.experience}/${attrs.nextLevel}</span>
                </div>
                <div class="exp-bar">
                    <div class="exp-bar-fill" style="width: ${(attrs.experience / attrs.nextLevel) * 100}%"></div>
                </div>
            `;
            attributesList.appendChild(expElement);
        }
        
        // 添加其他属性
        const otherAttrs = ['level', 'strength', 'dexterity', 'intelligence'];
        otherAttrs.forEach(attr => {
            if (attrs[attr] !== undefined) {
                const element = document.createElement('div');
                element.className = 'attribute';
                element.innerHTML = `
                    <span class="attribute-name">${this.getAttributeDisplayName(attr)}</span>
                    <span class="attribute-value">${attrs[attr]}</span>
                `;
                attributesList.appendChild(element);
            }
        });
    }
    
    // 获取属性显示名称
    getAttributeDisplayName(attr) {
        const nameMap = {
            'level': '等级',
            'strength': '力量',
            'dexterity': '敏捷',
            'intelligence': '智力'
        };
        return nameMap[attr] || attr;
    }
}

// 当文档加载完成时初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 