/* ============ Trygalle Run: the title ============
   From the Ranks' title is a shelf of books. Trygalle Run has one story, so the shelf goes: a New run button opens the
   new-captain form (which also lists the other saves on this device), the form loses its book row, and the words say
   captain and run instead of sergeant and book. The art and the music are Trygalle's own (046, and the 'ttg' voice in 013). */
{ const _showTitle = showTitle; showTitle = function(fresh, want){ const r = _showTitle.apply(this, arguments);
  try { if (view !== 'title') return r; const T = $('#title'); if (!T) return r;
    const words = el => { if (el) el.innerHTML = el.innerHTML.replace(/Sergeant /g, '').replace(/sergeants/g, 'captains').replace(/sergeant/g, 'captain'); };
    const sh = T.querySelector('.shelf'); if (sh) sh.remove();
    const bs = T.querySelector('.bseg'); if (bs) { const f = bs.closest('.field'); if (f) f.remove(); }
    const bn = $('#bNew'); if (bn) bn.textContent = 'Begin the run';
    const bb = $('#bBack'); if (bb) bb.textContent = 'Back';
    T.querySelectorAll('.sgtrow .load b, .roster .rh, #nmLab, #nmMsg').forEach(words);
    T.querySelectorAll('.sgtrow .load small').forEach(el => { el.textContent = el.textContent.replace(/^Book One · /, ''); });
    const rm = T.querySelector('.rmore'); if (rm) rm.textContent = rm.textContent.replace(/Open their book to carry on\./, 'Tap New run to see them.').replace(/sergeants?/g, m => m.replace('sergeant', 'captain'));
    T.querySelectorAll('p.fine').forEach(el => { el.innerHTML = el.innerHTML.replace(/Book One, Trygalle Run, beside The Trygalle Trade Guild\.\s*/, ''); });
    const host = T.querySelector('.tbtns');
    if (host && !(fresh || want) && !$('#bNewRun')) { const has = !!$('#bCont'), b = document.createElement('button'); b.id = 'bNewRun'; b.className = 'btn' + (has ? '' : ' primary'); b.textContent = 'New run';
      b.onclick = () => { try { AUDIO.play('click'); } catch (e) {} showTitle(true, 'ttg'); };
      const after = $('#bTogether'); if (after) after.after(b); else host.prepend(b);
      if (!has && $('#bTogether')) $('#bTogether').className = 'btn'; } // a new device: New run leads, Play together beside it
  } catch (e) { console.warn('ttg title', e); }
  return r; }; }
