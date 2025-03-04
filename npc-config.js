// NPC配置表
const npcConfig = {
    "1": {
        id: "1",
        name: "村长",
        sprite: "👴", // 使用emoji作为简单图形
        items: ["任务卷轴", "钥匙"],
        dialogue: "牛英超，你好",
        function: "quest_giver",
        alertness: 70  // 警戒值高，很难偷到东西
    },
    "2": {
        id: "2",
        name: "商人",
        sprite: "👨",
        items: ["药水", "剑", "盾牌"],
        dialogue: "要买些什么吗？我这里应有尽有！",
        function: "shop",
        alertness: 60  // 比较警惕
    },
    "3": {
        id: "3",
        name: "铁匠",
        sprite: "🔨",
        items: ["铁剑", "铁盾"],
        dialogue: "需要武器装备吗？我可以帮你打造！",
        function: "blacksmith",
        alertness: 40  // 专注于工作，警惕性一般
    },
    "4": {
        id: "4",
        name: "农民",
        sprite: "👩‍🌾",
        items: ["小麦", "胡萝卜"],
        dialogue: "今年的收成不错！",
        function: "none",
        alertness: 30  // 比较单纯，容易得手
    },
    "5": {
        id: "5",
        name: "守卫",
        sprite: "💂",
        items: ["钢剑"],
        dialogue: "止步！这里是禁地！",
        function: "guard",
        alertness: 90  // 非常警惕
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