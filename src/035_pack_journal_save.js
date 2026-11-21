/* ============ pack / journal / save ============ */
function openModal(tab){
  if (tab === 'roster' && S) return openRoster(null); // v7.2: the roster (38c)
  const m = $('#modal'); if (m.hidden) AUDIO.play('open'); m.hidden = false; m.scrollTop = 0;
  const tabs = S ? ['pack','journal','save','deeds'] : ['save','deeds']; routeAnim = null;
  const body = {
    pack:()=>`<div class="kv">${S.book === 'dg' ? `<span>Water</span><span>${chainW()} skin${chainW() === 1 ? '' : 's'}</span>` : S.book === 'mt' ? `<span>Docks</span><span>${S.silver}</span>${typeof b5DebtTotal === 'function' ? `<span>The squad's debts</span><span>${b5DebtTotal()} docks</span>` : ''}` : `<span>Silver</span><span>${S.silver}</span>`}${S.book === 'mt' ? `<span>${zoomArt('munitions/salve', 'ico', 'Healing salves', true)}</span><span>${S.inv.salve}</span>` : `<span>${zoomArt('munitions/sharper', 'ico', 'Sharpers', true)}</span><span>${S.inv.sharper}</span><span>${zoomArt('munitions/burner', 'ico', 'Burners', true)}</span><span>${S.inv.burner}</span><span>${zoomArt('munitions/cusser', 'ico', 'Cussers', true)}</span><span>${S.inv.cusser}</span>${S.inv.smoker > 0 || S.f.gotSmokers ? `<span>${zoomArt('munitions/smoker', 'ico', 'Smokers', true)}</span><span>${S.inv.smoker}</span>` : ''}<span>${zoomArt('munitions/salve', 'ico', 'Healing salves', true)}</span><span>${S.inv.salve}</span>`}
      <span>Squad level</span><span>${S.lvl} (${S.xp}/${S.lvl < lvCap() ? LEVELS[S.lvl] : '—'} xp)</span>${S.card ? `<span>${S.book === 'mt' ? 'Tile reading' : 'Deck reading'}</span><span>${CARDS[S.card].name}</span>` : ''}</div>
      ${S.card ? `<div class="cardinline" style="margin-top:12px"><canvas id="icard" width="240" height="360"></canvas></div><p class="fine" style="text-align:center">${CARDS[S.card].fx}</p>` : ''}
      ${packKitHTML()}
      ${S.wounds ? `<h4 class="jh">Wounds carried (Bridgeburner)</h4><div class="kv wounds">${SQUAD().map(id => woundOf(id) == null ? '' : `<span>${esc(NAME(id))}</span><span>${woundOf(id)} / ${S.wounds[id + '_max'] || '?'} health ${S.inv.salve > 0 && woundOf(id) < (S.wounds[id + '_max'] || 0) ? `<button class="btn sm" data-salve="${id}">Salve +8</button>` : ''}</span>`).join('')}</div><p class="fine">Wounds close when the squad rests: at the start of a chapter, or where the story lets them sleep.</p>` : ''}
      <p class="fine" style="margin-top:10px">${S.book === 'mt' ? 'Lether has no Moranth munitions. ' : 'Moranth munitions hit everything in the blast, your own squad included. '}${S.book === 'mt' ? 'Sorcery, and the surgeon\'s hands, build strain' : 'Warren magic builds strain'}; past ${strMax()}, the caster pays in blood (the limit grows at levels 4 and 7).</p>`,
    deeds:()=>deedsHTML(),
    journal:()=>`${journalHead()}<div class="route sm"><canvas id="jRoute"></canvas></div><h4 class="jh">Notes</h4><ul class="jl">${journalNotes().map(l => `<li>${l}</li>`).join('')}</ul>${artJournalHTML()}${typeof visionsHTML === 'function' ? visionsHTML() : ''}${glossHTML()}${typeof whereBooksMeetHTML === 'function' ? whereBooksMeetHTML(false) : ''}${typeof timelineHTML === 'function' ? timelineHTML(false) : ''}`,
    save:()=>`${S ? `<p class="fine">Playing as <b class="who">Sergeant ${esc(S.name)}</b>. The game saves itself on this device as you play, under your sergeant's name. Anyone else can start their own sergeant from the title, and each keeps a save of their own.</p>
      <div class="row" style="margin:8px 0 16px"><button class="btn" id="bSwitch">Switch sergeant</button></div>` : ''}
      <h4 class="jh">Keep your saves safe</h4>
      <p class="fine">Saves live in this browser's storage for this site. <b>Clearing the browser's data (cache, cookies, site data) erases every sergeant on this device.</b> A backup file does not: it holds every sergeant here${roster().list.length ? ` (${roster().list.length === 1 ? 'one' : roster().list.length})` : ''}, with your settings, and loads back in with one tap. Keep one after every chapter or two.</p>
      <p class="fine" id="bkWhen">${backupMark() ? `Last backed up ${agoText(backupMark().at) || 'today'}.` : roster().list.length ? 'Never backed up on this device.' : ''}</p>
      ${roster().list.length ? `<div class="row" style="margin:8px 0 16px"><button class="btn primary" id="bDown">Save a backup file</button>${canShareBackup() ? `<button class="btn" id="bShare">Send it on (Drive, mail…)</button>` : ''}</div>` : ''}
      <label class="fine" for="bkFile">Load a backup file to bring its sergeants back</label>
      <div class="row" style="margin:8px 0 16px"><input type="file" id="bkFile" accept=".json,application/json,text/plain" hidden><button class="btn" id="bRestore">Load a backup file</button></div><p class="fine" id="bkMsg" role="status"></p>
      <h4 class="jh">Save codes</h4>
      ${S ? `<label class="fine" for="exp">Sergeant ${esc(S.name)}'s save code: one sergeant as text, for moving them to another device.</label>
      <textarea id="exp" readonly>${saveCode()}</textarea><div class="row" style="margin:8px 0 16px"><button class="btn" id="bCopy">Copy code</button></div>`
      : `<p class="fine">A save code is one sergeant as text, for moving them from another device.</p>`}
      <label class="fine" for="imp">Paste a save code to load it</label><textarea id="imp" placeholder="Paste code here"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="bLoad">Load code</button></div><p class="fine" id="impMsg"></p>`,
  };
  m.innerHTML = smartq(`<div class="mbox"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><h2 class="m">${S ? ((BOOKS[(S.book) || 'gotm'] || BOOKS.gotm).squad || 'The squad') : tab === 'deeds' ? 'Deeds' : 'Saves and backups'}</h2><button class="btn" id="bClose">Close</button></div>
    <div class="tabs">${S ? `<button class="tab" data-t="squad">Squad</button><button class="tab" data-t="roster">Roster</button>` : ''}${tabs.map(k => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    <div>${body[tab]()}</div></div>`);
  m.querySelectorAll('.tab').forEach(b => b.onclick = () => { AUDIO.play('click'); if (b.dataset.t === 'squad') { m.hidden = true; openChars(0); } else openModal(b.dataset.t); });
  $('#bClose').onclick = () => { AUDIO.play('close'); m.hidden = true; };
  m.querySelectorAll('[data-salve]').forEach(b => b.onclick = () => { salveOut(b.dataset.salve); openModal('pack'); }); // Bridgeburner: a salve between fights
  if (tab === 'pack' && S.card) inlineCard($('#icard'), S.card, false);
  bindItemZoom(m);
  if (tab === 'deeds') bindDeeds();
  if (tab === 'journal') bindArtJournal(m);
  if (tab === 'journal' && typeof bindVisions === 'function') bindVisions(m);
  if (tab === 'journal') { const cv = $('#jRoute'); routeAnim = t => { if (!cv.isConnected || $('#modal').hidden) { routeAnim = null; return; } drawRoute(cv, S, t); }; }
  if (tab === 'save') {
    if ($('#bCopy')) $('#bCopy').onclick = () => { const ta = $('#exp'), b = $('#bCopy'); ta.focus(); ta.select(); AUDIO.play('click');
      const done = ok => { b.textContent = ok ? 'Copied' : 'Selected: copy it by hand'; };
      const old = () => { try { done(document.execCommand('copy')); } catch(e) { done(false); } }; // older browsers, and pages without clipboard permission
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(() => done(true), old); else old(); };
    if ($('#bSwitch')) $('#bSwitch').onclick = () => { AUDIO.play('click'); save(); m.hidden = true; showTitle(); };
    // v8.2: the backup file (35b). Download or share; restore merges, and asks twice before replacing a sergeant already here.
    const bkSaid = t => { $('#bkWhen').textContent = `Last backed up ${agoText(Date.now()) || 'today'}.`; $('#bkMsg').textContent = t; };
    if ($('#bDown')) $('#bDown').onclick = () => { AUDIO.play('click'); bkSaid(downloadBackup() ? `Saved as ${backupName()}. Keep it somewhere the browser can't clear: Files, Drive, or mail it to yourself.` : 'The file could not be made here. Copy the save code below instead.'); };
    if ($('#bShare')) $('#bShare').onclick = () => { AUDIO.play('click'); shareBackup().then(ok => { if (ok) bkSaid('Sent.'); }); };
    const br = $('#bRestore'), bf = $('#bkFile'); let pending = null;
    const unarmBk = () => { pending = null; br.classList.remove('warn'); br.textContent = 'Load a backup file'; };
    const applyBk = b => { const n = restoreBackup(b); unarmBk(); $('#bkMsg').textContent = n ? `${n === 1 ? 'One sergeant' : `${n} sergeants`} back on this device.` : 'Nothing in that file could be loaded.'; if (n) { m.hidden = true; if (S) { const me = roster().list.find(e => e.id === S.sid); if (me) { const s = loadSlot(S.sid); if (s) S = s; } } showTitle(); } };
    br.onclick = () => { AUDIO.play('click'); if (pending) return applyBk(pending); bf.value = ''; bf.click(); };
    bf.onchange = () => { const f = bf.files && bf.files[0]; if (!f) return; f.text().then(t => { const b = parseBackup(t); if (!b || !b.sergeants.length) { unarmBk(); $('#bkMsg').textContent = 'That file didn\'t load. It should be a From the Ranks backup (a .json file saved from this page).'; return; }
      const cl = backupClashes(b); if (!cl.length) return applyBk(b);
      pending = b; br.classList.add('warn'); br.textContent = `Replace ${cl.length === 1 ? `Sergeant ${cl[0]}` : `${cl.length} sergeants`}`; $('#bkMsg').textContent = tapWord(`${cl.length === 1 ? `Sergeant ${cl[0]} already has` : `${cl.join(', ')} already have`} a save on this device. Tap again to replace ${cl.length === 1 ? 'it' : 'them'} with the file's copy; the file's other sergeants are added either way.`); }, () => { $('#bkMsg').textContent = 'That file could not be read.'; }); };
    // a code for a sergeant already on this device asks twice: the second tap replaces that sergeant's save
    const bl = $('#bLoad'), unarm = () => { if (bl.dataset.arm) { delete bl.dataset.arm; bl.classList.remove('warn'); bl.textContent = 'Load code'; $('#impMsg').textContent = ''; } };
    $('#imp').oninput = unarm;
    bl.onclick = () => { let s = null; try { s = JSON.parse(decodeURIComponent(escape(atob($('#imp').value.trim())))); } catch(e) {}
      if (!s || s.v !== 1) { const b = parseBackup($('#imp').value); if (b && b.sergeants.length > 1) { unarm(); $('#impMsg').textContent = 'That is a whole backup, not one sergeant\'s code: load it with Load a backup file above.'; return; } // v8.2
        unarm(); $('#impMsg').textContent = 'That code didn\'t load. Check that it was copied in full.'; return; }
      s.name = String(s.name || 'Hask').slice(0, 18); const ex = roster().list.find(e => sameName(e.name, s.name));
      if (ex && !bl.dataset.arm) { bl.dataset.arm = 1; bl.classList.add('warn'); bl.textContent = `Replace Sergeant ${ex.name}`; $('#impMsg').textContent = tapWord(`Sergeant ${ex.name} already has a save on this device. Tap again to replace it with the one in this code.`); return; }
      AUDIO.play('click'); s.sid = ex ? ex.id : newSid(); S = migrate(s); save(); m.hidden = true; resume(); };
  }
  m.onclick = e => { if (e.target === m) m.hidden = true; };
}
/* the journal's notes, newest chapter first. Each line waits on the flag that means the player has seen it happen, so nothing spoils. */
function journalNotes(){
  if (S.book && S.book !== 'gotm') return [1, 2, 3, 4, 5, 6, 7].filter(n => n <= (S.chapter || 1) && CHAPTERS[n] && CHAPTERS[n].journal).reverse().map(n => { try { return CHAPTERS[n].journal() || []; } catch(e) { return []; } }).flat().filter(Boolean); // later books: each chapter's own journal lines
  const f = S.f, ch = S.chapter || 0, done = n => !!(S.chapters && S.chapters[n] != null) || ch > n, here = id => SQUAD().includes(id);
  const dead = Object.keys(S.dead || {}).filter(id => TPL[id]);
  const c7 = ch >= 7 ? [
    f.c7_ellisBack ? `Ellis came back out of the dark on the Lakefront. Four days, by the Fourth's count. Longer, by hers.` : f.c7_ellisLeft ? `Ellis came back out of the dark, and went her own way from the Lakefront with Kettle's cord on her wrist.` : '',
    f.c7_ellisJoined ? `Ellis was waiting on a cask at the green door, and went in with the Fourth.` : f.c7_ellisWalked ? `Ellis was waiting at the green door. She walked east alone.` : '',
    f.c7_ellisSpoke ? `Ellis has said her piece about the hillside.` : '',
    f.c7_clawTalked || f.c7_clawBought || f.c7_clawFought ? `The grey cloak's page on the Fourth: closed.` : f.c7_clawDeal === 'took' ? `The grey cloak wrote the Fourth a pardon, and a line after every name.${f.c7_pardonEmpty ? ' The lines say nothing.' : ''}` : f.c7_clawAvoided ? `The grey cloak's page on the Fourth stays open. Entries keep.` : f.c7_clawDeal === 'refused' ? `The grey cloak offered the Fourth a pardon. You said no.` : '',
  ] : [];
  const c6 = ch >= 6 ? [
    f.c6_key === 'bridgeburners' ? `The Fete: the Fourth held Lady Simtal's garden beside the Bridgeburners while the Tyrant came up out of the ground.` : f.c6_key === 'cellars' ? `The Fete: the Fourth went under the Gadrobi crossing and stopped the Claw firing the mines.` : f.c6_key === 'alley' ? `The Fete: the Fourth followed the Adjunct into an alley. ${f.c6_steppedIn ? '"Hold him," she said, and you stepped in.' : '"Hold him," she said, and you stood aside.'}` : '',
    f.c6_orders ? `In the pack: an unsigned order, in a neat hand, to fire the charges under the crossing.` : '',
    f.c6_lornEnd ? `The Adjunct is dead. Paran has her sword.` : '',
    f.c6_wjLeg ? `Whiskeyjack's leg is splinted to a halberd shaft.` : '',
    done(6) ? `A small wrong house of living wood has grown out of Lady Simtal's lawn overnight.` : '',
    ...dead.map(id => `${TPL[id].name} ${S.dead[id].ch === 6 ? 'fell the night of the Fete' : 'is dead'}.${here('ohl') ? ' Ohl has written the name on his list.' : ''}`),
  ] : [];
  const c5 = ch >= 5 ? [
    f.c5_key ? `On the hills a puppet opened the world, and Toc the Younger went through it.` : '',
    f.c5_ellisThrough ? `Ellis went into the grey after him. Nobody has said the word <em>dead</em>.` : f.c5_ellisHeld && !f.c7_ellisSpoke ? `Ellis would have gone after him. The Fourth held on to her, and she hasn't said a word to you since.` : '',
    f.c5_tuftMarked ? `Tuft put her arm into the rent up to the elbow. She came back with grey in her hair.` : '',
    f.c5_collDown ? `The Adjunct rode a big man down on the hill road, and did not stop.` : '',
    done(5) ? `The Adjunct has gone on to the city. Paran is following her. Under the barrow, something has started to knock.` : '',
  ] : [];
  const c4 = ch >= 4 ? [
    f.c4_key === 'shield' ? `On the roofs the Fourth stood between a Guild boy and the Tiste Andii hunting him, and held. The boy's name is Vell.${SQUAD().includes('vell') ? ` He walks with the Fourth now, with forty feet of tarred line on his shoulder.` : ''}${f.c4_ellisToc ? ` Ellis went east that night, into the hills, to find her captain.` : ''}` : f.c4_key === 'aside' ? `On the roofs you let the Tiste Andii through. It killed the Guild boy in one motion, looked at the sergeant, and nodded.` : '',
    f.c4_reprisalFought ? `The Guild came for the Fourth after. Fewer of them walked home than went out.` : '',
    f.b1_c4_sappers ? `Kettle sat both nights before the roofs in the hole under the crossing with Hedge and Fiddler, keeping the nest dry. Hedge has promised her second place in the queue for a better cusser.` : '',
  ] : [];
  const c3 = ch >= 3 ? [
    f.c3_key === 'report' ? `You told the grey-haired woman at the dye-shop what the Bridgeburners are doing under the city, for forty silver.${f.c7_wjKnows ? ' Whiskeyjack knows now.' : ' Whiskeyjack does not know.'}` : f.c3_key === 'refuse' ? `You told the grey-haired woman at the dye-shop nothing, and paid for it in an alley. The Claw has the sergeant's name now.` : '',
    f.c3_wjTold ? `Whiskeyjack heard about the dye-shop from you. "Good," he said.` : '',
    f.c3_kruppeRumour ? `Kruppe, caught palming a coin at the Phoenix: the Guild's roof watchers sweep on a count of eight, and never look straight down.` : '',
  ] : [];
  const c2 = ch >= 2 ? [
    f.c2_key === 'light' ? `You rode to the light on the plain, against orders and against the clock. Black glass, and the Rhivi carried something away.` : f.c2_key === 'road' ? `You kept the road. Before dawn three tall strangers with silver hair walked into camp to ask if you had gone to the light.` : '',
    f.c2_ellisJoined ? `Ellis, Toc the Younger's scout, rides with the Fourth: six years a Claw scout, and a burned hand she doesn't explain.` : f.c2_ellisRefused ? `Ellis, Toc's scout, asked to ride with the Fourth. You kept the squad at five, and she rode on with Toc.` : '',
    f.c2_crone ? `A Great Raven called Crone landed by the fire and laughed at the Fourth.` : '',
  ] : [];
  const c1 = ch >= 1 ? [
    f.c1_reported ? `Whiskeyjack: the Fourth rides south overland with the baggage. Darujhistan.` : `Report to Whiskeyjack at the Bridgeburners' fire.`,
    f.c1_paran ? `Captain Paran walked the lines. Noble-born. Trying.` : '',
    f.b1_c1_dujek ? `Dujek Onearm at the Second's burial field, reading the helmets: "Ask for the living first. The dead keep."` : '',
    f.b1_c1_tattersail ? `Tattersail's second reading, before the Hounds: the Mason high, the Knight of High House Dark against Shadow. "Let it decide you're a wall."` : '',
    f.c1_sawHairlock ? `Tattersail's puppet turned its head.` : '',
    f.c1_plant ? `Tattersail knows about Tuft's badge. So, now, do you.` : '',
    f.c1_hounds ? `The Hounds of Shadow came through the tent lines. ${f.c1_key === 'claw' ? 'You held the crate.' : 'You held the line.'}` : '',
    f.c1_accounting ? `The Claw came to settle accounts at the picket line.` : '',
  ] : [];
  const extra = [7, 6, 5, 4, 3, 2].filter(n => n <= ch && CHAPTERS[n] && CHAPTERS[n].journal).map(n => { try { return CHAPTERS[n].journal() || []; } catch(e) { return []; } }); // optional: a chapter module may still add journal:()=>[lines]
  const tuft = (S.dead && S.dead.tuft) || !SQUAD().includes('tuft') ? '' : ['glove', 'shadow', 'dark'].includes(f.c6_tuft) ? `Tuft and the High Mage: cut, at the Fete.` : f.c7_tuftCut ? `Tuft and the High Mage: cut, at the last.` : f.c6_tuft === 'kept' ? `Tuft and the High Mage: the badge is still on her collar.` : f.c1_qbTuft ? `Tuft and the High Mage: asked, not answered.` : f.c1_plant ? `Tuft and the High Mage: unasked.` : '';
  const tav = f.c7_tav ? `Brisk's brother, Second Army: alive, on the Host's rolls.` : f.c1_pits || f.c2_badge ? `Brisk's brother, Second Army: not yet found.` : '';
  return [...extra, ...c7, ...c6, ...c5, ...c4, ...c3, ...c2, ...c1,
    f.quest ? `Recover Varrow's satchel from the north sapper tunnels and bring it to Tattersail. ${S.ending ? '(Done.)' : ''}` : `Answer the cadre's summons.`,
    f.knowStakes ? `Tattersail says the journal records who ordered what the night the Second Army died.` : '',
    f.knowDeserters ? `Garrow: Moreau's section deserted into the north tunnels. "The Fist is still counting heads."` : '',
    f.clawMet ? (f.clawFooled ? `A grey cloak at the crater believed the grave-detail story.` : `A grey cloak is paying attention to your squad.`) : '',
    f.knowTruth ? `Varrow's journal: the cadre was moved forward <em>before</em> the Spawn attacked.` : '',
    tav, tuft].flat().filter(Boolean);
}
function saveCode(){ return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }

/* the journal's head: where the chapter stands now, and the road so far (the ending each chapter took) */
function journalHead(){
  const CH = CHAPTERS[S.chapter], a = AREAS[S.area], safe = f => { try { return f() || ''; } catch(e) { return ''; } };
  const now = S.scene === 'explore' ? (a ? safe(() => a.quest ? a.quest() : QUESTS[a.id] ? QUESTS[a.id]() : '') : '') : '';
  const road = Object.keys(S.chapters).map(Number).sort((x, y) => x - y).map(n => { const e = (CHEND[n] || {})[S.chapters[n]]; return e ? `<li><span>${n === 0 ? 'Prologue' : `Chapter ${CHAPTERS[n] ? CHAPTERS[n].number : n}${CHAPTERS[n] ? ' · ' + CHAPTERS[n].title : ''}`}</span><b>${e[0]}</b></li>` : ''; }).join('');
  return `<p class="jk">${S.chapter === 0 ? 'The prologue' : `Chapter ${CH ? CH.number : S.chapter}${CH ? ` · ${CH.title}` : ''}`}</p>${now ? `<p class="jnow">${now}</p>` : ''}${road ? `<h4 class="jh">The road so far</h4><ol class="fin-road">${road}</ol>` : ''}`;
}

/* the glossary at the foot of the journal: the words the book throws at you, unlocked as the story reaches them */
/* a later book's own glossary rows, the same shape: [chapter, word, meaning, met?] (47) */
const GLOSSX = {};
const GLOSS = [
  [0, 'The Malazan Empire', 'The Empire the Fourth serves: an Empress on the throne in Unta, armies on three continents, and a habit of taking cities.'],
  [0, "Onearm's Host", "What is left of the Second, Fifth and Sixth Armies on Genabackis, under High Fist Dujek Onearm. The Fourth are marines in it."],
  [0, 'Marines', 'Small squads with their own sapper, mage and healer, sent where a regiment would be noticed.'],
  [0, 'The Bridgeburners', "Whiskeyjack's company: veterans and sappers, the Empire's best, and the Empress's least trusted."],
  [0, 'The cadre', "The army's battle-mages. After the Pale, there are very few of them left."],
  [0, 'The Claw', "The Empress's assassins and spies. Grey cloaks. They keep lists."],
  [0, 'Warrens', 'The paths sorcery is drawn from. Tuft draws on Meanas, shadow and illusion; Ohl on Denul, healing. Draw too hard and it costs strain, and then blood.'],
  [0, 'Meanas', 'The warren of shadow and illusion: Tuft\'s. Quiet, and good for hiding things in.'],
  [0, 'Denul', 'The warren of healing: Ohl\'s. It closes wounds; it does not argue with Hood for free.'],
  [0, 'Moranth munitions', 'Clay grenados from the Moranth alchemists: sharpers throw iron, burners throw fire, smokers throw cover, and cussers take down walls. Thirteen to a crate: twelve and a dud.'],
  [0, "The Moon's Spawn", 'A mountain of black stone that floats, and hangs over whatever it chooses.'],
  [0, 'The Deck of Dragons', 'A deck of cards whose Houses are the powers of the world. A reading shows who is watching you.'],
  [0, 'Hood', 'The Lord of Death. Soldiers swear by his breath, his teeth and his gate.'],
  [0, 'Pale', 'The city the Second Army took, at the price of most of itself.'],
  [1, 'The Moranth', 'A people in chitin armour who sort themselves by colour and ride quorls, flying things like enormous dragonflies. The Black Moranth fly for Onearm.'],
  [1, 'The Hounds of Shadow', "The hunting beasts of High House Shadow, the size of horses, with eyes like lamps seen through smoke."],
  [1, 'Kurald Galain', 'The Warren of Darkness: an Elder warren, older than any the human mages draw on. Otataral does not quell it.'],
  [1, 'Mockra', 'The warren of the mind: what a person thinks they heard, and who they think said it.', () => S.lvl >= 3],
  [1, 'Shadowthrone', 'King of High House Shadow, on a throne in Shadowkeep. Nobody agrees on what he wants. Everybody agrees he is laughing.', () => godMet('tuft') || watchedVis('v3_qb')],
  [1, 'Soliel, Mistress of Healing', 'A goddess of healing, with temples across the Empire. Healers pray to her. She does not often answer soldiers.', () => godMet('ohl')],
  [1, 'Fener', 'The Boar of Summer, the god of war: the soldiers\' god, for when Hood is standing too close.', () => godMet('sgt')],
  [1, () => godMet('ellis') || godMet('vell') ? 'Cotillion, the Rope' : 'The Rope', 'The Patron of Assassins, of High House Shadow. The Guild calls on him on the rooftops; anyone with a long drop under them might.', () => godMet('ellis') || godMet('vell') || (S.chapter || 0) >= 4],
  [2, 'The Rhivi', 'Herders and riders of the central plains, who fight beside the Empire\'s enemies and carry their dead a long way.'],
  [2, 'Great Ravens', 'Ravens as big as a man, who remember everything and serve a lord they talk about far too much. Crone is the eldest.'],
  [3, 'Darujhistan', 'The City of Blue Fire: the last free city on Genabackis, lit by gas drawn up from the caverns beneath it.'],
  [3, 'Daru and Gadrobi', 'The city\'s two peoples. The Daru hold its money and its Council; the Gadrobi do its work, and give their name to the poorer districts and the hills to the east.'],
  [3, 'Oponn', 'The Twins of chance: the Lady pulls, the Lord pushes. A spinning coin is their business.'],
  [4, 'The Tiste Andii', "An old, long-lived people, tall and dark-skinned, who keep to the night. The Moon's Spawn is theirs."],
  [4, 'The Guild', "Darujhistan's assassins. They work the rooftops, and they do not like company up there."],
  [5, 'The Jaghut', 'An ancient race of solitary sorcerers, masters of ice. A few of them made themselves tyrants, and were buried for it.'],
  [5, 'Raest', 'The Jaghut Tyrant in the barrow on the Gadrobi Hills, buried by his own people a very long time ago.', () => S.f.c5_rise || (S.chapter || 0) >= 6],
  [5, "T'lan Imass", 'Undying warriors of bone and flint, bound to hunt the Jaghut for ever. They fought beside the old Emperor.'],
  [5, 'Otataral', 'A red ore that kills sorcery near it. Nobody with a warren wants to stand close to it. The Elder warrens shrug it off: Kurald Galain, Tellann, and the Jaghut\'s Omtose Phellack.'],
  [5, 'The Adjunct', "The Empress's own hand, answerable to nobody below the throne."],
  [6, "Gedderone's Fete", "Darujhistan's spring festival: masks, paper lanterns, and winter chased out of the doorways at dawn."],
  [6, 'Omtose Phellack', 'The Jaghut warren: ice, and the cold that keeps.'],
  [6, 'The Azath', 'Houses that grow out of the ground where they are needed, and keep what is put in them.'],
  [6, 'The Finnest', 'Where a Jaghut keeps their power: set outside the body, in some object, and hidden. A Tyrant without it is less than he was.', () => S.chapters && S.chapters[6] != null],
  [6, 'Dragnipur', 'A sword that keeps what it kills. They go on, in chains, dragging a wagon through the dark inside it.', () => watchedVis('v6_rake')],
];
const godMet = id => !!(S && ((S.godsMet || []).includes(id) || (S.gods && (S.gods.used || []).includes(id))));
const seenVis = id => !!(S && (S.tuftVisions || []).includes(id)); // Tuft's: seen at a reading, not replayed from the journal
const watchedVis = id => !!(S && (S.seenVisions || []).includes(id)); // any, the journal's replays too
/* a row shows from its chapter on, and only once its met() test (if it has one) is true: the player has heard the word */
function glossHTML(){
  const ch = S ? S.chapter || 0 : 0, val = x => typeof x === 'function' ? x() : x;
  const rows = (S && S.book && S.book !== 'gotm' && GLOSSX[S.book] ? GLOSSX[S.book] : GLOSS).filter(g => { try { return g[0] <= ch && (!g[3] || (S && g[3]())); } catch(e) { return false; } });
  return `<details class="gloss"><summary>Words you'll hear</summary><dl>${rows.map(([, t, d]) => `<dt>${val(t)}</dt><dd>${d}</dd>`).join('')}</dl>${ch < 7 ? `<p class="fine">More as the story reaches them.</p>` : ''}</details>`;
}

/* what's new: shown once after an update (to a player with a save), and again from the version number on the title */
const NOTES = [ // Trygalle Run's own history. The From the Ranks engine's notes stay with From the Ranks.
  ['0.6.0', ['A guild carriage never runs on fewer than six horses. The team is matched to the load: six for a light one, nine for a heavier one, twenty for the heaviest. Six on the title, six in every scene, and the whole team in the fight.', 'Each cargo has a weight. When a crate is smashed, the carriage runs a little lighter and faster.']],
  ['0.5.0', ['New horses on the title, drawn with the From the Ranks horse at a full gallop, and a new carriage: iron-bound, sprung, lamps lit and cargo lashed under a tarp.', 'Trygalle Run now keeps its own version history. The engine it was built from no longer sends its notes here.']],
  ['0.4.0', ['A new title screen: the guild carriage racing a torn warren, ash hounds behind, under the guild\'s own seal.', 'Trygalle Run has its own music: a road song in E Dorian, and a galloping title theme that drops into the warren now and then.', 'No more book covers: New run starts a run, and lists the other saves on this device.']],
  ['0.3.0', ['Play together on one wifi with no internet: Host on this wifi, Join on this wifi, and swap a QR code each.']],
  ['0.2.4', ['Rejoin room: a dropped or reloaded player gets back into the room with one tap from the title.']],
  ['0.2.3', ['Co-op survives a phone switching apps: it reconnects on its own and the host hands the shareholders back. A co-op run never overwrites your own save.']],
  ['0.2.1', ['Fixed the site failing to open on a second visit.']],
  ['0.2.0', ['Play together: host a run, share a four-letter code, and each friend drives their own shareholders.']],
  ['0.1.0', ['The first contract: the guild yard, the counting-room, Ossel\'s fire, and the Ashway, a real-time fight with pause.']],
];
const SEENKEY = 'trygalle-run-seen';
/* since = the version this player last saw: every note after it, newest first. From the title's version number or Settings
   (since null): the newest note, with every earlier one behind "Earlier versions". */
function openNotes(since){
  const vn = v => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0);
  const fresh = since ? NOTES.filter(([v]) => vn(v) > vn(since)) : [], list = fresh.length ? fresh : NOTES.slice(0, 1), rest = NOTES.slice(list.length);
  const one = ([v, ls]) => `<h4 class="jh">v${v}</h4><ul class="jl">${ls.map(l => `<li>${l}</li>`).join('')}</ul>`;
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = smartq(`<div class="mbox notes"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><h2 class="m" id="notesH">What's new</h2><button class="btn icon" id="bClose" aria-label="Close">×</button></div>
    ${list.map(one).join('')}
    ${rest.length ? `<details class="gloss earlier"><summary>Earlier versions</summary>${rest.map(one).join('')}</details>` : ''}
    <div class="row" style="margin-top:14px"><button class="btn primary" id="bNotesOk">Carry on</button></div></div>`);
  m.scrollTop = 0;
  const close = () => { AUDIO.play('click'); m.hidden = true; };
  $('#bClose').onclick = close; $('#bNotesOk').onclick = close; m.onclick = e => { if (e.target === m) m.hidden = true; };
}
function maybeNotes(has){
  let seen = null; try { seen = localStorage.getItem(SEENKEY); localStorage.setItem(SEENKEY, VERSION); } catch(e) { return; }
  if (seen && !/^0\./.test(seen)) seen = '0.0.0'; // a From the Ranks version number from before the split: show Trygalle's own notes from the start
  if (has && seen !== VERSION) openNotes(seen);
}
