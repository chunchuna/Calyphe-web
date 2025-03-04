// NPC配置表
const npcConfig = {
    "1": {
        id: "1",
        name: "村长",
        sprite: "👴", // 使用emoji作为简单图形
        items: ["任务卷轴", "钥匙"],
        dialogue: "欢迎来到我们的村庄，年轻人！",
        function: "quest_giver"
    },
    "2": {
        id: "2",
        name: "商人",
        sprite: "👨",
        items: ["药水", "剑", "盾牌"],
        dialogue: "要买些什么吗？我这里应有尽有！",
        function: "shop"
    },
    "3": {
        id: "3",
        name: "铁匠",
        sprite: "🔨",
        items: ["铁剑", "铁盾"],
        dialogue: "需要武器装备吗？我可以帮你打造！",
        function: "blacksmith"
    },
    "4": {
        id: "4",
        name: "农民",
        sprite: "👩‍🌾",
        items: ["小麦", "胡萝卜"],
        dialogue: "今年的收成不错！",
        function: "none"
    },
    "5": {
        id: "5",
        name: "守卫",
        sprite: "💂",
        items: ["钢剑"],
        dialogue: "止步！这里是禁地！",
        function: "guard"
    },
    "6": {
        id: "6",
        name: "Master",
        sprite: "💂",
        items: ["游戏手册","传送钥匙"],
        dialogue: "游戏从这里开始！",
        function: "guard-new"
    }
};

// 如果在Node.js环境下
if (typeof module !== 'undefined' && module.exports) {
    module.exports = npcConfig;
} 