// DDR フレアスキル シミュレータ - ブックマークレット (readable source)
// 手順:
// 1. SIMULATOR_URL と SUPABASE_URL / SUPABASE_ANON_KEY を埋める
// 2. jsmin / terser 等でminify
// 3. 先頭に javascript:void( 末尾に ) を付けてブックマークに登録

(function () {
  var SIMULATOR_URL    = 'https://harug5152.github.io/ddr-flareskill-simulator/';
  var SUPABASE_URL     = 'https://ddxzgrknjvxtvcukwngm.supabase.co';     // TODO
  var SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHpncmtuanZ4dHZjdWt3bmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODM3MDMsImV4cCI6MjA4OTE1OTcwM30.UjWJWhI6g_j54qpr4okmwmGOna2bA33QGwULv1G-neM';                // TODO
  var LS_KEY           = 'ddr_flare_uuid';

  // ---- Extract data ----
  // 2026年公式ページリニューアル対応:
  //   旧: <tr class="flareskill_{classic|white|gold}_table"> の td[0..4]
  //   新: <table class="table-ui compact theme-{classic|white|gold}"> 内の
  //       <tr class="data"> に td.chart / td.skill-value / td.flare-rank
  //   曲名は .music-name、難易度は .diff の class 属性、レベルは .level に格納
  //   日付カラムは廃止 → skillData 互換のため '0000-00-00' 固定
  var CATS = [
    {theme:'theme-classic', name:'CLASSIC'},
    {theme:'theme-white',   name:'WHITE'},
    {theme:'theme-gold',    name:'GOLD'},
  ];
  var DIFFS = ['BEGINNER','BASIC','DIFFICULT','EXPERT','CHALLENGE'];
  function imgToRankIdx(src) {
    if (!src) return 0;
    if (src.indexOf('flare_ex') >= 0) return 10;
    var m = src.match(/flare_(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }
  var style = location.href.indexOf('flare_data_double') >= 0 ? 'DP' : 'SP';

  var result = {CLASSIC:[], WHITE:[], GOLD:[]};
  for (var i=0; i<CATS.length; i++) {
    var cat = CATS[i];
    var table = document.querySelector('table.' + cat.theme);
    if (!table) continue;
    var rows = table.querySelectorAll('tbody tr.data');
    for (var j=0; j<rows.length; j++) {
      var row = rows[j];
      var nameEl = row.querySelector('td.chart .music-name');
      var name = nameEl ? (nameEl.textContent||'').trim() : '';
      if (!name) continue;
      if (name.indexOf('Steps to the Star') >= 0) continue;
      var diffEl = row.querySelector('td.chart .diff');
      if (!diffEl) continue;
      var diff = '';
      for (var k=0; k<DIFFS.length; k++) {
        if (diffEl.classList.contains(DIFFS[k])) { diff = DIFFS[k]; break; }
      }
      if (!diff) continue;
      var levelEl = diffEl.querySelector('.level');
      var lm = levelEl ? (levelEl.textContent||'').match(/Lv\.?(\d+)/i) : null;
      var level = lm ? parseInt(lm[1]) : 1;
      var img = row.querySelector('td.flare-rank img');
      var rankIdx = imgToRankIdx(img ? img.src : '');
      var fsEl = row.querySelector('td.skill-value');
      var fs = parseInt((fsEl ? fsEl.textContent : '0')||'0') || 0;
      result[cat.name].push({name:name, diff:diff, style:style, level:level, rankIdx:rankIdx, fs:fs, date:'0000-00-00'});
    }
  }

  var total = result.CLASSIC.length + result.WHITE.length + result.GOLD.length;
  if (total === 0) {
    alert('フレアスキルデータが見つかりません。\nフレアスキルページで実行してください。');
    return;
  }

  // ---- Optional parent connection ----
  // 初回は保存済みシミュレーションのUUID/共有URLを貼り付ける。
  // 保存成功後はこの公式サイト側のlocalStorageに子UUIDを記録し、
  // 次回の実データ取得時に親候補として自動入力する。
  var previousUuid = localStorage.getItem(LS_KEY) || '';
  var parentInput = prompt(
    '既存のバージョン履歴へ接続する場合は、親のUUIDまたは共有URLを入力してください。\n' +
    '空欄の場合は独立した実データとして保存します。',
    previousUuid
  );
  if (parentInput === null) return;
  parentInput = parentInput.trim();
  var parentUuid = '';
  if (parentInput) {
    try {
      parentUuid = new URL(parentInput).searchParams.get('id') || '';
    } catch (_) {
      parentUuid = parentInput;
    }
    parentUuid = parentUuid.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parentUuid)) {
      alert('親UUIDまたは共有URLの形式が正しくありません。');
      return;
    }
  }

  var now = new Date();
  var dateLabel = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
  result._recordType = 'actual';
  result._title = dateLabel + ' 実データ';
  if (parentUuid) result._parentUuid = parentUuid;

  function entryKey(e) {
    return e.id || (e.name + '::' + e.diff);
  }
  function resolveParentMappings(parentData) {
    if (!parentData || parentData._recordType === 'actual') return;
    var mappings = {};
    var usedActual = {};
    var rankNames = ['なし','I','II','III','IV','V','VI','VII','VIII','IX','EX'];
    for (var ci=0; ci<CATS.length; ci++) {
      var catName = CATS[ci].name;
      var parentEntries = parentData[catName] || [];
      var actualEntries = result[catName] || [];
      var parentKeys = {};
      for (var pi=0; pi<parentEntries.length; pi++) parentKeys[entryKey(parentEntries[pi])] = true;
      var unmatchedActual = actualEntries.filter(function(e) { return !parentKeys[entryKey(e)]; });
      var plannedNew = parentEntries.filter(function(e) {
        return e._sim === 'new' && !actualEntries.some(function(a) { return entryKey(a) === entryKey(e); });
      });
      for (var ni=0; ni<plannedNew.length; ni++) {
        var plan = plannedNew[ni];
        var candidates = unmatchedActual.filter(function(e) {
          return !usedActual[entryKey(e)];
        }).sort(function(a,b) {
          function score(e) {
            return (e.diff===plan.diff?0:10000) +
              (e.style===plan.style?0:3000) +
              Math.abs((e.level||0)-(plan.level||0))*300 +
              Math.abs((e.rankIdx||0)-(plan.rankIdx||0))*30 +
              Math.abs((e.fs||0)-(plan.fs||0));
          }
          return score(a)-score(b);
        }).slice(0,10);
        if (candidates.length === 0) continue;
        var lines = [
          '省略名の計画曲を実データへ対応付けます。',
          '',
          '計画: [' + catName + '] ' + plan.name +
            ' / ' + (plan.diff||'?') + ' / Lv' + (plan.level||'?') +
            ' / ' + (rankNames[plan.rankIdx]||'?'),
          '',
          '対応する実データの番号を入力してください。',
          '0: 対応なし（通常の新規実績として扱う）'
        ];
        for (var xi=0; xi<candidates.length; xi++) {
          var cand = candidates[xi];
          lines.push((xi+1) + ': ' + cand.name +
            ' / ' + (cand.diff||'?') + ' / Lv' + (cand.level||'?') +
            ' / ' + (rankNames[cand.rankIdx]||'?') + ' / FS ' + (cand.fs||0));
        }
        var answer = prompt(lines.join('\n'), '0');
        if (answer === null) throw new Error('対応付けをキャンセルしました');
        var choice = parseInt(answer,10);
        if (!isNaN(choice) && choice>=1 && choice<=candidates.length) {
          var selected = candidates[choice-1];
          mappings[entryKey(plan)] = entryKey(selected);
          usedActual[entryKey(selected)] = true;
        }
      }
    }
    if (Object.keys(mappings).length>0) result._parentMappings = mappings;
  }

  // ---- Save to Supabase (INSERT only, immutable records) ----
  var url = SUPABASE_URL + '/rest/v1/skill_data';
  var headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Prefer': 'return=representation',
  };

  // 入力された親が実在することを確認してから子を保存する。
  var verifyParent = parentUuid
    ? fetch(url + '?uuid=eq.' + encodeURIComponent(parentUuid) + '&select=uuid,data&limit=1', {
        headers: headers,
      }).then(function(r) {
        if (!r.ok) throw new Error('親データの確認に失敗しました');
        return r.json();
      }).then(function(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error('指定された親データが見つかりません');
        }
        return rows[0].data || {};
      })
    : Promise.resolve(null);

  verifyParent.then(function(parentData) {
    resolveParentMappings(parentData);
    return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({data: result}),
  }); }).then(function(r) {
    if (!r.ok) throw new Error('実データの保存に失敗しました');
    return r.json();
  })
  .then(function(d) {
    var uuid = Array.isArray(d) ? d[0].uuid : d.uuid;
    if (!uuid) { alert('UUID取得失敗'); return; }
    localStorage.setItem(LS_KEY, uuid);
    window.open(SIMULATOR_URL + '?id=' + uuid, '_blank');
  }).catch(function(e) { alert('処理失敗: ' + e.message); });
}());
