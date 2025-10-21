/***************
 * 基础数据集 *
 ***************/
const ABILS = ["力量","敏捷","体质","智力","感知","魅力"];

// 种族（标题/提示 + 属性加值）
const RACES = [
  { name:"人类", bonus:{ 力量:1, 敏捷:1, 体质:1, 智力:1, 感知:1, 魅力:1 }, tip:"所有属性 +1" },
  { name:"精灵", bonus:{ 敏捷:2 }, tip:"+2 敏捷" },
  { name:"矮人", bonus:{ 体质:2 }, tip:"+2 体质" },
  { name:"半身人", bonus:{ 敏捷:2 }, tip:"+2 敏捷" },
  { name:"半精灵", bonus:{ 魅力:2 }, tip:"+2 魅力（简化）" },
  { name:"龙裔", bonus:{ 力量:2, 魅力:1 }, tip:"+2 力量，+1 魅力" },
  { name:"侏儒", bonus:{ 智力:2 }, tip:"+2 智力" },
  { name:"半兽人", bonus:{ 力量:2, 体质:1 }, tip:"+2 力量，+1 体质" }
];

// 技能 → 对应能力
const SKILL_TO_ABILITY = {
  "运动":"力量",
  "特技":"敏捷",
  "巧手":"敏捷",
  "隐匿":"敏捷",
  "奥秘":"智力",
  "历史":"智力",
  "调查":"智力",
  "自然":"智力",
  "宗教":"智力",
  "驯兽":"感知",
  "洞察":"感知",
  "医药":"感知",
  "察觉":"感知",
  "求生":"感知",
  "欺瞒":"魅力",
  "威吓":"魅力",
  "表演":"魅力",
  "游说":"魅力",
};

// 职业（描述/推荐属性 + 自动获得2项技能熟练）
const CLASSES = [
  { name:"战士", rec:"力量、体质", desc:"前线多面手。", autoProfs:["运动","察觉"] },
  { name:"盗贼", rec:"敏捷", desc:"潜行与精确。", autoProfs:["隐匿","巧手"] },
  { name:"法师", rec:"智力", desc:"学识与法术。", autoProfs:["奥秘","历史"] },
  { name:"牧师", rec:"感知", desc:"神术与守护。", autoProfs:["宗教","医药"] },
  { name:"游侠", rec:"敏捷、感知", desc:"荒野猎人。", autoProfs:["求生","察觉"] },
  { name:"圣武士", rec:"力量、魅力", desc:"圣光战士。", autoProfs:["威吓","宗教"] },
  { name:"术士", rec:"魅力", desc:"天赋魔力。", autoProfs:["欺瞒","游说"] },
  { name:"野蛮人", rec:"力量", desc:"狂怒与韧性。", autoProfs:["运动","求生"] },
  { name:"吟游诗人", rec:"魅力", desc:"歌声与魔法。", autoProfs:["表演","游说"] },
  { name:"德鲁伊", rec:"感知", desc:"自然与变形。", autoProfs:["自然","驯兽"] },
  { name:"武僧", rec:"敏捷、感知", desc:"身法与禅意。", autoProfs:["特技","察觉"] },
];

// 背景（描述 + 自动获得1项技能熟练）
const BACKGROUNDS = [
  { name:"士兵", desc:"历经沙场。", autoProf:"威吓" },
  { name:"学者", desc:"博览群书。", autoProf:"历史" },
  { name:"罪犯", desc:"暗影行走。", autoProf:"欺瞒" },
  { name:"贵族", desc:"出身显赫。", autoProf:"游说" },
  { name:"荒野流浪者", desc:"与自然为伴。", autoProf:"求生" },
];

// 事件池（D&D 探险叙述，技能、DC、奖励范围）
const ITEM_POOL = ["草药","狼皮","古老符文","木板","绳索","破旧短剑","金币袋"];
const EVENTS = [
  { text:"你在森林深处发现了一条古老的小径，似乎通往某处遗迹。", skill:"察觉", dc:[10,18] },
  { text:"一处崩裂的峭壁阻挡了去路，你尝试攀爬通过。", skill:"运动", dc:[10,18] },
  { text:"你在废墟中辨识刻文，试图解读其含义。", skill:"奥秘", dc:[10,18] },
  { text:"薄雾中传来低吼，你安抚野兽避免冲突。", skill:"驯兽", dc:[10,18] },
  { text:"你在雨夜隐藏行迹，试图绕过巡逻。", skill:"隐匿", dc:[10,18] },
  { text:"你审视伤口并进行处理。", skill:"医药", dc:[10,18] },
  { text:"你寻找可食用的植物和足迹。", skill:"求生", dc:[10,18] },
  { text:"你与守门士兵交涉，试图说服其放行。", skill:"游说", dc:[10,18] },
];

// 经验阈值（简化：接近 5e 官方曲线）
const XP_THRESH = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const ASI_LEVELS = new Set([4,8,12,16,19]);

/***************
 * 工具函数 *
 ***************/
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const clamp20 = v => Math.min(20, v);
const d = n => Math.floor(Math.random()*n)+1;
const randFrom = arr => arr[Math.floor(Math.random()*arr.length)];
const abilityMod = sc => Math.floor((sc - 10) / 2);
function profBonus(lv){
  if (lv >= 17) return 6;
  if (lv >= 13) return 5;
  if (lv >= 9)  return 4;
  if (lv >= 5)  return 3;
  return 2;
}

/*****************
 * 游戏状态/保存 *
 *****************/
let game = null;
let currentEvent = null;
let eventTimer = null;

/*****************
 * 初始化下拉框  *
 *****************/
function initSelectors(){
  const raceSel = $("#race-select");
  raceSel.innerHTML="";
  RACES.forEach(r=>{
    const opt=document.createElement("option");
    opt.value=r.name; opt.textContent=r.name; opt.title=r.tip;
    raceSel.appendChild(opt);
  });
  raceSel.onchange = ()=>{
    showDesc("race");
    refreshSkillOptionBySel();
  };
  showDesc("race");

  const classSel = $("#class-select");
  classSel.innerHTML="";
  CLASSES.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c.name; opt.textContent=c.name;
    opt.title=`主要属性：${c.rec}；自动技能：${c.autoProfs.join("、")}`;
    classSel.appendChild(opt);
  });
  classSel.onchange = ()=>{
    showDesc("class");        // 修复：选择后更新说明
    refreshSkillOptionBySel(); // 同步更新技能选项
  };
  showDesc("class");

  const bgSel = $("#background-select");
  bgSel.innerHTML="";
  BACKGROUNDS.forEach(b=>{
    const opt=document.createElement("option");
    opt.value=b.name; opt.textContent=b.name;
    opt.title=`自动技能：${b.autoProf}`;
    bgSel.appendChild(opt);
  });
  bgSel.onchange = ()=>{
    showDesc("bg");
    refreshSkillOptionBySel();
  };
  showDesc("bg");
}

function showDesc(type){
  if(type==="race"){
    const r = RACES.find(x=>x.name===$("#race-select").value);
    $("#race-desc").textContent = `属性加值：${Object.entries(r.bonus).map(([k,v])=>`${k}+${v}`).join("，")}`;
  }else if(type==="class"){
    const c = CLASSES.find(x=>x.name===$("#class-select").value);
    $("#class-desc").textContent = `推荐：${c.rec}。说明：${c.desc}。自动获得技能熟练：${c.autoProfs.join("、")}`;
  }else if(type==="bg"){
    const b = BACKGROUNDS.find(x=>x.name===$("#background-select").value);
    $("#bg-desc").textContent = `背景：${b.desc}。自动获得技能熟练：${b.autoProf}`;
  }
}
/*****************
 * 生成与选择属性 *
 *****************/
function roll4d6drop1(){
  const rolls=[d(6),d(6),d(6),d(6)].sort((a,b)=>a-b);
  rolls.shift();
  return rolls.reduce((a,b)=>a+b,0);
}
function generateStatGroups(){
  const groups=[];
  for(let i=0;i<5;i++){
    const g={};
    ABILS.forEach(a=>g[a]=roll4d6drop1());
    groups.push(g);
  }
  return groups;
}
function renderStatGroups(){
  const wrap=$("#stat-options");
  wrap.innerHTML="";
  const groups=generateStatGroups();
  groups.forEach((g,idx)=>{
    const card=document.createElement("div");
    card.className="stat-card";
    card.innerHTML = `<b>属性组 ${idx+1}</b><br>${Object.entries(g).map(([k,v])=>`${k}：${v}`).join("， ")}`;
    card.onclick=()=>{
      $$(".stat-card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
      $("#selected-stats").textContent = `✅ 已选择属性组：${Object.entries(g).map(([k,v])=>`${k}：${v}`).join("， ")}`;
      $("#selected-stats").dataset.value = JSON.stringify(g);
    };
    wrap.appendChild(card);
  });
}

/*****************
 * 技能选择区域   *
 *****************/
const ALL_SKILLS = Object.keys(SKILL_TO_ABILITY);

function renderSkillOptions(autoSet){
  const area=$("#skill-options");
  area.innerHTML="";
  // 可选项：所有技能中剔除已自动拥有的
  const available = ALL_SKILLS.filter(s=>!autoSet.has(s));
  available.forEach(s=>{
    const label=document.createElement("label");
    label.title = `对应属性：${SKILL_TO_ABILITY[s]}`;
    const cb=document.createElement("input");
    cb.type="checkbox"; cb.value=s;
    cb.onchange = handleSkillPickLimit;
    label.appendChild(cb);
    label.append(s);
    area.appendChild(label);
  });
  updateAutoProfsHint(autoSet);
}
function getPickedSkills(){
  return Array.from($("#skill-options").querySelectorAll("input[type=checkbox]:checked")).map(x=>x.value);
}
function handleSkillPickLimit(){
  const picked = getPickedSkills();
  if(picked.length > 2){
    // 取消最后一次选中
    this.checked = false;
    return;
  }
}
function updateAutoProfsHint(autoSet){
  $("#auto-profs").textContent = `自动获得技能熟练：${[...autoSet].join("、")||"（无）"}；还可自选 2 项。`;
}

/*****************
 * 开始游戏 & 创建 *
 *****************/
function startGame(){
  // 检查属性
  const selStr = $("#selected-stats").dataset.value;
  if(!selStr){ alert("请先选择一组属性！"); return; }
  const baseStats = JSON.parse(selStr);

  // 读取选择
  const race = $("#race-select").value;
  const cls  = $("#class-select").value;
  const bg   = $("#background-select").value;
  const raceData = RACES.find(r=>r.name===race);
  const clsData  = CLASSES.find(c=>c.name===cls);
  const bgData   = BACKGROUNDS.find(b=>b.name===bg);

  // 应用种族加值
  const stats = {...baseStats};
  Object.entries(raceData.bonus).forEach(([k,v])=>{ stats[k] = (stats[k]||0)+v; });

  // 自动熟练（职业2 + 背景1）
  const autoSet = new Set([...clsData.autoProfs, bgData.autoProf]);
  // 玩家自选 2 项（避免重复）
  const picks = getPickedSkills().filter(s=>!autoSet.has(s)).slice(0,2);
  const proficient = [...autoSet, ...picks];

  game = {
    race, cls, bg,
    stats,
    proficient,
    level: 1, xp: 0, gp: 0,
    inventory: {},
  };

  // 切换界面
  $("#character-creation").style.display="none";
  $("#game-area").style.display="block";
  updateAllPanels();

  // 开始 20 秒循环（可手动下一事件）
  if(eventTimer) clearInterval(eventTimer);
  eventTimer = setInterval(()=> { if(!currentEvent) triggerEvent(); }, 20000);
}

/*****************
 * 面板更新        *
 *****************/
function updateAllPanels(){
  $("#char-race").textContent = game.race;
  $("#char-class").textContent = game.cls;
  $("#char-bg").textContent = game.bg;
  $("#level").textContent = game.level;
  $("#xp").textContent = game.xp;
  $("#gp").textContent = game.gp;
  $("#stats").textContent = ABILS.map(a=>`${a}${game.stats[a]}`).join("， ");

  // 技能清单
  const list=$("#skill-list");
  list.innerHTML="";
  ALL_SKILLS.forEach(sk=>{
    const abil = SKILL_TO_ABILITY[sk];
    const base = abilityMod(game.stats[abil]);
    const prof = game.proficient.includes(sk) ? profBonus(game.level) : 0;
    const mod = base + prof;
    const li=document.createElement("li");
    li.textContent = `${sk}（${abil}）：${mod>=0?"+":""}${mod}${prof?`（熟练+${prof}）`:''}`;
    list.appendChild(li);
  });

  // 背包
  const inv=$("#inventory");
  inv.innerHTML="";
  Object.entries(game.inventory).forEach(([item,qty])=>{
    const li=document.createElement("li");
    li.textContent = `${item} ×${qty}`;
    inv.appendChild(li);
  });

  // ASI 面板下拉候选更新
  const selects = ["#asi-plus2","#asi-plus1-a","#asi-plus1-b"].map(sel=>$(sel));
  selects.forEach(sel=>{
    if(!sel) return;
    sel.innerHTML="";
    ABILS.forEach(a=>{
      const opt=document.createElement("option");
      opt.value=a; opt.textContent=a;
      sel.appendChild(opt);
    });
  });
}

/*****************
 * 事件/掷骰/奖励 *
 *****************/
function triggerEvent(){
  if(currentEvent) return;
  const base = randFrom(EVENTS);
  const dc = d(9)+9; // 10-18
  currentEvent = { text: base.text, skill: base.skill, dc };

  $("#event-log").textContent = `事件：${currentEvent.text}\n需要检定：${currentEvent.skill}（DC ${currentEvent.dc}）`;
  $("#roll-dice").disabled = false;
}
function rollAndResolve(){
  if(!currentEvent) return;
  const sk = currentEvent.skill;
  const abil = SKILL_TO_ABILITY[sk];
  const base = abilityMod(game.stats[abil]);
  const pb = game.proficient.includes(sk) ? profBonus(game.level) : 0;
  const mod = base + pb;

  const r = d(20);
  const total = r + mod;
  const success = total >= currentEvent.dc;

  // 奖励：成功（XP 10-30，GP 5-20，物品 1-2），失败（XP 2-5，GP 1-3）
  let xp=0, gp=0, items=[];
  if(success){
    xp = d(21)+9;               // 10-30
    gp = d(16)+4;               // 5-20
    const itemCount = d(2);     // 1-2
    for(let i=0;i<itemCount;i++) items.push(randFrom(ITEM_POOL));
  }else{
    xp = d(4)+1;                // 2-5
    gp = d(3);                  // 1-3
  }

  game.xp += xp;
  game.gp += gp;
  items.forEach(it=>{
    game.inventory[it]=(game.inventory[it]||0)+1;
  });

  $("#log").textContent =
    `🎲 你掷出 ${r} + ${sk}(${mod>=0?"+":""}${mod}) = ${total}，对抗 DC ${currentEvent.dc} → ${success?"成功！":"失败。"}\n` +
    `获得 ${xp} XP、${gp} GP${items.length?`、${items.map(i=>`${i} ×1`).join("、")}`:""}。`;

  currentEvent=null;
  $("#roll-dice").disabled=true;

  // 升级检查与 ASI
  checkLevelUp();
  updateAllPanels();
}

/*****************
 * 升级与 ASI     *
 *****************/
function checkLevelUp(){
  let advanced=false;
  while(game.level < 20 && game.xp >= XP_THRESH[game.level]){
    game.level++;
    advanced=true;
    logInline(`🎉 升到 ${game.level} 级！`);
    if(ASI_LEVELS.has(game.level)){
      showASI();
      break; // 处理完这次ASI后再继续（防止叠触）
    }
  }
  if(advanced) updateAllPanels();
}
function showASI(){
  $("#asi-panel").style.display="block";
}
function hideASI(){
  $("#asi-panel").style.display="none";
}
function applyASIPlus2(){
  const a = $("#asi-plus2").value;
  if(game.stats[a] >= 20){ alert(`${a} 已达上限 20。`); return; }
  game.stats[a] = clamp20(game.stats[a]+2);
  hideASI(); updateAllPanels();
  logInline(`ASI：${a} +2。`);
}
function applyASIPlus1(){
  const a = $("#asi-plus1-a").value;
  const b = $("#asi-plus1-b").value;
  if(a===b){ alert("两项必须不同。"); return; }
  if(game.stats[a] >= 20 && game.stats[b] >= 20){
    alert("两项都已达上限。"); return;
  }
  if(game.stats[a] < 20) game.stats[a] = clamp20(game.stats[a]+1);
  if(game.stats[b] < 20) game.stats[b] = clamp20(game.stats[b]+1);
  hideASI(); updateAllPanels();
  logInline(`ASI：${a} +1，${b} +1。`);
}

/*****************
 * 存档管理       *
 *****************/
function exportSave(){
  if(!game){ alert("当前无存档。"); return; }
  const data = JSON.stringify(game);
  $("#save-data").value = data;
}
function importSave(){
  try{
    const data = JSON.parse($("#save-data").value.trim());
    if(!data || !data.stats){ throw new Error("数据无效"); }
    game = data;
    $("#character-creation").style.display="none";
    $("#game-area").style.display="block";
    if(eventTimer) clearInterval(eventTimer);
    eventTimer = setInterval(()=> { if(!currentEvent) triggerEvent(); }, 20000);
    updateAllPanels();
    $("#event-log").textContent = "存档已载入。点击“下一事件”触发或等待 20 秒。";
    $("#roll-dice").disabled = true;
  }catch(e){
    alert("导入失败：数据格式不正确。");
  }
}
function resetSave(){
  if(confirm("确定要重新开始吗？这会清空当前存档。")){
    currentEvent=null;
    if(eventTimer) clearInterval(eventTimer);
    eventTimer=null;
    game=null;
    // 回到创建页
    $("#game-area").style.display="none";
    $("#character-creation").style.display="block";
    $("#selected-stats").textContent="尚未选择属性组。";
    $("#selected-stats").dataset.value="";
    $("#event-log").textContent="";
    $("#log").textContent="";
    renderStatGroups();
    // 重置技能选区（根据当前职业/背景自动刷新）
    refreshSkillOptionBySel();
  }
}

/*****************
 * 杂项 / 日志     *
 *****************/
function logInline(text){
  const prev=$("#log").textContent;
  $("#log").textContent = (prev?prev+"\n":"") + text;
}

/*****************
 * 事件绑定       *
 *****************/
function refreshSkillOptionBySel(){
  const clsName=$("#class-select").value;
  const bgName=$("#background-select").value;
  const cls = CLASSES.find(c=>c.name===clsName);
  const bg  = BACKGROUNDS.find(b=>b.name===bgName);
  const autoSet = new Set([...cls.autoProfs, bg.autoProf]);
  renderSkillOptions(autoSet);
}

window.addEventListener("load", ()=>{
  initSelectors();
  renderStatGroups();
  refreshSkillOptionBySel();

  $("#generate").onclick = renderStatGroups;
  $("#class-select").onchange = ()=> refreshSkillOptionBySel();
  $("#background-select").onchange = ()=> refreshSkillOptionBySel();

  $("#start").onclick = startGame;
  $("#next-event").onclick = ()=> triggerEvent();
  $("#roll-dice").onclick = ()=> rollAndResolve();

  $("#asi-apply-plus2").onclick = applyASIPlus2;
  $("#asi-apply-plus1").onclick = applyASIPlus1;

  $("#save-export").onclick = exportSave;
  $("#save-import").onclick = importSave;
  $("#save-reset").onclick  = resetSave;
});
