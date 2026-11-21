/* ============ Trygalle Run, Chapter One: The Ashway ============
   The first contract. The guild yard in Darujhistan (explore), the factor, the cargo, the mage's warning, then the run itself:
   a real-time carriage battle through the Ashway (032). Ids carry a ttg_ prefix. Flags live in S.f.ttg_*. */

const TTG_CARGO = {
  spice:{name:'Spice', hp:6, value:60},
  casket:{name:'Sealed casket', hp:5, value:100},
  silk:{name:'Silk', hp:6, value:40},
  salt:{name:'Salt', hp:8, value:25},
};
/* what the carriage carries out of the yard: the casket only if the captain signed for it */
const ttgManifest = () => S.f.ttg_casket === 'refused' ? ['spice', 'salt', 'silk'] : ['spice', 'casket', 'silk'];

const TTG_CH1 = {
  title:'The Ashway', number:'One',
  endCap:()=>'Morning in Darujhistan. The yard gate shut behind the carriage, and the board is counting what came back.',
  endScene:'city_street',
  intro:{loc:'Darujhistan', sub:'The Trygalle Trade Guild\'s house · an hour before the gate', cap:'The guild yard under blue gaslight. One carriage is harnessed.',
    scene:'city_street',
    paras:[
`The board met at noon and gave you a carriage. Not a new one. Its last captain is on the list in the hall, three names from the bottom, and the shareholders who rode with her came back without her and without the cargo.`,
`You are Captain {sgt}, shareholder of the Trygalle Trade Guild, and tonight you sign for your first contract. Four shareholders ride with you: Tavos on the bench, Mira at the door, Quill on the roof, and Ossel, who will open the gate and, if all goes well, close it again behind you.`,
`The factor is waiting in the counting-room with the manifest. The horses are already nervous. Tavos says that is a good sign. Nobody believes him.`],
    go:'Walk the yard', node:'ttg_c1_start'},

  /* 16 x 12. # wall  . yard  , straw  = stable stalls  W the carriage (Tavos)  C counting-room door (the factor)  F the shareholders' fire
     x hitching post  8 crates waiting to load */
  area:{id:'ttg_yard', title:'The guild yard · Darujhistan', sub:'Counting-room north · the carriage by the gate', decor:'city_night',
    hint:'Tap ground to move · tap a figure to talk',
    map:[ "################",
          "#....C.........#",
          "#..............#",
          "#=.=.=....8.8..#",
          "#,,,,,.........#",
          "#..........x.x.#",
          "#......F.......#",
          "#..............#",
          "#.........W....#",
          "#..,...........#",
          "#.....,....,...#",
          "################" ],
    walk:'.,', triggers:{C:'ttg_c1_factor', W:'ttg_c1_carriage'},
    start:{x:7, y:8},
    folk:[{x:2, y:4, kind:'b2soldier', name:'A stable hand', line:'They know. Horses always know when it\'s a warren run. Look at their ears.', wander:1},
          {x:12, y:2, kind:'guard', name:'The yard guard', line:'Gate opens at the bell. After that it\'s Ossel\'s gate, not mine.'}],
    npcs:[
      {id:'ressel', name:'Factor Ressel', kind:'pell', x:5, y:2, node:()=>S.f.ttg_manifest ? 'ttg_c1_factor_again' : 'ttg_c1_factor', fresh:()=>!S.f.ttg_manifest},
      {id:'ossel', name:'Ossel', kind:'mammot', x:8, y:6, node:()=>'ttg_c1_ossel', fresh:()=>!S.f.ttg_ossel},
      {id:'mira', name:'Mira', kind:'brisk', x:9, y:8, node:()=>'ttg_c1_mira', fresh:()=>!S.f.ttg_mira},
      {id:'quill', name:'Quill', kind:'ellis', x:12, y:7, node:()=>'ttg_c1_quill', fresh:()=>!S.f.ttg_quill},
    ],
    quest:()=>!S.f.ttg_manifest ? 'Sign for the cargo in the counting-room' : 'Take the carriage out through the Ashway'},

  battles:{
    ttg_ashway:{rt:true, title:'The Ashway', sub:'A dead warren between Darujhistan and the Kanese coast', style:'plain_dusk', music:'battle', xp:120, after:'ttg_c1_through',
      /* logical map: x runs forward along the road, y across it. 20 x 12. # standing rock  . ground  , ash  ~ the road */
      map:[ "....#.........#.....",
            "..#......#.........#",
            "......#.......#.....",
            ".#..........#.......",
            "....................",
            "~~~~~~~~~~~~~~~~~~~~",
            "~~~~~~~~~~~~~~~~~~~~",
            "....................",
            "..#.....#......#....",
            ".......#....#.......",
            "...#..........#..#..",
            "#........#.........#" ],
      carriage:{x:1, y:5}, party:{tavos:'seat0', ossel:'seat2', sgt:[2, 4], mira:[2, 7], quill:[0, 4]},
      foes:[['ashhound', 12, 1], ['ashhound', 14, 10], ['gaunt', 17, 2], ['gaunt', 9, 11]],
      drift:{every:3.4, shifts:{4:{kind:'ash', count:30, wave:['ashhound', 'ashhound', 'gaunt', 'gaunt'], say:'The ground crumbles to ash. Crossing ash is slow, and more of them come.'},
                                8:{kind:'fire', count:16, wave:['ashhound', 'ashhound', 'gaunt', 'gaunt', 'gaunt'], say:'Fire bleeds out of the sky. Standing in it burns. A larger pack arrives.'}}},
      cargo:()=>ttgManifest()},
  },
  foes:{
    ashhound:{name:'Ash-hound', sig:'h', fig:'hound', hp:9, ac:12, atk:3, dmg:[1,6,1], rng:1, speed:3.2, cd:1.6, verb:'bites'},
    gaunt:{name:'Gaunt', sig:'g', fig:'wight', hp:12, ac:11, atk:2, dmg:[1,6,0], rng:1, speed:1.8, cd:2.2, verb:'claws', cargo:true},
  },

  dlg:{
    /* ---- opening ---- */
    ttg_c1_start:()=>({sp:'The guild yard', scene:'city_street', txt:
`The yard smells of horses and lamp oil. The carriage stands by the gate with its doors open, black lacquer worn grey at every edge a hand has held, and the guild's knot painted fresh on the door. Somebody has painted over the old captain's name on the bench. Not well.

Tavos is already on the bench, talking to the horses. Mira stands at the door as if it might leave without her. Quill is on the roof. Ossel sits by the fire with his staff across his knees and his eyes shut.

The counting-room lamp is lit. The factor does not like to wait.`,
      ch:[{t:'Walk the yard.', go:()=>startExplore()},
          {t:'Go straight to the counting-room.', go:'ttg_c1_factor'}]}),

    /* ---- the factor and the manifest ---- */
    ttg_c1_factor:()=>({sp:'Factor Ressel · counting-room', scene:'tent', txt:
`Factor Ressel is a narrow man behind a wide desk. The manifest is already written out, and he turns it round so you can read it without picking it up.

"Spice for a house in Kan. Silk for the same buyer. And this." He sets a hand on a small iron-bound casket at his elbow, the way a man rests his hand on a dog he is not sure of. "Sealed. A hundred in coin to the guild on delivery, unopened. The buyer was very clear about unopened."

"Your share is on the bottom line. Sign, Captain, and the gate opens at the bell."`,
      ch:[{t:'Look at the casket before you sign.', check:['wits', 12], edges:id => [id === 'ossel' && ['a seam-reader feels what is shut in', 2]], go:'ttg_c1_casket_read', fail:'ttg_c1_casket_miss', req:()=>!S.f.ttg_casketLooked, fx:()=>{ S.f.ttg_casketLooked = 1; }},
          {t:'Sign for all three.', fx:()=>{ S.f.ttg_casket = 'signed'; S.f.ttg_manifest = 1; }, go:'ttg_c1_signed'},
          {t:'Sign for the spice and silk. Leave the casket, and take a crate of salt for weight.', fx:()=>{ S.f.ttg_casket = 'refused'; S.f.ttg_manifest = 1; }, go:'ttg_c1_refused'}]}),
    ttg_c1_casket_read:()=>({sp:'The casket', txt:
`{who} puts a palm flat on the lid. It is warm. Not warm like a thing left by the fire. Warm like a thing that has been breathing.

"Whatever's in there," {who} says quietly, "it knows we're looking."

Ressel's face does not change. "Unopened," he says again. "A hundred in coin."

You know now why the buyer paid the guild and not a caravan: a caravan would have opened it. And you know something on the road will want it.`,
      fx:()=>{ S.f.ttg_casketKnown = 1; },
      ch:[{t:'Sign for all three. The Ashway can try.', fx:()=>{ S.f.ttg_casket = 'signed'; S.f.ttg_manifest = 1; }, go:'ttg_c1_signed'},
          {t:'Leave the casket. Take salt for weight.', fx:()=>{ S.f.ttg_casket = 'refused'; S.f.ttg_manifest = 1; }, go:'ttg_c1_refused'}]}),
    ttg_c1_casket_miss:()=>({sp:'The casket', txt:
`Iron bands, a wax seal pressed with a mark you do not know, and a lid that does not quite sit flat. It is a box. It is heavier than it looks. That is all you can tell.

"Unopened," says Ressel. "A hundred in coin."`,
      ch:[{t:'Sign for all three.', fx:()=>{ S.f.ttg_casket = 'signed'; S.f.ttg_manifest = 1; }, go:'ttg_c1_signed'},
          {t:'Leave the casket. Take salt for weight.', fx:()=>{ S.f.ttg_casket = 'refused'; S.f.ttg_manifest = 1; }, go:'ttg_c1_refused'}]}),
    ttg_c1_signed:()=>({sp:'Factor Ressel', txt:
`You sign. Ressel sands the ink and blows on it, and for the first time looks pleased.

"Spice, silk and the casket, Captain. Two hundred in coin to the guild if all three arrive. The casket rides inside, on the floor, where Mira can see it."

When you look back from the door he has his hand on the casket again, and he is not looking at you.`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_refused:()=>({sp:'Factor Ressel', txt:
`Ressel's pen stops above the page. "The board will hear you refused a hundred in coin on your first run."

"The board will hear I came back," you say.

He writes it down. Salt in place of the casket: worth a quarter as much, and twice as hard to break. Nobody on the road will want it. That is the point.`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_factor_again:()=>({sp:'Factor Ressel', txt:`"The manifest is signed, Captain. The bell will not wait for you."`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),

    /* ---- the shareholders ---- */
    ttg_c1_ossel:()=>({sp:'Ossel · the carriage\'s mage', scene:'fire', fx:()=>{ S.f.ttg_ossel = 1; }, txt:
`Ossel opens his eyes before you reach the fire. "The Ashway," he says. "Not the road I would choose. Not the road anyone would choose. That is why the buyer pays the guild."

"It was a warren once. Something burned it, a long time ago, and it is still burning, slowly, from the edges in. The longer we stay, the more of it goes. First ash. Then fire. I can hold it still for a little while. Not long. Tell me when."`,
      ch:[{t:'"How long do we have before it turns?"', check:['wits', 12], edges:id => [id === 'ossel' && ['he has read this seam before', 3]], go:'ttg_c1_ossel_read', fail:'ttg_c1_ossel_miss', req:()=>!S.f.ttg_drift},
          {t:'"Ride inside. Keep your strength for the gate."', req:()=>!S.f.ttg_osselIn, fx:()=>{ S.f.ttg_osselIn = 1; loy('ossel', 1); }, go:'ttg_c1_ossel_in'},
          {t:'Leave him to the fire.', go:()=>startExplore()}]}),
    ttg_c1_ossel_read:()=>({sp:'Ossel', fx:()=>{ S.f.ttg_drift = 'known'; }, txt:
`You sit with him and he draws the seam in chalk on a flagstone: a line, then a ragged edge, then a second edge inside the first.

"Here we are safe. Here it goes to ash: slow ground, and things come up out of it. Here the fire. Count to thirty after the gate, and again." He looks up. "And save my anchor for the fire. Ash you can walk through."

When the fight comes, you will know when the realm is about to shift, and Ossel will have his anchor ready from the start.`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_ossel_miss:()=>({sp:'Ossel', fx:()=>{ S.f.ttg_drift = 'guess'; }, txt:
`He starts to draw the seam in chalk and then stops, and rubs it out with his sleeve. "It changes. Every time. Count slowly, Captain, and listen for the ground."`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_ossel_in:()=>({sp:'Ossel', txt:`"Inside." He nods slowly. "The rear hatch. I can see the seams from there, and Mira can see me." For a moment he looks almost relieved.`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_mira:()=>({sp:'Mira · at the carriage door', fx:()=>{ S.f.ttg_mira = 1; }, txt:
`"Door's sound. Hinges oiled. Wheels greased. Tavos has told the horses about you." She does not smile, but it is close. "Last captain liked to ride inside and give orders through the window. I'd rather you didn't."

"In the Ashway, the things that come for the crates are slow. The things that come for people are not. Tell me which to stand in front of, and I'll stand there."`,
      ch:[{t:'"Stand in front of the crates. People can run."', fx:()=>{ S.f.ttg_miraPlan = 'crates'; loy('mira', 1); }, go:'ttg_c1_mira_ok'},
          {t:'"Stand in front of Ossel. Without him we never get out."', fx:()=>{ S.f.ttg_miraPlan = 'ossel'; }, go:'ttg_c1_mira_ok'}]}),
    ttg_c1_mira_ok:()=>({sp:'Mira', txt:`"Done." She raps the carriage door twice with her knuckles, the way some people touch wood.`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),
    ttg_c1_quill:()=>({sp:'Quill · on the roof', fx:()=>{ S.f.ttg_quill = 1; }, txt:
`Quill hangs her head over the edge of the roof. "Forty arrows," she says. "Hounds go down in two. The slow ones take four. I can't carry more without sitting on them."

She pulls herself back up. A moment later her voice comes down again. "Put me on the roof and leave me there, Captain. I see the whole road from up here."`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]}),

    /* ---- the carriage and the gate ---- */
    ttg_c1_carriage:()=> !S.f.ttg_manifest ? ({sp:'Tavos · on the bench', txt:`"Can't go without a manifest, Captain. Ressel would have the horses."`,
      ch:[{t:'Back to the yard.', go:()=>startExplore()}]})
      : ({sp:'Tavos · on the bench', txt:
`The bell is ringing. Tavos gathers the reins. Mira is at the door, Quill on the roof. Ossel walks to the yard gate, and the air beyond it is the wrong colour.

"Captain," Tavos says. "Once he opens it, we don't stop. Not for anything. You want to say something to them, say it now."`,
      ch:[{t:'"Shares out at the far side. All of us."', fx:()=>{ ['tavos', 'mira', 'quill', 'ossel'].forEach(id => loy(id, 1)); }, go:'ttg_c1_gate'},
          {t:'"Mind the crates. The board is counting."', go:'ttg_c1_gate'},
          {t:'"Not yet."', go:()=>startExplore()}]}),
    ttg_c1_gate:()=>({sp:'The gate', txt:
`Ossel puts both hands on the air and pulls, the way a man opens a heavy curtain, and the yard gate is not a gate any more. Beyond it: grey ground to the horizon, standing stones like broken teeth, and a sky the colour of old coals.

Tavos snaps the reins. The carriage goes through.

Behind you the gate shuts. Ahead, low shapes are already moving between the stones.`,
      ch:[{t:'Into the Ashway.', go:()=>startBattle('ttg_ashway')}]}),
    ttg_c1_through:()=>({sp:'The far side', scene:'city_street', txt:
`The far gate opens on a cobbled yard in Kan, wet with real rain. The horses stand blowing in the traces. Tavos is laughing at the weather.

${S.f.ttg_cratesLeft === 3 ? 'Every crate is sealed. The buyer\'s clerk counts them twice, and then once more, and signs.' : S.f.ttg_cratesLeft ? `${S.f.ttg_cratesLeft} of three crates come off the carriage whole. The clerk writes the rest down as losses, without comment, and signs for what is left.` : 'Nothing comes off the carriage whole.'}
${S.f.ttg_casket === 'signed' ? (S.f.ttg_casketSafe ? 'The casket goes into the buyer\'s hands unopened. He holds it like a man holding a live coal, and pays.' : 'The casket did not survive the road. Nobody wants to say what came out of it, or where it went.') : ''}

${S.f.ttg_lost ? `Not everyone came through. ${S.f.ttg_lost} stayed in the Ashway.` : 'Everyone who went in came out.'}`,
      ch:[{t:'Count the shares.', go:()=>chapterEnd(1, S.f.ttg_cratesLeft === 3 ? 'clean' : S.f.ttg_cratesLeft ? 'partial' : 'lost')}]}),
  },

  end:{
    clean:['Delivered whole', 'Every crate came off the carriage sealed. The board will say a first run is luck. The shareholders who rode with you are already saying something else.'],
    partial:['Delivered, with losses', 'The guild has paid for worse first runs. The board will read the manifest and the losses line, and they will remember both.'],
    lost:['Nothing delivered', 'The carriage came back and the crew came back. The cargo did not. The guild pays nothing for that, and says so.'],
  },
  tease:'Next: the board reads the manifest, and a second contract comes with a name nobody in the house wants to say.',
};
