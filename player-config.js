// 玩家配置数据
const playerConfig = {
    // 基本属性
    attributes: {
        health: 5,
        maxHealth: 5,
        mana: 50,
        maxMana: 50,
        strength: 8,
        dexterity: 12,
        intelligence: 10,
        level: 1,
        experience: 0,
        nextLevel: 100
    },
    
    // 背包物品
    inventory: [
        {
            id: "health_potion",
            name: "生命药水",
            icon: "🧪",
            description: "恢复20点生命值",
            quantity: 3,
            type: "consumable",
            effect: {
                health: 20
            }
        },
        {
            id: "mana_potion",
            name: "魔法药水",
            icon: "🧫",
            description: "恢复15点魔法值",
            quantity: 2,
            type: "consumable",
            effect: {
                mana: 15
            }
        },
        {
            id: "bronze_sword",
            name: "青铜剑",
            icon: "🗡️",
            description: "基础武器，+3攻击力",
            quantity: 1,
            type: "weapon",
            effect: {
                damage: 3
            },
            equipped: true
        },
        {
            id: "leather_armor",
            name: "皮革护甲",
            icon: "🥋",
            description: "基础护甲，+2防御力",
            quantity: 1,
            type: "armor",
            effect: {
                defense: 2
            },
            equipped: true
        },
        {
            id: "old_map",
            name: "破旧的地图",
            icon: "🗺️",
            description: "记录着某处宝藏的位置",
            quantity: 1,
            type: "quest",
            effect: {}
        }
    ],
    
    // 任务日志
    quests: [
        {
            id: "main_quest",
            title: "找到圣杯",
            description: "找到圣杯是游戏的最终目的",
            status: "active"
        },
    ]
};

// 如果在Node.js环境下
if (typeof module !== 'undefined' && module.exports) {
    module.exports = playerConfig;
} 