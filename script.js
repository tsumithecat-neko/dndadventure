// ====== 数据定义（与前版本一致，省略部分相同结构） ======
const races = [
  { name: "人类", bonus: { 力量:1, 敏捷:1, 体质:1, 智力:1, 感知:1, 魅力:1 }, desc: "多才多艺，所有属性+1。" },
  { name: "矮人", bonus: { 体质:2 }, desc: "坚韧稳重，体质+2。" },
  { name: "精灵", bonus: { 敏捷:2 }, desc: "优雅灵敏，敏捷+2。" },
  { name: "半身人", bonus: { 敏捷:2 }, desc: "小巧灵动，敏捷+2。" },
  { name: "龙裔", bonus: { 力量:2, 魅力:1 }, desc: "龙之血脉，力量+2，魅力+1。" },
  { name: "侏儒", bonus: { 智力:2 }, desc: "聪明狡黠，智力+2。" },
  { name: "半精灵", bonus: { 魅力:2, 敏捷:1, 智力:1 }, desc: "混血多才，魅力+2，另两项+1。" },
  { name: "半兽人", bonus: { 力量:2, 体质:1 }, desc: "野性与力量并存，力量+2，体质+1。" },
  { name: "泰夫林", bonus: { 智力:1, 魅力:2 }, desc: "恶魔血裔，智力+1，魅力+2。" }
];

const classes = [
  { name: "野蛮人", main: "力量、体质", desc: "擅长近战狂怒与抗性。" },
  { name: "吟游诗人", main: "魅力", desc: "用音乐与魔法激励队友。" },
  { name: "牧师", main: "感知", desc: "神圣施法者，治疗与守护。" },
  { name: "德鲁伊", main: "感知", desc: "自然施法与变形。" },
  { name: "战士", main: "力量或敏捷", desc: "多面手，擅长各种战斗风格。" },
  { name: "武僧", main: "敏捷、感知", desc: "武术家，注重反应与专注。" },
  { name: "圣骑士", main: "力量、魅力", desc: "正义的战士，具神圣魔法。" },
  { name: "游侠", main: "敏捷、感知", desc: "荒野猎人，精通弓与魔法。" },
  { name: "盗贼", main: "敏捷", desc: "潜行与精准打击的专家。" },
  { name: "术士", main: "魅力", desc: "天生魔法力量，依赖魅力。" },
  { name: "契术士", main: "魅力", desc: "与异界存在立契约的施法者。" },
  { name: "法师", main: "智力", desc: "博学的施法大师。" },
  { name: "工匠", main: "智力", desc: "魔导科技专家。" }
];

const backgrounds = [
  { name: "士兵", desc: "纪律严明，擅长武器与指挥。" },
  { name: "贵族", desc: "出生显赫，擅长礼仪与社交。" },
  { name: "学者", desc: "知识渊博，擅长调查与研究。" },
  { name: "罪犯", desc: "潜行与阴影的熟人。" },
  { name: "流浪儿", desc: "街头求生者，擅长潜行与察觉。" },
];

// ====== 全局变量 ======
let character = {};
let selectedButton = null;
let eventTimer = null;
let currentEvent = null;

// ====== 基础逻辑（生成属性、选择等） ======
function rollStat() {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

function generateStats() {
  const optionsDiv = document.getElementById("stat-options");
  optionsDiv.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const stats = {
      力量: rollStat(),
      敏捷: rollStat(),
      体质: rollStat(),
      智力: rollStat(),
      感知: rollStat(),
      魅力: rollStat()
    };
    const btn = document.createElement("button");
    btn.textContent = Object.entries(stats).map(([k,v]) => `${k}:${v}`).join(", ");
    btn.onclick = () => selectStats(stats, btn);
    optionsDiv.appendChild(btn);
  }

  document.getElementById("selected-stats").textContent = "尚未选择属性组。";
  if (selectedButton) {
    selectedButton.classList.remove("selected");
    selectedButton = null;
  }
}

function selectStats(stats, button) {
  character.stats = stats;
  if (selectedButton) selectedButton.classList.remove("selected");
  selectedButton = button;
  selectedButton.classList.add("selected");
  document.getElementById("selected-stats").textContent =
    `✅ 当前已选择属性组：${Object.entries(stats).map(([k,v]) => `${k}:${v}`).join(", ")}`;
}

function initSelectors() {
  const makeOptions = (select, list) => {
    select.innerHTML = "";
    list.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i.name;
      opt.textContent = i.name;
      select.appendChild(opt);
    });
  };

  makeOptions(document.getElementById("race-select"), races);
  makeOptions(document.getElementById("class-select"), classes);
  makeOptions(document.getElementById("background-select"), backgrounds);

  document.getElementById("race-select").onchange = () => showDesc("race");
  document.getElementById("class-select").onchange = () => showDesc("class");
  document.getElementById("background-select").onchange = () => showDesc("bg");

  showDesc("race"); showDesc("class"); showDesc("bg");
}

function showDesc(type) {
  const raceSel = document.getElementById("race-select");
  const classSel = document.getElementById("class-select");
  const bgSel = document.getElementById("background-select");
  if (type === "race") {
    const r = races.find(x => x.name === raceSel.value);
    document.getElementById("race-desc").textContent =
      `${r.desc} 加值: ${Object.entries(r.bonus).map(([k,v]) => `${k}+${v}`).join(", ")}`;
  } else if (type === "class") {
    const c = classes.find(x => x.name === classSel.value);
    document.getElementById("class-desc").textContent =
      `主要属性: ${c.main}。${c.desc}`;
  } else if (type === "bg") {
    const b = backgrounds.find(x => x.name === bgSel.value);
    document.getElementById("bg-desc").textContent = b.desc;
  }
}

// ====== 随机事件系统 ======
const events = [
  { name: "遇到强盗伏击", dc: 13, related: "敏捷" },
  { name: "解读古代铭文", dc: 14, related: "智力" },
  { name: "穿越危险地形", dc: 12, related: "体质" },
  { name: "说服商人降价", dc: 11, related: "魅力" },
  { name: "侦测陷阱机关", dc: 15, related: "感知" },
  { name: "推开沉重巨石门", dc: 16, related: "力量" }
];

function startGame() {
  if (!character.stats) return alert("请先选择属性组！");
  const race = document.getElementById("race-select").value;
  const cls = document.getElementById("class-select").value;
  const bg = document.getElementById("background-select").value;

  const rdata = races.find(r => r.name === race);
  Object.entries(rdata.bonus).forEach(([k,v]) => character.stats[k]+=v);

  character.race = race;
  character.class = cls;
  character.background = bg;
  character.level = 1;
  character.xp = 0;

  document.getElementById("char-race").textContent = race;
  document.getElementById("char-class").textContent = cls;
  document.getElementById("char-bg").textContent = bg;
  updateStats();

  document.getElementById("character-creation").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  log("游戏开始！每20秒触发一个事件。请点击按钮进行骰子检定。");
  eventTimer = setInterval(triggerEvent, 20000);
}

function triggerEvent() {
  if (currentEvent) return; // 避免未解决上一个事件
  currentEvent = events[Math.floor(Math.random() * events.length)];
  document.getElementById("current-event").textContent =
    `🌀 事件：${currentEvent.name}（DC ${currentEvent.dc}, 相关属性：${currentEvent.related}）`;
  document.getElementById("roll-dice").disabled = false;
}

function playerRoll() {
  if (!currentEvent) return;
  const roll = Math.floor(Math.random() * 20) + 1;
  const mod = Math.floor((character.stats[currentEvent.related] - 10) / 2);
  const total = roll + mod;
  log(`你掷出 D20=${roll} (${currentEvent.related}修正 ${mod >= 0 ? "+"+mod : mod}) → 总和 ${total}`);

  if (total >= currentEvent.dc) {
    const reward = 20 + Math.floor(Math.random() * 10);
    character.xp += reward;
    log(`✅ 成功！获得 ${reward} 经验。`);
  } else {
    log(`❌ 失败！你未能克服这次挑战。`);
  }
  updateXP();

  currentEvent = null;
  document.getElementById("current-event").textContent = "等待下一个事件……";
  document.getElementById("roll-dice").disabled = true;
}

function updateXP() {
  document.getElementById("xp").textContent = character.xp;
  const needed = character.level * 100;
  if (character.xp >= needed) {
    character.xp -= needed;
    character.level++;
    document.getElementById("level").textContent = character.level;
    log(`🎉 升级到 ${character.level} 级！`);
  }
}

function updateStats() {
  document.getElementById("stats").textContent =
    Object.entries(character.stats).map(([k,v]) => `${k}:${v}`).join(", ");
}

function log(msg) {
  const div = document.getElementById("log");
  div.innerHTML += `<div>${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}

// ====== 初始化 ======
document.getElementById("generate").onclick = generateStats;
document.getElementById("start").onclick = startGame;
document.getElementById("roll-dice").onclick = playerRoll;

initSelectors();
