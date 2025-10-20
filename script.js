// ====== 数据定义 ======
const races = [
  { name: "人类", bonus: { 力量:1, 敏捷:1, 体质:1, 智力:1, 感知:1, 魅力:1 }, desc: "多才多艺，所有属性+1。" },
  { name: "矮人", bonus: { 体质:2 }, desc: "坚韧稳重，体质+2，适合战士与牧师。" },
  { name: "精灵", bonus: { 敏捷:2 }, desc: "优雅灵敏，敏捷+2，适合游侠与盗贼。" },
  { name: "半身人", bonus: { 敏捷:2 }, desc: "小巧灵动，敏捷+2，适合盗贼或吟游诗人。" },
  { name: "龙裔", bonus: { 力量:2, 魅力:1 }, desc: "龙之血脉，力量+2，魅力+1。" },
  { name: "侏儒", bonus: { 智力:2 }, desc: "聪明狡黠，智力+2，适合法师与工匠。" },
  { name: "半精灵", bonus: { 魅力:2, 敏捷:1, 智力:1 }, desc: "混血多才，魅力+2，另两项+1。" },
  { name: "半兽人", bonus: { 力量:2, 体质:1 }, desc: "野性与力量并存，力量+2，体质+1。" },
  { name: "泰夫林", bonus: { 智力:1, 魅力:2 }, desc: "恶魔血裔，智力+1，魅力+2。" }
];

const classes = [
  { name: "野蛮人", main: "力量、体质", desc: "擅长近战狂怒与抗性。" },
  { name: "吟游诗人", main: "魅力", desc: "用音乐与魔法激励队友，依赖魅力。" },
  { name: "牧师", main: "感知", desc: "神圣施法者，依赖感知，治疗与守护。" },
  { name: "德鲁伊", main: "感知", desc: "自然施法与变形，依赖感知。" },
  { name: "战士", main: "力量或敏捷", desc: "多面手，擅长各种战斗风格。" },
  { name: "武僧", main: "敏捷、感知", desc: "武术家，注重反应与心灵专注。" },
  { name: "圣骑士", main: "力量、魅力", desc: "正义的战士，具神圣魔法。" },
  { name: "游侠", main: "敏捷、感知", desc: "荒野猎人，精通弓与自然魔法。" },
  { name: "盗贼", main: "敏捷", desc: "潜行与精准打击的专家。" },
  { name: "术士", main: "魅力", desc: "天生魔法力量，依赖魅力。" },
  { name: "契术士", main: "魅力", desc: "与异界存在立契约的施法者。" },
  { name: "法师", main: "智力", desc: "博学的施法大师，依赖智力。" },
  { name: "工匠", main: "智力", desc: "发明家与魔导科技专家。" }
];

const backgrounds = [
  { name: "侍从", desc: "信仰虔诚的教徒，熟悉宗教仪式。" },
  { name: "骗子", desc: "伪装与欺诈的高手。" },
  { name: "罪犯", desc: "潜行与阴影的熟人。" },
  { name: "艺人", desc: "表演艺术家，魅力非凡。" },
  { name: "民间英雄", desc: "平民的保护者，擅长生存与交涉。" },
  { name: "行会工匠", desc: "专精手艺与贸易，擅长谈判与制作。" },
  { name: "隐士", desc: "孤独修行者，探求精神启示。" },
  { name: "贵族", desc: "出生显赫，擅长礼仪与社交。" },
  { name: "荒野游侠", desc: "来自荒野，熟悉自然与狩猎。" },
  { name: "贤者", desc: "知识渊博，擅长调查与研究。" },
  { name: "水手", desc: "海上生活者，精于航行。" },
  { name: "士兵", desc: "纪律严明，擅长武器与指挥。" },
  { name: "流浪儿", desc: "街头求生者，擅长潜行与察觉。" }
];

// ====== 全局变量 ======
let character = {};
let inventory = [];
let selectedButton = null;

// ====== 属性生成 ======
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
    btn.textContent = `力量:${stats.力量}, 敏捷:${stats.敏捷}, 体质:${stats.体质}, 智力:${stats.智力}, 感知:${stats.感知}, 魅力:${stats.魅力}`;
    btn.onclick = () => selectStats(stats, btn);
    optionsDiv.appendChild(btn);
  }

  // 重置选择状态显示
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

// ====== 初始化下拉选项 ======
function initSelectors() {
  const raceSel = document.getElementById("race-select");
  races.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = r.name;
    raceSel.appendChild(opt);
  });

  const classSel = document.getElementById("class-select");
  classes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.textContent = c.name;
    classSel.appendChild(opt);
  });

  const bgSel = document.getElementById("background-select");
  backgrounds.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.name;
    opt.textContent = b.name;
    bgSel.appendChild(opt);
  });

  raceSel.onchange = () => showDesc("race", raceSel.value);
  classSel.onchange = () => showDesc("class", classSel.value);
  bgSel.onchange = () => showDesc("bg", bgSel.value);

  showDesc("race", raceSel.value);
  showDesc("class", classSel.value);
  showDesc("bg", bgSel.value);
}

// ====== 显示说明 ======
function showDesc(type, value) {
  let target, text = "";
  if (type === "race") {
    const r = races.find(x => x.name === value);
    target = document.getElementById("race-desc");
    text = `${r.desc} 加值: ${Object.entries(r.bonus).map(([k,v]) => `${k}+${v}`).join(", ")}`;
  } else if (type === "class") {
    const c = classes.find(x => x.name === value);
    target = document.getElementById("class-desc");
    text = `主要属性: ${c.main}。${c.desc}`;
  } else if (type === "bg") {
    const b = backgrounds.find(x => x.name === value);
    target = document.getElementById("bg-desc");
    text = b.desc;
  }
  target.textContent = text;
}

// ====== 游戏逻辑 ======
function startGame() {
  if (!character.stats) return alert("请先选择属性组！");
  character.race = document.getElementById("race-select").value;
  character.class = document.getElementById("class-select").value;
  character.background = document.getElementById("background-select").value;
  character.level = 1;
  character.xp = 0;

  const race = races.find(r => r.name === character.race);
  for (const key in race.bonus) character.stats[key] += race.bonus[key];

  document.getElementById("char-race").textContent = character.race;
  document.getElementById("char-class").textContent = character.class;
  document.getElementById("char-bg").textContent = character.background;
  updateStats();

  document.getElementById("character-creation").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  setInterval(idleGain, 3000);
}

function idleGain() {
  character.xp += 5;
  document.getElementById("xp").textContent = character.xp;
  log(`获得5点经验。`);
  checkLevelUp();
}

function checkLevelUp() {
  const needed = character.level * 100;
  if (character.xp >= needed) {
    character.xp -= needed;
    character.level++;
    document.getElementById("level").textContent = character.level;
    log(`🎉 升级至 ${character.level} 级！`);
    if ([4,8,12,16,19].includes(character.level)) increaseStatChoice();
  }
}

function increaseStatChoice() {
  const statKeys = Object.keys(character.stats);
  const choice = prompt("升级奖励！输入要提升的属性名（每次+2，或两项各+1，用逗号分隔）");
  if (!choice) return;
  const selected = choice.split(",");
  if (selected.length === 1 && statKeys.includes(selected[0])) {
    character.stats[selected[0]] += 2;
  } else if (selected.length === 2 && statKeys.includes(selected[0]) && statKeys.includes(selected[1])) {
    character.stats[selected[0]]++;
    character.stats[selected[1]]++;
  }
  updateStats();
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

document.getElementById("generate").onclick = generateStats;
document.getElementById("start").onclick = startGame;

initSelectors();
