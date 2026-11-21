/* ============ Trygalle Run: the book, the shareholders, a new charter ============
   Trygalle Run is built on the From the Ranks engine (David, Nov 21, 2026). This file turns the engine's book shelf into one book,
   'ttg', and replaces Book One's squad with the guild's shareholders. The player is still the engine's 'sgt' id: here the carriage's
   captain, the shareholder who signs for the cargo. Battles are real time with pause (032_rt_battle.js), not the engine's rounds.
   Fan work: the Malazan world and the Trygalle Trade Guild were created by Steven Erikson and Ian C. Esslemont. */

/* one book on the shelf */
Object.keys(BOOKS).forEach(k => delete BOOKS[k]);
BOOKS.ttg = {id:'ttg', n:1, word:'One', title:'The Trygalle Trade Guild', name:'Trygalle Run', h1:['Trygalle', 'Run'],
  squad:'the carriage', unit:'the carriage', tag:'The guild goes where no road goes. Five shareholders, one carriage, and a cargo someone will pay anything to have carried through the warrens.',
  blurb:'Darujhistan, the Trygalle Trade Guild\'s house. A new captain, a first contract, and a road through a dead warren the guild calls the Ashway.'};
BOOKSNAP.ttg = {ch:{}, end:{}, tease:{}};

/* the shareholders. Fields follow the engine's TPL (014): the sheets, the talk lines and the portraits read them. */
const TTG_SQUAD = ['sgt', 'tavos', 'mira', 'quill', 'ossel'];
Object.assign(TPL.sgt, {role:'Shareholder · Captain of the carriage', epithet:'Trygalle Trade Guild, Darujhistan house', origin:'Darujhistan, the Daru District', age:36,
  service:'Four runs as a shareholder. This is the first as captain.', height:'Middling. Stands like the carriage is still moving.',
  weapon:'A guild sword with the trader\'s knot on the pommel, and a ledger', armour:'Brigandine under a guild coat that has been cleaned of things that should not stain',
  bio:'Four runs through the warrens as a shareholder, and still alive, which in the guild is a qualification. The board has given you a carriage, a crew and a contract, and a share of whatever comes back.',
  bio2:'You bought your first share with an inheritance nobody else in the family wanted to spend on anything so likely to end in a closed coffin. Every captain you rode under is either retired rich or dead. You have noticed that nobody retires poor.',
  traits:['Counts the crates before the crew','Signs nothing without reading it twice','Has never once looked back through an open gate','Pays debts the day they fall due'],
  gear:['The contract, sealed','A guild token that opens the yard gate','A share certificate, folded small']});
Object.defineProperty(TPL.sgt, 'quest', {configurable:true, get(){ return 'Bring the carriage back with the crates sealed and the crew breathing. The board is watching your first run as captain.'; }});

const TTG_TPL = {
  tavos:{name:'Tavos', role:'Shareholder · Driver', sig:'D', col:'#c9a35a', hp:18, ac:13, atk:3, dmg:[1,6,1], rng:1, mv:5, init:2, st:{might:1, wits:3, guile:1}, ab:['salve'],
    fig:'garrow', epithet:'Eleven runs. Still talks to the horses first.', origin:'Gadrobi Hills', age:47, service:'Eleven runs, all of them on the bench', height:'Short, broad, and bowed at the knee from the bench.',
    weapon:'A long whip and a short knife', armour:'Oiled leather and a hat with a brim wide enough to hold rain',
    bio:'The guild\'s oldest driver on this side of the lake. He has taken carriages through warrens with no ground, warrens with too much, and one that was all teeth. The horses trust him. Nobody else is sure he notices people.',
    bio2:'He has eleven shares and will not sell one. Asked why, he says he is waiting for a twelfth. Asked what then, he says he will think about it.',
    traits:['Names every horse after a dead captain','Never sits on anything that is not moving','Sleeps through anything but a change in the wheels','Laughs at weather'],
    gear:['A tin of grease for the axles','Sugar for the horses','A string of eleven knotted cords'],
    quest:'He has been promised the next carriage the guild builds. He would like it to have better springs.',
    banter:['"Keep them off the horses, Captain. The crates I can replace."', '"Feel that? Ground\'s gone soft. We\'re close to a seam."', '"Eleven runs. You want to know the trick? Don\'t stop."'],
    rel:{mira:'Calls her "the door." She lets him.', quill:'Shares the bench with her. Neither talks.', ossel:'Trusts his gates. Does not trust his face when he opens them.'}},
  mira:{name:'Mira', role:'Shareholder · Warden', sig:'W', col:'#cfc6b4', hp:26, ac:16, atk:4, dmg:[1,8,2], rng:1, mv:4, init:0, st:{might:3, wits:1, guile:0}, ab:['salve'],
    fig:'brisk', epithet:'Shield on her arm, a share in her boot.', origin:'Cawn, Quon Tali', age:31, service:'Seven runs. Two carriages lost under her, both crews home.', height:'Tall. The carriage door is shorter than she is.',
    weapon:'Broad-bladed spear and a rimmed shield painted with the guild\'s knot', armour:'Scale over leather, and a helm she keeps on in the yard',
    bio:'Came to the guild from a caravan company that paid her in promises. The guild pays in shares, and she has never been late collecting. She stands at the carriage door in every fight and nothing has come through it yet.',
    bio2:'Her sister runs a bakery in the Gadrobi District that Mira\'s shares paid for. She has never told her sister what the guild does. Her sister thinks it is shipping.',
    traits:['Checks the door hinges every morning','Will not ride inside','Eats standing up','Counts heads at every stop'],
    gear:['A whetstone','A letter from her sister about flour prices','Spare shield straps'],
    quest:'Seven shares. Ten buys out the debt on the bakery for good.',
    banter:['"I\'ll take the door, Captain. You take the decisions."', '"Whatever comes, comes through me first. That\'s the job."', '"Seven runs and I still hate the smell of a warren opening."'],
    rel:{tavos:'Covers his blind side without asking.', quill:'Calls her "the little hawk." Means it kindly.', ossel:'Stands between him and anything, whether he likes it or not.'}},
  quill:{name:'Quill', role:'Shareholder · Marksman', sig:'M', col:'#8fb3a0', hp:14, ac:13, atk:5, dmg:[1,8,1], rng:5, mv:5, init:3, st:{might:0, wits:2, guile:3}, ab:['salve'],
    fig:'ellis', epithet:'Rides the roof. Misses less than the rain.', origin:'Genabaris', age:23, service:'Three runs, all on the roof', height:'Slight. Folds up small on the roof rail.',
    weapon:'A recurved horn bow and forty grey-fletched arrows', armour:'Quilted jacket, nothing that rings',
    bio:'Youngest shareholder on the carriage and the best shot in the Darujhistan house. Says very little, and most of it about wind.',
    bio2:'She bought her first share with a purse she will not explain. Tavos thinks she won it. Mira thinks she stole it. Ossel knows, and says nothing.',
    traits:['Counts arrows before sleeping','Never misses twice','Climbs anything','Hums when she aims'],
    gear:['Forty arrows','A wax tablet of wind notes','A ring on a cord'],
    quest:'Wants her own carriage one day. Has already picked the horses.',
    banter:['"Roof, Captain. I see more from there."', '"Wind\'s wrong in here. It blows from everywhere."', '"Point. I\'ll do the rest."'],
    rel:{tavos:'Shares the bench and the silence.', mira:'Lets Mira fuss. Pretends not to.', ossel:'He taught her to watch the seams. She watches him instead.'}},
  ossel:{name:'Ossel', role:'Shareholder · Seam-reader, the carriage\'s mage', sig:'O', col:'#a08de0', hp:13, ac:12, atk:3, dmg:[1,6,1], rng:4, mv:4, init:1, st:{might:0, wits:3, guile:2}, ab:['salve'], magic:true,
    fig:'mammot', epithet:'Opens the gates. Holds them shut when it matters.', origin:'Pale, before Pale fell', age:61, service:'Twenty runs. More than any mage living in the house.', height:'Stooped, and getting more so.',
    weapon:'A staff of black wood and the warrens themselves, carefully', armour:'A coat with too many pockets',
    bio:'Every carriage needs a mage to open the way and close it after. Ossel has opened more gates than anyone in the house and believes, quietly, that he has used up most of his luck.',
    bio2:'He was a scholar at Pale when the city still had scholars. He came south with a library in a handcart and sold it book by book to buy his first share. He still has the last book. He has not read it.',
    traits:['Talks to the gate before opening it','Will not eat in a warren','Writes everything down','Is afraid of horses'],
    gear:['The last book from Pale, unread','Chalk for drawing seams','A tin of ginger for the sickness'],
    quest:'Twenty runs. The guild says a mage may retire at twenty-five. He would like to see what that looks like.',
    banter:['"Every warren has a grain, Captain. Go with it and it lets you through."', '"The Ashway is dying. Dying things are restless."', '"I can hold it. Not long. Tell me when."'],
    rel:{tavos:'Has never ridden up front. Will not start now.', mira:'She stands in front of him. He has stopped telling her not to.', quill:'Taught her the seams. She learned faster than he did.'}},
};
Object.assign(TPL, TTG_TPL);
Object.keys(TTG_TPL).forEach(id => { STATUP[id] = id === 'mira' ? ['might', 'wits'] : ['wits', 'guile']; });
STATUP.sgt = ['wits', 'might'];
PORDER.length = 0; PORDER.push(...TTG_SQUAD);
/* faces: the engine's portraits, worn by the shareholders until they have their own */
Object.entries({tavos:'vell', mira:'brisk', quill:'ellis', ossel:'ohl'}).forEach(([id, look]) => { if (POR[look]) POR[id] = POR[look]; });

/* level-3 talents: each one is read by the real-time battle (032) */
Object.assign(PICKS[3], {
  sgt:[['ttg_rally', 'Hold Together', 'Once a fight: every shareholder gets 4 grit back and strikes faster for 6 seconds.'], ['ttg_ledger', 'Count the Crates', 'Crates take 1 less from every blow.']],
  tavos:[['ttg_whip', 'Whip Hand', 'With Tavos on the bench the carriage moves a third faster.'], ['ttg_steady', 'Steady Team', 'The horses never lurch, even with nobody on the bench.']],
  mira:[['ttg_door', 'The Door', 'Shareholders beside Mira take 1 less from every blow.'], ['ttg_wall', 'Wall of One', '+2 armour, and nothing pushes her.']],
  quill:[['ttg_roof', 'Roof Eye', '+1 range, +2 more on the carriage roof.'], ['ttg_quick', 'Quick Draw', 'Shoots a third faster.']],
  ossel:[['ttg_anchor', 'Deep Anchor', 'His anchor holds drift still twice as long.'], ['ttg_ward', 'Seam Ward', 'Realm-fire does not burn shareholders standing next to him.']],
});

/* a new charter: the engine's new-game path calls newState(name) and then showIntro() (29); here both lead into Chapter One */
const ftrNewState = newState;
newState = function(name){
  const s = ftrNewState(name);
  s.book = 'ttg'; setBook('ttg');
  s.squad = [...TTG_SQUAD]; s.loy = {}; TTG_SQUAD.forEach(id => { s.loy[id] = 0; s.gear[id] ??= {}; s.picks[id] ??= []; });
  s.inv = {salve:2, sharper:0, burner:0, cusser:0, smoker:0};
  s.silver = 40; s.shares = 1; s.area = 'ttg_yard'; s.scene = 'chintro';
  return s;
};
showIntro = function(){ startChapter(1); };
/* the guild's own words for the engine's sergeant */
const TTG_WORDS = [[/\bSergeant\b/g, 'Captain'], [/\bsergeant\b/g, 'captain'], [/\bsergeants\b/g, 'captains'], [/\bSergeants\b/g, 'Captains'], [/Begin Book One/g, 'Take the first contract']];
function ttgWords(root){
  const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { let t = n.nodeValue, o = t; TTG_WORDS.forEach(([re, rep]) => { t = t.replace(re, rep); }); if (t !== o) n.nodeValue = t; }
  document.querySelectorAll('input[placeholder], button').forEach(el => { TTG_WORDS.forEach(([re, rep]) => { if (el.placeholder) el.placeholder = el.placeholder.replace(re, rep); }); });
}
new MutationObserver(() => { if (ttgWords.busy) return; ttgWords.busy = true; try { ttgWords(document.getElementById('app')); } finally { ttgWords.busy = false; } })
  .observe(document.getElementById('app'), {childList:true, subtree:true, characterData:true});
setBook('ttg');

/* the shareholders wear FTR's figures: anywhere the engine draws a squadmate by id (the map, the backdrops), it gets their look */
const TTG_FIG = {tavos:'garrow', mira:'brisk', quill:'ellis', ossel:'mammot'};
{ const _drawFigure = drawFigure; drawFigure = function(ctx, kind, ...rest){ return _drawFigure.call(this, ctx, TTG_FIG[kind] || kind, ...rest); }; }
