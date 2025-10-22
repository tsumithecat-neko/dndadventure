/***************
 * script.js - 加入 HP 系统版
 ***************/

const ABILS = ["力量","敏捷","体质","智力","感知","魅力"];
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

const SKILL_TO_ABILITY = {
  "运动":"力量","特技":"敏捷","巧手":"敏捷","隐匿":"敏捷",
  "奥秘":"智力","历史":"智力","调查":"智力","自然":"智力","宗教":"智力",
  "驯兽":"感知","洞察":"感知","医药":"感知","察觉":"感知","求生":"感知",
  "欺瞒":"魅力","威吓":"魅力","表演":"魅力","游说":"魅力"
};

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
  { name:"武僧", rec:"敏捷、感知", desc:"身法与禅意。", autoProfs:["特技","察觉"] }
];

const BACKGROUNDS = [
  { name:"士兵", desc:"历经沙场。", autoProf:"威吓" },
  { name:"学者", desc:"博览群书。", autoProf:"历史" },
  { name:"罪犯", desc:"暗影行走。", autoProf:"欺瞒" },
  { name:"贵族", desc:"出身显赫。", autoProf:"游说" },
  { name:"荒野流浪者", desc:"与自然为伴。", autoProf:"求生" }
];

const XP_THRESH = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const ASI_LEVELS = new Set([4,8,12,16,19]);
const CLASS_HITDIE = {
  "战士":10,"野蛮人":12,"圣武士":10,"游侠":10,
  "武僧":8,"牧师":8,"德鲁伊":8,"吟游诗人":8,
  "盗贼":8,"术士":8,"法师":6
};

const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const clamp20 = v=>Math.min(20,v);
const d=n=>Math.floor(Math.random()*n)+1;
const randFrom=arr=>arr[Math.floor(Math.random()*arr.length)];
const randRange=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const abilityMod=sc=>Math.floor((sc-10)/2);
function profBonus(lv){if(lv>=17)return 6;if(lv>=13)return 5;if(lv>=9)return 4;if(lv>=5)return 3;return 2;}
function playSound(id){const el=document.getElementById(id);if(el){el.currentTime=0;el.play().catch(()=>{});}}
function flashLog(succ){const log=$("#log");log.style.transition="background-color 0.4s";log.style.backgroundColor=succ?"#265a32":"#5a2b2b";setTimeout(()=>log.style.backgroundColor="#111",500);}

let game=null,currentEvent=null,eventTimer=null;
let ITEM_POOL=[],EVENTS=[];

async function loadEventData(){
  try{
    const res=await fetch("events.json");
    const data=await res.json();
    ITEM_POOL=data.item_pool||[];
    EVENTS=data.events||[];
  }catch(e){console.error(e);alert("事件数据加载失败。");}
}

/* === 初始化下拉 === */
function initSelectors(){
  const raceSel=$("#race-select");
  RACES.forEach(r=>{const o=document.createElement("option");o.value=r.name;o.textContent=r.name;o.title=r.tip;raceSel.appendChild(o);});
  raceSel.addEventListener("change",()=>showDesc("race"));

  const classSel=$("#class-select");
  CLASSES.forEach(c=>{const o=document.createElement("option");o.value=c.name;o.textContent=c.name;o.title=`推荐属性：${c.rec}`;classSel.appendChild(o);});
  classSel.addEventListener("change",()=>{showDesc("class");refreshSkillOptionBySel();});

  const bgSel=$("#background-select");
  BACKGROUNDS.forEach(b=>{const o=document.createElement("option");o.value=b.name;o.textContent=b.name;bgSel.appendChild(o);});
  bgSel.addEventListener("change",()=>{showDesc("bg");refreshSkillOptionBySel();});

  showDesc("race");showDesc("class");showDesc("bg");
}

/* === 描述 === */
function showDesc(type){
  if(type==="race"){const r=RACES.find(x=>x.name===$("#race-select").value);$("#race-desc").textContent=`属性加值：${Object.entries(r.bonus).map(([k,v])=>k+"+"+v).join("，")}`;}
  else if(type==="class"){const c=CLASSES.find(x=>x.name===$("#class-select").value);$("#class-desc").textContent=`推荐属性：${c.rec}。说明：${c.desc}。自动获得技能熟练：${c.autoProfs.join("、")}`;}
  else if(type==="bg"){const b=BACKGROUNDS.find(x=>x.name===$("#background-select").value);$("#bg-desc").textContent=`背景：${b.desc}。自动获得技能熟练：${b.autoProf}`;}
}

/* === 属性与技能选择 === */
function roll4d6drop1(){const r=[d(6),d(6),d(6),d(6)].sort((a,b)=>a-b);r.shift();return r.reduce((a,b)=>a+b,0);}
function generateStatGroups(){const g=[];for(let i=0;i<5;i++){const t={};ABILS.forEach(a=>t[a]=roll4d6drop1());g.push(t);}return g;}
function renderStatGroups(){const w=$("#stat-options");w.innerHTML="";generateStatGroups().forEach((g,i)=>{const c=document.createElement("div");c.className="stat-card";c.innerHTML=`<b>属性组 ${i+1}</b><br>${Object.entries(g).map(([k,v])=>`${k}：${v}`).join("， ")}`;c.onclick=()=>{$$(".stat-card").forEach(x=>x.classList.remove("selected"));c.classList.add("selected");$("#selected-stats").textContent=`✅ 已选择属性组：${Object.entries(g).map(([k,v])=>`${k}：${v}`).join("， ")}`;$("#selected-stats").dataset.value=JSON.stringify(g);};w.appendChild(c);});}

const ALL_SKILLS=Object.keys(SKILL_TO_ABILITY);
function renderSkillOptions(auto){const a=$("#skill-options");a.innerHTML="";const avail=ALL_SKILLS.filter(s=>!auto.has(s));avail.forEach(s=>{const l=document.createElement("label");const cb=document.createElement("input");cb.type="checkbox";cb.value=s;cb.onchange=handleSkillPickLimit;l.append(cb,s);a.append(l);});updateAutoProfsHint(auto);}
function getPickedSkills(){return Array.from($("#skill-options input[type=checkbox]:checked")).map(x=>x.value);}
function handleSkillPickLimit(){const p=getPickedSkills();if(p.length>2)this.checked=false;}
function updateAutoProfsHint(auto){$("#auto-profs").textContent=`自动获得技能熟练：${[...auto].join("、")||"（无）"}；还可自选 2 项。`;}

/* === 开始游戏 === */
function startGame(){
  const sel=$("#selected-stats").dataset.value;
  if(!sel)return alert("请先选择一组属性！");
  const base=JSON.parse(sel);
  const race=$("#race-select").value,cls=$("#class-select").value,bg=$("#background-select").value;
  const raceData=RACES.find(r=>r.name===race),clsData=CLASSES.find(c=>c.name===cls),bgData=BACKGROUNDS.find(b=>b.name===bg);

  const stats={...base};
  Object.entries(raceData.bonus).forEach(([k,v])=>stats[k]=(stats[k]||0)+v);
  ABILS.forEach(a=>stats[a]=clamp20(stats[a]));

  const autoSet=new Set([...clsData.autoProfs,bgData.autoProf]);
  const picked=getPickedSkills().filter(s=>!autoSet.has(s));
  if(picked.length<2)return alert("请从可选技能中选择 2 项！");
  const proficient=[...autoSet,...picked.slice(0,2)];

  const conMod=abilityMod(stats["体质"]);
  const hitDie=CLASS_HITDIE[cls]||8;
  const maxHp=Math.max(1,hitDie+conMod);

  game={race,cls,bg,stats,proficient,level:1,xp:0,gp:0,hp:maxHp,maxHp,inventory:{}};

  $("#character-creation").style.display="none";
  $("#game-area").style.display="block";
  updateAllPanels();

  if(eventTimer)clearInterval(eventTimer);
  eventTimer=setInterval(()=>{if(!currentEvent)triggerEvent();},20000);
}

/* === 更新面板 === */
function updateAllPanels(){
  if(!game)return;
  $("#char-race").textContent=game.race;
  $("#char-class").textContent=game.cls;
  $("#char-bg").textContent=game.bg;
  $("#level").textContent=game.level;
  $("#xp").textContent=game.xp;
  $("#gp").textContent=game.gp;
  $("#hp").textContent=`${game.hp}/${game.maxHp}`;
  $("#stats").textContent=ABILS.map(a=>`${a}：${game.stats[a]}`).join("， ");

  const list=$("#skill-list");list.innerHTML="";
  ALL_SKILLS.forEach(sk=>{const abil=SKILL_TO_ABILITY[sk];const base=abilityMod(game.stats[abil]);const prof=game.proficient.includes(sk)?profBonus(game.level):0;const mod=base+prof;const li=document.createElement("li");li.textContent=`${sk}（${abil}）：${mod>=0?"+":""}${mod}${prof?`（熟练+${prof}）`:''}`;list.append(li);});

  const inv=$("#inventory");inv.innerHTML="";
  Object.entries(game.inventory).forEach(([item,qty])=>{const li=document.createElement("li");li.textContent=`${item} ×${qty}`;inv.append(li);});
}

/* === 事件 === */
function triggerEvent(){
  if(currentEvent)return;
  if(!EVENTS.length){$("#event-log").textContent="没有可用事件。";return;}
  const base=randFrom(EVENTS);
  const skillOpts=Array.isArray(base.skill)?base.skill:[base.skill];
  currentEvent={text:base.text,skill:skillOpts[0],skillOptions:skillOpts,dc:base.dc||10,rewards:base.rewards||{xp:[5,10],gp:[1,3],items:[0,0]}};

  const log=$("#event-log");
  log.innerHTML=`事件：${currentEvent.text}`;
  const p=document.createElement("div");p.textContent="请选择用于检定的技能：";log.append(p);
  if(skillOpts.length>1){
    const wrap=document.createElement("div");wrap.style.display="flex";wrap.style.gap="8px";
    skillOpts.forEach(s=>{const b=document.createElement("button");b.textContent=s;b.onclick=()=>{currentEvent.skill=s;Array.from(wrap.children).forEach(x=>x.classList.remove("selected"));b.classList.add("selected");const info=document.createElement("div");info.textContent=`已选择技能：${s}（DC ${currentEvent.dc}）`;info.className="chosen-info";const prev=log.querySelector(".chosen-info");if(prev)prev.remove();log.append(info);$("#roll-dice").disabled=false;};wrap.append(b);});
    log.append(wrap);$("#roll-dice").disabled=true;
  }else{log.append(`技能检定：${currentEvent.skill}（DC ${currentEvent.dc}）`);$("#roll-dice").disabled=false;}
}

/* === 掷骰与奖励 === */
function rollAndResolve(){
  if(!currentEvent)return;
  const sk=currentEvent.skill;
  if(!sk)return alert("请选择技能");
  const abil=SKILL_TO_ABILITY[sk];
  const base=abilityMod(game.stats[abil]);
  const pb=game.proficient.includes(sk)?profBonus(game.level):0;
  const mod=base+pb;

  playSound("snd-roll");
  const r=d(20);const total=r+mod;const success=total>=currentEvent.dc;
  flashLog(success);

  let xp=0,gp=0,items=[];
  if(success){
    const rw=currentEvent.rewards;
    xp=randRange(rw.xp[0],rw.xp[1]);gp=randRange(rw.gp[0],rw.gp[1]);
    const itCount=randRange(rw.items[0],rw.items[1]);
    for(let i=0;i<itCount;i++)if(ITEM_POOL.length)items.push(randFrom(ITEM_POOL));
    playSound("snd-success");
  }else{
    xp=randRange(2,5);gp=randRange(1,3);
    game.hp=Math.max(0,game.hp-1);
    playSound("snd-fail");
    if(game.hp<=0){
      $("#log").textContent+=`\n💀 你的 HP 降至 0，昏迷在地。游戏暂停。`;
      clearInterval(eventTimer);
      $("#roll-dice").disabled=true;
      updateAllPanels();
      return;
    }
  }

  game.xp+=xp;game.gp+=gp;items.forEach(it=>game.inventory[it]=(game.inventory[it]||0)+1);
  $("#log").textContent=`🎲 你掷出 ${r} + ${sk}(${mod>=0?"+":""}${mod}) = ${total} → ${success?"成功！":"失败。"}\n获得 ${xp} XP、${gp} GP${items.length?`、${items.join("、")}`:""}。`;
  currentEvent=null;$("#roll-dice").disabled=true;
  checkLevelUp();updateAllPanels();
}

/* === 升级 === */
function checkLevelUp(){
  let advanced=false;
  while(game.level<20 && game.xp>=XP_THRESH[game.level]){
    game.level++;advanced=true;logInline(`🎉 升到 ${game.level} 级！`);
    const conMod=abilityMod(game.stats["体质"]);
    const hitDie=CLASS_HITDIE[game.cls]||8;
    const hpGain=Math.max(1,Math.floor(hitDie/2)+1+conMod);
    game.maxHp+=hpGain;game.hp+=hpGain;
    logInline(`❤️ HP 上升 ${hpGain} 点（当前 ${game.hp}/${game.maxHp}）。`);
    if(ASI_LEVELS.has(game.level)){showASI();break;}
  }
  if(advanced)updateAllPanels();
}

/* === ASI === */
function showASI(){ $("#asi-panel").style.display="block"; }
function hideASI(){ $("#asi-panel").style.display="none"; }
function applyASIPlus2(){
  const a=$("#asi-plus2").value;if(game.stats[a]>=20)return alert(`${a} 已达上限`);
  game.stats[a]=clamp20(game.stats[a]+2);
  hideASI();updateAllPanels();logInline(`ASI：${a}+2`);checkLevelUp();
}
function applyASIPlus1(){
  const a=$("#asi-plus1-a").value,b=$("#asi-plus1-b").value;
  if(a===b)return alert("两项必须不同");
  if(game.stats[a]<20)game.stats[a]=clamp20(game.stats[a]+1);
  if(game.stats[b]<20)game.stats[b]=clamp20(game.stats[b]+1);
  hideASI();updateAllPanels();logInline(`ASI：${a}+1，${b}+1`);checkLevelUp();
}

/* === 存档 === */
function exportSave(){if(!game)return alert("无存档");$("#save-data").value=JSON.stringify(game);}
function importSave(){try{const data=JSON.parse($("#save-data").value.trim());if(!data.stats)throw 0;game=data;$("#character-creation").style.display="none";$("#game-area").style.display="block";if(eventTimer)clearInterval(eventTimer);eventTimer=setInterval(()=>{if(!currentEvent)triggerEvent();},20000);updateAllPanels();$("#event-log").textContent="存档已载入。";}catch(e){alert("导入失败");}}
function resetSave(){if(confirm("确定要重来？")){if(eventTimer)clearInterval(eventTimer);game=null;currentEvent=null;$("#game-area").style.display="none";$("#character-creation").style.display="block";renderStatGroups();refreshSkillOptionBySel();showDesc("race");showDesc("class");showDesc("bg");$("#log").textContent="";$("#event-log").textContent="";}}

function logInline(t){$("#log").textContent+=($("#log").textContent?"\n":"")+t;}
function refreshSkillOptionBySel(){const cls=$("#class-select").value,bg=$("#background-select").value;const c=CLASSES.find(x=>x.name===cls),b=BACKGROUNDS.find(x=>x.name===bg);renderSkillOptions(new Set([...c.autoProfs,b.autoProf]));}

window.addEventListener("load",async()=>{await loadEventData();initSelectors();renderStatGroups();refreshSkillOptionBySel();
$("#generate").onclick=renderStatGroups;
$("#start").onclick=startGame;
$("#next-event").onclick=()=>triggerEvent();
$("#roll-dice").onclick=()=>rollAndResolve();
$("#asi-apply-plus2").onclick=applyASIPlus2;
$("#asi-apply-plus1").onclick=applyASIPlus1;
$("#save-export").onclick=exportSave;
$("#save-import").onclick=importSave;
$("#save-reset").onclick=resetSave;
});
