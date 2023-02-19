"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'uof-status-watchdog-koishi';
exports.Config = koishi_1.Schema.object({
    broadcastGroup: koishi_1.Schema.string().description(`用于发送状态通知的群聊。`),
    broadcastErrorOnly: koishi_1.Schema.boolean().description(`开启后，只在有服务器出现异常时才会发送状态通知。`),
    detectInterval: koishi_1.Schema.number().description(`检测状态的时间间隔（1-60 分钟）。`),
    uofsServer: koishi_1.Schema.string().description(`UOF Status 服务端 API 地址`)
});
async function apply(ctx, config) {
    //初始化
    var _serverList = await getClientList();
    console.log("uofs-wd ready");
    //初始化结束
    ctx.middleware(async (session, next) => {
        async function broadcast(content) {
            await session.bot.broadcast([`${config.broadcastGroup}`], `${content}`);
        }
        ctx.cron(`*/${config.detectInterval} * * * *`, async () => {
            let statusArray = getAllStatusArray();
            if (config.broadcastErrorOnly && isAllClientOnline(statusArray)) {
                return;
            }
            let t = await renderStatusText(await getAllStatusArray());
            broadcast(t);
        });
        return next();
    });
    async function getClientList() {
        let resp = ctx.http.get(`${config.uofsServer}/server/get`);
        return await resp;
    }
    async function getClientStatus(id) {
        let resp = ctx.http.get(`${config.uofsServer}/status/get/${id}`);
        return await resp;
    }
    async function getAllStatusArray() {
        let statusArray = [];
        for await (let i of _serverList) {
            let client = await getClientStatus(i.id);
            let statusString = "离线";
            if (client.status === true) {
                statusString = "在线";
            }
            statusArray.push({ "name": i.name, "status": client.status, "statusString": statusString });
        }
        return statusArray;
    }
    async function isAllClientOnline(statusArray) {
        let tf = true;
        statusArray.forEach(item => {
            if (item.status != true) {
                tf = false;
            }
        });
        return tf;
    }
    async function renderStatusText(statusArray) {
        let text = "";
        let totalCount = 0;
        let availableCount = 0;
        let availableEmoji = "⚠️";
        text += "UOF_Status 服务器状态报告" + "\n";
        text += new Date() + "\n";
        text += "——————————————" + "\n";
        statusArray.forEach(item => {
            totalCount += 1;
            let statusEmoji = "⛔";
            if (item.status === true) {
                availableCount += 1;
                statusEmoji = "✅";
            }
            text += statusEmoji + " " + item.name + ": " + item.statusString + "\n";
        });
        let availablePercentage = Math.floor(availableCount / totalCount * 100);
        if (availablePercentage == 100) {
            availableEmoji = "✅";
        }
        text += "——————————————" + "\n";
        text += availableEmoji + " " + `可用性：${availablePercentage}%（${totalCount - availableCount}个服务离线）` + "\n";
        return text;
    }
    ctx.command("uofs-wd", "UOF Status 状态监控服务");
    ctx.command("uofs-wd.update", "更新服务器列表")
        .action(async (_) => {
        _serverList = await getClientList();
        _.session.send(JSON.stringify(_serverList));
    });
    ctx.command("uofs-wd.status", "获取服务器状态").alias("us")
        .action(async (_) => {
        _.session.send(await renderStatusText(await getAllStatusArray()));
    });
    ctx.command("ud")
        .action(async (_) => {
        _.session.send(JSON.stringify(_serverList));
    });
}
exports.apply = apply;
