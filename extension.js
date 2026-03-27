import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { Player } from "../../noname/library/element/player.js";
game.import("extension", function () {
    return {
        name: "练习", content: function (config, pack) {

        }, precontent: function () {



        }, config: {}, help: {}, package: {

            character: {//武将
                character: { //武将注册
                    "in_test": ["female", "RN", 3, ["huodehongsha", "huodeheisha", "benzhi2", "huodehongsha", "benzhi1"], []],//测试武将
                    "haerfude": ["female", "USN", 3, ["zhiqiu", "zhiqiu2", "huodezhuangbei", "huodeleisha", "shuiji1", "huidang"], []],//哈尔福德注册
                },
                translate: {//武将翻译
                    "in_test": "武将名字七个字",
                    "haerfude": "哈尔福德",
                },
            },

            card: {//卡技能
                card: {
                },
                translate: {
                },
                list: [],
            },

            skill: {//技能
                skill: {

                    zhiqiu: {//掷球，只是看牌的。ai写了，没语音
                        locked: true,//锁定技
                        ai: {//全在ai里面
                            viewHandcard: function (player) {//这部分不知道做什么的，注释掉以后可能看不了手牌
                                if (!player.hasEmptySlot(5) || player.hasSkill('shuiji1_used')) {//装备5是宝具，或水机没有用过
                                    return false;//符合条件的话失效
                                }
                                return true;//否则生效
                            },
                            skillTagFilter(player, tag, arg) {//这是给ai的
                                if (!player.hasEmptySlot(5) || player.hasSkill('shuiji1_used')) {//有宝具或者用过水机的时候
                                    return false;//失效
                                }
                                if (player == arg) { // 且加上过滤器，防止对自己使用
                                    return false;
                                }
                                return true;//否则生效
                            },
                        },
                    },
                    zhiqiu2: {//掷球2，只是改杀的。ai和语音写了
                        locked: true,
                        audio: "ext:舰R牌将/audio/skill:true",
                        mod: {
                            cardnature: function (card, player) {//要修改牌的属性
                                if (player.hasSkill('shuiji1_used'))
                                    return card.nature;//如果水机用过，返回原属性
                                //下面是没用过水机的处理
                                if ((card.name == "sha" || card.name == 'sheji9') && card.nature == "thunder") //当是杀而且是鱼雷属性时，执行处理
                                    return false;//处理的内容，把的属性改成无。
                                return card.nature;//否则返回原属性
                            },
                        },
                        ai: {//ai部分
                            threaten: 1.5,//威胁值1.5
                        },
                    },
                    shuiji1: {//水机，视为使用桃或无懈可击。语音写了，ai有
                        audio: "ext:舰R牌将/audio/skill:true",//r杀的语音这样写，如果多个的话true写2
                        enable: "chooseToUse",//主动技，技能触发阶段。这里指的出牌阶段。如果多个阶段可以使用数组写好几个
                        filter: function (event, player) {//对技能能不能生效的检查。
                            if (player.hasSkill('shuiji1_used')) return false;//不能一轮发动多次
                            for (var name of ['tao', 'wuxie']) {//检查【桃】和【无懈可击】
                                if (event.filterCard({ name: name, isCard: true }, player, event)) return true;//检查当前事件能不能使用【桃】或者【无懈可击】
                            }
                            return false;//不能使用则不能发动
                        },
                        hiddencard: function (player, name) {//隐藏牌技能标签（还没完全理解）
                            if (name == 'wuxie' || name == 'tao')//如果是无懈可击或桃
                                return true;//隐藏牌面
                        },
                        chooseButton: {//选择按钮技能标签
                            dialog: function (event, player) {//选择按钮时的对话框
                                var vcards = [];//存放按钮的数组
                                for (var name of ['tao', 'wuxie']) {//检查【桃】和【无懈可击】
                                    var card = { name: name, isCard: true };//创建牌对象
                                    if (event.filterCard(card, player, event)) vcards.push(['基本', '', name]);//如果能使用就加入按钮数组
                                }
                                var dialog = ui.create.dialog('水机', [vcards, 'vcard'], 'hidden');//创建对话框
                                //dialog.direct = true;//直接选择按钮，这段注释掉就需要选牌了
                                return dialog;//返回对话框
                            },
                            backup: function (links, player) {//选择按钮后的备选方案
                                return {//返回一个使用牌的事件
                                    filterCard: () => false,//不需要选牌，如果改成f会导致使用技能全弃牌                                   
                                    selectCard: -1,//不需要选择牌为代价
                                    viewAs: {//视为使用牌
                                        name: links[0][2],//牌名？
                                        isCard: true,//是牌？
                                    },
                                    popname: true,//显示牌名
                                    precontent: function () {//使用牌前的处理
                                        player.logSkill('shuiji1');//记录技能发动日志
                                        player.addTempSkill('shuiji1_used', 'roundStart');//给玩家添加一轮一次的技能标记，防止多次发动，前缀下划线是全局的标签，否则北大技能用不了
                                    },
                                }
                            },
                            prompt: function (links, player) {//选择按钮时的提示语
                                return '水机：视为使用一张【' + get.translation(links[0][2]) + '】';
                            },
                        },
                        ai: {
                            basic: {//从原版桃抄的，基础部分。这里是权重方面
                                order: (card, player) => {//pretao标签用的接口，某些技能用的
                                    if (player.hasSkillTag("pretao")) return 9;//如果在桃之前权重9
                                    return 2;//否则权重2
                                },
                                useful: (card, i) => {//考虑保留牌的部分，弃牌阶段用
                                    let player = _status.event.player;//检查场上的玩家
                                    if (!game.checkMod(card, player, "unchanged", "cardEnabled2", player))//检查一遍场上玩家挂的mod效果，如果这些效果需要桃，那么返回字符串unchange
                                        return 2 / (1 + i);//如果不需要桃，那么把桃的价值权重降到无限小

                                    let fs = game.filterPlayer((current) => {//敌我识别。游戏，玩家列表，当前角色
                                        //current只是表示当前角色
                                        return get.attitude(player, current) > 0 //态度大于0
                                        &&//且
                                         current.hp <= 2;//血量小于2
                                         //说明这个友军快死了
                                    }),
                                    //前面筛选了血量少于2的友军
                                    //在这些血量少于2的友军中
                                        damaged = 0,//不需要救的友军数量计数器重置。受伤
                                        needs = 0;//需要救的友军数量计数器重置。濒死
                                    fs.forEach((f) => {
                                        if (f.hp > 3 //血量大于3
                                            || //或
                                            !lib.filter.cardSavable(card, player, f)) //这张牌（桃）够不到的（f）

                                            return;//有“！”意思是反向，也就是计数改为不计数
                                        
                                        if (f.hp > 1) damaged++;//如果血量大于1归为不需要救
                                        else needs++;//血量不大于1救
                                    });
                                    //这时候damaged是血量2的能救的友军数量。受伤
                                    //needs是血量1的能救的友军数量。濒死

                                    //下面是保留牌的最终权衡计算
                                    if (needs && damaged) //判断濒死和受伤都有时
                                        return 5 * needs + 3 * damaged;//计算权重，濒死权重*5受伤*3
                                    if (needs + damaged > 1 || player.hasSkillTag("maixie")) //濒死和受伤大于1或者自己有卖血标签时
                                        return 8;//留桃权重8
                                        //前面都没拦下说明没人需要救
                                    if (player.hp / player.maxHp < 0.7)//自己血量不足70%时
                                        return 7 + Math.abs(player.hp / player.maxHp - 0.5);//血量百分比-0.5以后取绝对值。0.5就是个基准数，没实际意义
                                    if (needs) //如果有濒死
                                        return 7;//7权重
                                    if (damaged) //如果有受伤
                                        return Math.max(3, 7.8 - i);//手里桃越多权重越低，i是关于几张的基础权重，通过取权重和3的最大值实现最低权重3。7.8是基数。
                                    return Math.max(1, 7.2 - i);//上面都没的话。桃越多越高，权重不低于1，7.2是基数
                                },
                                value: (card, player) => {//考虑牌的总体价值
                                    let fs = game.filterPlayer((current) => {//还是盟友筛选
                                        return get.attitude(_status.event.player, current) > 0;
                                    }),
                                        damaged = 0,//受伤
                                        needs = 0;//濒死
                                        //上面还是先定义变量
                                    fs.forEach((f) => {//统计受伤
                                        if (!player.canUse("tao", f)) return;//够不着
                                        if (f.hp <= 1) needs++;//濒死的记录
                                        else if (f.hp == 2) damaged++;//受伤的记录
                                    });
                                    if ((needs && damaged) || player.hasSkillTag("maixie"))//有濒死和受伤都有或者有卖血将
                                        return Math.max(9, 5 * needs + 3 * damaged);//至少9。濒死*5受伤*3
                                    if (needs || damaged > 1) return 8;//有濒死或者受伤大于1，8权重
                                    //如果受伤大于1上面就截住了，所以喵能被下面截住只有一个受伤
                                    if (damaged) return 7.5;//有受伤7.5权重
                                    //上面把别人需要桃的都写了，没人需要桃就会落到这里。
                                    return Math.max(5, 9.2 - player.hp);
                                },
                            },
                            result: {//关于使用的决策
                                target: (player, target) => {//评估对目标使用桃的收益
                                    if (target.hasSkillTag("maixie")) //是否是卖血将
                                        return 3;//是的话3
                                    return 2;//不是的话2
                                },
                                target_use: (player, target, card) => {
                                    let mode = get.mode(),//获取游戏模式
                                        taos = player.getCards(
                                            "hs",//手牌范围
                                            (i) =>
                                                get.name(i) === "tao" &&
                                                lib.filter.cardEnabled(i, target, "forceEnable")
                                        );
                                    if (target !== _status.event.dying) {
                                        if (
                                            !player.isPhaseUsing() ||
                                            player.hasSkillTag(
                                                "nokeep",
                                                true,
                                                {
                                                    card: card,
                                                    target: target,
                                                },
                                                true
                                            )
                                        )
                                            return 2;
                                        let min = 7.2 - (4 * player.hp) / player.maxHp,
                                            nd = player.needsToDiscard(0, (i, player) => {
                                                return (
                                                    !player.canIgnoreHandcard(i) &&
                                                    (taos.includes(i) || get.value(i) >= min)
                                                );
                                            }),
                                            keep = nd ? 0 : 2;
                                        if (
                                            nd > 2 ||
                                            (taos.length > 1 && (nd > 1 || (nd && player.hp < 1 + taos.length))) ||
                                            (target.identity === "zhu" &&
                                                (nd || target.hp < 3) &&
                                                (mode === "identity" || mode === "versus" || mode === "chess")) ||
                                            !player.hasFriend()
                                        )
                                            return 2;
                                        if (
                                            game.hasPlayer((current) => {
                                                return (
                                                    player !== current &&
                                                    current.identity === "zhu" &&
                                                    current.hp < 3 &&
                                                    (mode === "identity" || mode === "versus" || mode === "chess") &&
                                                    get.attitude(player, current) > 0
                                                );
                                            })
                                        )
                                            keep = 3;
                                        else if (nd === 2 || player.hp < 2) return 2;
                                        if (nd === 2 && player.hp <= 1) return 2;
                                        if (keep === 3) return 0;
                                        if (taos.length <= player.hp / 2) keep = 1;
                                        if (
                                            keep &&
                                            game.countPlayer((current) => {
                                                if (
                                                    player !== current &&
                                                    current.hp < 3 &&
                                                    player.hp > current.hp &&
                                                    get.attitude(player, current) > 2
                                                ) {
                                                    keep += player.hp - current.hp;
                                                    return true;
                                                }
                                                return false;
                                            })
                                        ) {
                                            if (keep > 2) return 0;
                                        }
                                        return 2;
                                    }
                                    if (target.isZhu2() || target === game.boss) return 2;
                                    if (player !== target) {
                                        if (target.hp < 0 && taos.length + target.hp <= 0) return 0;
                                        if (Math.abs(get.attitude(player, target)) < 1) return 0;
                                    }
                                    if (!player.getFriends().length) return 2;
                                    let tri = _status.event.getTrigger(),
                                        num = game.countPlayer((current) => {
                                            if (get.attitude(current, target) > 0)
                                                return current.countCards(
                                                    "hs",
                                                    (i) =>
                                                        get.name(i) === "tao" &&
                                                        lib.filter.cardEnabled(i, target, "forceEnable")
                                                );
                                        }),
                                        dis = 1,
                                        t = _status.currentPhase || game.me;
                                    while (t !== target) {
                                        let att = get.attitude(player, t);
                                        if (att < -2) dis++;
                                        else if (att < 1) dis += 0.45;
                                        t = t.next;
                                    }
                                    if (mode === "identity") {
                                        if (tri && tri.name === "dying") {
                                            if (target.identity === "fan") {
                                                if (
                                                    (!tri.source && player !== target) ||
                                                    (tri.source &&
                                                        tri.source !== target &&
                                                        player.getFriends().includes(tri.source.identity))
                                                ) {
                                                    if (
                                                        num > dis ||
                                                        (player === target &&
                                                            player.countCards("hs", { type: "basic" }) > 1.6 * dis)
                                                    )
                                                        return 2;
                                                    return 0;
                                                }
                                            } else if (
                                                tri.source &&
                                                tri.source.isZhu &&
                                                (target.identity === "zhong" || target.identity === "mingzhong") &&
                                                (tri.source.countCards("he") > 2 ||
                                                    (player === tri.source &&
                                                        player.hasCard((i) => i.name !== "tao", "he")))
                                            )
                                                return 2;
                                            //if(player!==target&&!target.isZhu&&target.countCards('hs')<dis) return 0;
                                        }
                                        if (player.identity === "zhu") {
                                            if (
                                                player.hp <= 1 &&
                                                player !== target &&
                                                taos + player.countCards("hs", "jiu") <=
                                                Math.min(
                                                    dis,
                                                    game.countPlayer((current) => {
                                                        return current.identity === "fan";
                                                    })
                                                )
                                            )
                                                return 0;
                                        }
                                    } else if (
                                        mode === "stone" &&
                                        target.isMin() &&
                                        player !== target &&
                                        tri &&
                                        tri.name === "dying" &&
                                        player.side === target.side &&
                                        tri.source !== target.getEnemy()
                                    )
                                        return 0;
                                    return 2;
                                },
                            },
                            tag: {
                                recover: 1,
                                save: 1,
                            },

                        },


                        subSkill: {//新开一轮的时候洗一遍
                            used: {
                                mark: true,
                                intro: {
                                    content: "本轮已发动",
                                },
                                sub: true,
                                "_priority": 0,
                            },
                        },
                        "_priority": 0,
                    },
                    benzhi1: {//本职,只是改杀。语音写了，ai写了
                        audio: "ext:舰R牌将/audio/skill:true",
                        locked: true,//锁定技
                        mod: {
                            cardnature: function (card, player, colo) {//要修改牌的属性

                                if (card.name == "sha" || get.color(card) == "black")//当是杀或者是黑色牌时，执行处理
                                    return card.nature = "thunder"; //处理的内容，把黑色的杀改成鱼雷属性.
                                if (card.name == "sha" || get.color(card) == "red")//当是杀或者是红色牌时，执行处理
                                    return card.nature = "fire"; //处理的内容，把红色的杀改成火属性.
                                return card.nature;//否则返回原属性
                            },
                        },
                        ai: {//ai部分
                            threaten: 1.5,//威胁值1.5
                        },
                    },
                    benzhi2: {//本职2,杀的mod效果。语音写了，ai有
                        audio: "ext:舰R牌将/audio/skill:true",
                        locked: true,//锁定技
                        mod: {
                            targetInRange(card, player, target) {//独角受让用这个无限，如果是无限距离会导致所有操作都无限射程
                                if (get.color(card) == 'black' && !player.hasSkill('olsbduoshou_used'))//当是黑色牌时
                                    return true;
                            },
                            cardUsable: function (card, player, num) {
                                if (card.name == "sha" && get.color(card) == "red")//当是红杀时
                                    return Infinity;//使用次数无限
                            },
                        },
                        ai: {//ai部分
                            threaten: 1.5,//威胁值1.5
                        },
                    },
                    huidang: {//回档。ai和语音写了
                        audio: "ext:舰R牌将/audio/skill:true",
                        limited: true,//限定技
                        trigger: {//触发时机,
                            player: "phaseBegin"//准备阶段
                        },
                        //要加判定一下有没有要删的技能
                        filter: function (event, player) {//对技能能不能生效的检查。
                            if (player.hasSkill('benzhi1') && player.hasSkill('benzhi2')) //如果有本职就不能发动
                                return false;
                            return player.hasSkill('zhiqiu') && player.hasSkill('shuiji1');//有掷球和水机才能发动
                        },
                        ai: {//ai部分
                            order: 1,//优先级1
                            result: {
                                player: 3,//对自己的评价是3
                            },
                            threaten: 1.5,//威胁值1.5
                        },//ai写的
                        content: function () {//技能效果在这里
                            player.awakenSkill('huidang');//记录下回档是个觉醒技能，这样后面就不会再发动了
                            player.removeSkill('zhiqiu');//失去掷球
                            player.removeSkill('zhiqiu2');//失去掷球2
                            player.removeSkill('shuiji1');//失去水机
                            player.addSkills('benzhi1');//获得本职1
                            player.addSkills('benzhi2');//获得本职2
                            trigger.cancel();//跳过了自己的回合
                            player.recover(1);//回复一点体力

                            var card = get.cardPile(function (card) {//从牌堆和弃牌堆中获得一张杀
                                return card.name == 'sheji9';//杀的定义 ，指的要找的牌
                            });
                            if (card) {
                                player.gain(card, 'gain2');//如果找到了就获得
                            }
                        },
                    },

                    in_lj: {
                        audio: 2,//几个语音随机。这里指的两个语音
                        audioname: ["re_diaochan"],//语音的名字
                        enable: "phaseUse",//主动技，技能触发阶段。这里指的出牌阶段。如果多个阶段可以使用数组写好几个
                        usable: 1,//技能标签。这里指的只能选择一位玩家发动。

                        filter(event, player) {//对技能能不能生效的检查。
                            return game.countPlayer(current => current != player && current.hasSex('female')) > 1;//调用玩家数据检查其中为女性的数量，如果大于1则为t
                        },

                        check(card) { return 10 - get.value(card) },//ai决策使用盘的范围。这里指的价值小于10的牌。
                        filterCard: true,//技能标签。这里指的
                        position: "he",//技能标签。这里指的使用牌的范围。h代表手牌e代表装备。这里指的可以用手牌或者装备牌

                        filterTarget(card, player, target) {
                            // 不能选择自己作为目标
                            if (player == target) return false;
                            // 目标必须为女性角色
                            if (!target.hasSex('female')) return false;
                            // 当已选择一个目标时，检查是否可以对另一个目标使用决斗
                            if (ui.selected.targets.length == 1) {
                                return target.canUse({ name: 'juedou' }, ui.selected.targets[0]);
                            }
                            // 默认情况下允许选择
                            return true;
                        },
                        targetprompt: ["先出杀", "后出杀"],
                        selectTarget: 2,
                        multitarget: true,

                        async content(event, trigger, player) {
                            // 让目标玩家使用决斗卡牌攻击另一名玩家
                            const useCardEvent = event.targets[1].useCard({ name: 'juedou', isCard: true }, 'nowuxie', event.targets[0], 'noai');
                            // 禁用卡牌使用动画效果
                            useCardEvent.animate = false;
                            // 延迟0.5秒执行后续操作
                            game.asyncDelay(0.5);
                        },
                        ai: {
                            order: 8,//优先级是8？
                            result: {
                                target(player, target) {
                                    if (ui.selected.targets.length == 0) {
                                        return -3;
                                    }
                                    else {
                                        return get.effect(target, { name: 'juedou' }, ui.selected.targets[0], target);
                                    }
                                },
                            },
                            expose: 0.4,
                            threaten: 3,
                        },
                        "_priority": 0,

                    },
                    in_by: {//闭月/摸牌技能（回合结束摸牌）
                        frequent: true,
                        trigger: {
                            player: "phaseEnd"
                        },
                        content: function () {
                            player.draw(1);
                        },
                        "_priority": 0,
                    },
                    huodeleisha: {//获得雷杀
                        nobracket: true,
                        enable: "phaseUse",//主动技，技能触发阶段。
                        content: function () {//技能内容
                            var card = get.cardPile2(function (card) {//从卡堆里找牌
                                return card.name == 'sheji9' && card.nature == 'thunder';  //雷杀的定义 ，指的要找的牌                                                  
                            });
                            if (card) player.gain(card, "gain2", "log");//如果找到了就获得
                        },
                    },
                    huodehongsha: {//获得红杀
                        nobracket: true,
                        enable: "phaseUse",//主动技，技能触发阶段。
                        content: function () {//技能内容
                            var card = get.cardPile2(function (card) {//从卡堆里找牌
                                return card.name == 'sheji9' && get.color(card) == "red"; //红杀的定义 ，指的要找的牌                                              
                            });
                            if (card) player.gain(card, "gain2", "log");//如果找到了就获得
                        },
                    },
                    huodeheisha: {//获得黑杀
                        nobracket: true,
                        enable: "phaseUse",//主动技，技能触发阶段。
                        content: function () {//技能内容
                            var card = get.cardPile2(function (card) {//从卡堆里找牌
                                return card.name == 'sheji9' && get.color(card) == "black"; //黑杀的定义 ，指的要找的牌                                              
                            });
                            if (card) player.gain(card, "gain2", "log");//如果找到了就获得
                        },
                    },



                },
                translate: {//技能翻译






                    in_by: "摸牌",
                    shuiji1: "水机",
                    shuiji1_info: `出牌阶段，你可以视为使用一张【桃】或【无懈可击】（每轮限一次）。`,
                    huodeleisha: "获得雷杀",
                    huodeleisha_info: `出牌阶段，你可以获得一张雷属性的杀。`,
                    huodesha: "获得杀",
                    huodeleisha_info: `出牌阶段，你可以获得一张杀。`,
                    huodehongsha: "获得红杀",
                    huodehongsha_info: `出牌阶段，你可以获得一张红色的杀。`,
                    huodeheisha: "获得黑杀",
                    huodeheisha_info: `出牌阶段，你可以获得一张黑色的杀。`,
                    benzhi1: "本职1",
                    benzhi1_info: `红杀改火黑杀改雷。`,
                    benzhi2: "本职2",
                    benzhi2_info: `黑色牌对你无限射程；你使用红色【杀】无限次。`,
                    zhiqiu: "掷球",

                    zhiqiu2: "掷球",
                    huidang: "回档",
                    huidang_info: `准备阶段，你可以失去掷球和水机，获得本职，然后跳过出牌和弃牌阶段。若如此做，你回复一点体力，然后从牌堆和弃牌堆中获得一张杀。`,
                    in_lj: "决斗",
                    in_lj_info: `出牌阶段，你可以选择两名女性角色。该两名角色依次对对方使用一张【决斗】。每轮限一次。`,
                    in_by: "闭月",


                    in_by_info: `回合结束时，你摸一张牌。`,
                    //技能翻译
                },
            },



            intro: "",
            author: "无名玩家",
            diskURL: "",
            forumURL: "",
            version: "1.0",
            files: { "character": [], "card": [], "skill": [], "audio": [] }


        }
    }
}
)






