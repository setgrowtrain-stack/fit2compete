/**
 * Fit 2 Compete v2 — Google Apps Script backend
 * A Creatures of Healthy Habits program.
 *
 * No AI key. The app runs on fixed rules here (set logging, progression, InBody reminders and
 * comparisons, meal totals). Anything that needs judgment goes to the Requests tab, and Claude
 * answers it on a schedule (Nicholas's Claude plan) by writing back to the Sheet.
 *
 * Storage
 *   Sheet tabs: Users, Athletes, Sessions, Rules, Evidence, Log, Family (v1)
 *               Plans, SetLog, Progression, InBody, Meals, Supplements, Targets, Requests, CoachNotes (v2)
 *   Drive:      one JSON file per athlete (intake answers, plan text, check-offs) in "Fit 2 Compete Data/Athletes"
 * Screens: static page on GitHub Pages, calling doPost with {fn, args}.
 * Sign-in: 6-digit code emailed to the address; new addresses need an admin's Approve click.
 */

var APP_NAME = 'Fit 2 Compete';
var APP_URL = 'https://setgrowtrain-stack.github.io/fit2compete/';
var SESSION_DAYS = 90;
var CODE_MINUTES = 10;
var SCAN_DAYS = 28;            // InBody every 4 weeks
var VERSION = '2.6.1';

var TABS = {
  Users:       ['Email', 'Name', 'Role', 'Active', 'Added'],
  Athletes:    ['Id', 'Owner', 'Name', 'Step', 'Has plan', 'Updated', 'File Id'],
  Sessions:    ['Token hash', 'Email', 'Created', 'Expires'],
  Rules:       ['Section', 'Rule', 'Active', 'Updated'],
  Evidence:    ['Topic', 'NASM says', 'Current research', 'Strength', 'What the app does', 'Sources', 'Last checked', 'Status', 'Active'],
  Log:         ['When', 'Email', 'Action', 'Detail'],
  Family:      ['Parent email', 'Child email', 'Added'],
  Plans:       ['Athlete Id', 'Athlete', 'Plan version', 'Day', 'Order', 'Exercise', 'Sets', 'Rep range', 'Target RIR', 'Tempo', 'Rest', 'Increment', 'Equipment type', 'Notes', 'Active', 'Updated'],
  SetLog:      ['Id', 'Date', 'Athlete Id', 'Athlete', 'Day', 'Exercise', 'Set #', 'Weight', 'Reps', 'RIR', 'Tempo', 'Done', 'Source', 'Logged by', 'Logged at'],
  Progression: ['Athlete Id', 'Exercise', 'Current working weight', 'Next suggestion', 'Status', 'Reason', 'Sessions at top', 'Sessions below', 'Last session', 'Updated'],
  InBody:      ['Id', 'Athlete Id', 'Date', 'Weight', 'Body fat %', 'SMM', 'Lean mass', 'BMR', 'File link', 'Source', 'Confirmed', 'Notes', 'Scan type', 'Details'],
  Meals:       ['Athlete Id', 'Date', 'Type', 'Meal', 'Food', 'Calories', 'Protein g', 'Carbs g', 'Fat g', 'Source', 'Logged by', 'Logged at'],
  Supplements: ['Athlete Id', 'Name', 'Dose', 'Time', 'Category', 'With food', 'Status', 'Notes', 'Updated'],
  Targets:     ['Athlete Id', 'Phase', 'From', 'To', 'Calories', 'Protein g', 'Carbs g', 'Fat g', 'Bodyweight target', 'Set by', 'Why', 'Updated'],
  Requests:    ['Id', 'Athlete Id', 'Athlete', 'Type', 'Details', 'File link', 'Status', 'Created', 'Requested by', 'Answered', 'Answer'],
  CoachNotes:  ['Athlete Id', 'Athlete', 'Date', 'Type', 'Note', 'Request Id', 'By', 'Seen'],
  Wearables:   ['Athlete Id', 'Date', 'Source', 'Recovery %', 'HRV ms', 'Resting HR', 'Sleep hours', 'Sleep performance %', 'Deep min', 'REM min', 'Sleep debt min', 'Strain', 'Steps', 'Calories', 'SpO2 %', 'Skin temp C', 'Resp rate', 'Updated', 'Light min', 'Awake min', 'Sleep efficiency %', 'Sleep consistency %', 'Sleep need min', 'In bed min', 'Disturbances', 'Avg HR', 'Max HR', 'Kilojoules', 'Workouts', 'Workout min']
};

// Request types the server applies to the athlete record itself. "read" and "suppList" are applied by the screens.
var SERVER_TYPES = ['plan', 'revise', 'meals', 'coach', 'checkin', 'inbody', 'food'];
var REQUEST_TYPES = SERVER_TYPES.concat(['read', 'suppList', 'question']);

/* ---------------------------------------------------------------- web app */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.state && /^wh_/.test(p.state)) return whoopCallback_(p);
  var qs = p.access ? '?access=' + encodeURIComponent(p.access) + '&e=' + encodeURIComponent(p.e || '') + '&s=' + encodeURIComponent(p.s || '') : '';
  var url = APP_URL + qs;
  return HtmlService.createHtmlOutput('<p style="font-family:Arial,sans-serif">Fit 2 Compete has moved. <a href="' + url + '" target="_top">Open the app</a>.</p>' +
    '<script>window.top.location.href=' + JSON.stringify(url) + ';</script>').setTitle(APP_NAME);
}

var API = {
  accessDecision: accessDecision, requestCode: requestCode, verifyCode: verifyCode, whoami: whoami, signOut: signOut,
  listAthletes: listAthletes, saveAthlete: saveAthlete, deleteAthlete: deleteAthlete,
  uploadFile: uploadFile, getFile: getFile, removeUpload: removeUpload,
  submitRequest: submitRequest, cancelRequest: cancelRequest, markApplied: markApplied, getExtras: getExtras,
  syncSets: syncSets, syncMeals: syncMeals, saveWearables: saveWearables, whoopStatus: whoopStatus, whoopStart: whoopStart, whoopSync: whoopSync, whoopDisconnect: whoopDisconnect, saveInBody: saveInBody, markNotesSeen: markNotesSeen,
  listVideos: listVideos, version: function () { return VERSION; }
};

function doPost(e) {
  var out;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = API.hasOwnProperty(body.fn) ? API[body.fn] : null;
    if (!fn) throw err_('bad_request', 'Unknown request.');
    out = { ok: true, result: fn.apply(null, Array.isArray(body.args) ? body.args : []) };
  } catch (x) {
    var m = String(x && x.message || x);
    out = { ok: false, error: /^F2C:/.test(m) ? m : 'F2C:server_error:' + m };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ setup */

/** Run once from the editor after pasting v2. Safe to run again: it never deletes data. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SHEET_ID', ss.getId());
  Object.keys(TABS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = TABS[name];
    if (sh.getMaxColumns() < head.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length - sh.getMaxColumns());
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#141414').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  [['SetLog', 'Date'], ['Meals', 'Date'], ['InBody', 'Date'], ['CoachNotes', 'Date'], ['Targets', 'From'], ['Progression', 'Last session']].forEach(function (x) {
    var n = x[0], sh = ss.getSheetByName(n), col = TABS[n].indexOf(x[1]) + 1;
    sh.getRange(2, col, sh.getMaxRows() - 1, 1).setNumberFormat('@');   // keep dates as plain yyyy-mm-dd text
  });
  var root = folderByProp_('ROOT_FOLDER_ID', APP_NAME + ' Data', null);
  folderByProp_('ATHLETE_FOLDER_ID', 'Athletes', root);
  folderByProp_('UPLOAD_FOLDER_ID', 'Uploads', root);
  folderByProp_('REQUEST_FOLDER_ID', 'Requests', root);

  var owner = Session.getEffectiveUser().getEmail().toLowerCase();
  var users = ss.getSheetByName('Users');
  if (!findRow_(users, 1, owner)) users.appendRow([owner, 'Nicholas Ruffin', 'admin', true, new Date()]);

  var rules = ss.getSheetByName('Rules');
  if (rules.getLastRow() < 2 && typeof RULES_SEED_MD !== 'undefined') {
    var rows = parseRulesMd_(RULES_SEED_MD);
    if (rows.length) rules.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  // v1 had an Anthropic key. v2 never uses one: remove it and the sample-mode switch.
  ['ANTHROPIC_API_KEY', 'DEMO_MODE', 'MODEL_FAST', 'MODEL_MAIN', 'MODEL_TOP'].forEach(function (k) { props.deleteProperty(k); });

  // Daily InBody reminder emails (8 AM, script time zone). One trigger only.
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyReminders') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyReminders').timeBased().everyDays(1).atHour(8).create();

  log_(owner, 'setup', 'v' + VERSION + ' tabs, folders and reminder trigger ready; AI key removed');
  return 'Setup done (v' + VERSION + '). Next: run migrateV2.';
}

function folderByProp_(prop, name, parent) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(prop);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = parent ? parent.createFolder(name) : DriveApp.createFolder(name);
  props.setProperty(prop, f.getId());
  return f;
}

function parseRulesMd_(md) {
  var out = [], section = 'General', buf = [];
  function flush() { var t = buf.join('\n').trim(); if (t) out.push([section, t, true, new Date()]); buf = []; }
  md.split('\n').forEach(function (line) {
    if (/^## /.test(line)) { flush(); section = line.replace(/^## /, '').trim(); }
    else if (/^# /.test(line)) { }
    else if (/^\s*[-*] /.test(line)) { flush(); buf.push(line); }
    else if (line.trim() === '') { flush(); }
    else buf.push(line);
  });
  flush();
  return out.map(function (r) { r[1] = r[1].replace(/^\s*[-*] /, ''); return r; });
}

/* ------------------------------------------------------------------ sign-in */

function requestCode(email) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err_('bad_email', 'That email address doesn\'t look right.');
  var cache = CacheService.getScriptCache();
  if (cache.get('wait:' + email)) throw err_('wait', 'A code was just sent. Wait a minute before asking for another.');
  var user = getUser_(email);
  cache.put('wait:' + email, '1', 60);
  if (!user) {   // any email can ask; an admin approves it once
    log_(email, 'code_denied', 'Not approved yet');
    try { notifyAccessRequest_(email); } catch (x) { log_(email, 'alert_failed', String(x)); }
    return { sent: true, pending: true };
  }
  var code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('code:' + email, hash_(email + ':' + code), CODE_MINUTES * 60);
  cache.put('tries:' + email, '0', CODE_MINUTES * 60);
  MailApp.sendEmail({
    to: email, name: APP_NAME,
    subject: APP_NAME + ' sign-in code: ' + code,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><p>Your ' + APP_NAME + ' sign-in code is:</p>' +
      '<p style="font-size:28px;font-weight:bold;letter-spacing:4px">' + code + '</p>' +
      '<p>It works for ' + CODE_MINUTES + ' minutes. If you didn\'t ask for it, ignore this email.</p>' +
      '<p style="color:#777">' + APP_NAME + ' · A Creatures of Healthy Habits program</p></div>'
  });
  log_(email, 'code_sent', '');
  return { sent: true };
}

function verifyCode(email, code) {
  email = String(email || '').trim().toLowerCase();
  code = String(code || '').replace(/\D/g, '');
  var cache = CacheService.getScriptCache();
  var want = cache.get('code:' + email);
  var tries = Number(cache.get('tries:' + email) || 0);
  if (!want) throw err_('expired', 'That code expired. Ask for a new one.');
  if (tries >= 5) { cache.remove('code:' + email); throw err_('locked', 'Too many tries. Ask for a new code.'); }
  if (hash_(email + ':' + code) !== want) {
    cache.put('tries:' + email, String(tries + 1), CODE_MINUTES * 60);
    throw err_('bad_code', 'That code didn\'t match. Check the email and try again.');
  }
  cache.remove('code:' + email);
  var user = getUser_(email);
  if (!user) throw err_('denied', 'This email isn\'t set up yet.');
  var token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  var now = new Date();
  sheet_('Sessions').appendRow([hash_(token), email, now, new Date(now.getTime() + SESSION_DAYS * 864e5)]);
  log_(email, 'signed_in', '');
  return { token: token, user: user };
}

function whoami(token) { return auth_(token); }

function signOut(token) {
  var sh = sheet_('Sessions'), h = hash_(token), r = findRow_(sh, 1, h);
  if (r) sh.deleteRow(r);
  CacheService.getScriptCache().remove('sess:' + h);
  return true;
}

function auth_(token) {
  if (!token) throw err_('signed_out', 'Please sign in.');
  var h = hash_(token), cache = CacheService.getScriptCache();
  var hit = cache.get('sess:' + h);
  if (hit) return JSON.parse(hit);
  var sh = sheet_('Sessions'), r = findRow_(sh, 1, h);
  if (!r) throw err_('signed_out', 'Please sign in again.');
  var row = sh.getRange(r, 1, 1, 4).getValues()[0];
  if (new Date(row[3]).getTime() < Date.now()) { sh.deleteRow(r); throw err_('signed_out', 'Your sign-in expired. Please sign in again.'); }
  var user = getUser_(String(row[1]).toLowerCase());
  if (!user) throw err_('signed_out', 'This email is no longer active.');
  if (new Date(row[3]).getTime() - Date.now() < (SESSION_DAYS - 7) * 864e5) sh.getRange(r, 4).setValue(new Date(Date.now() + SESSION_DAYS * 864e5));
  cache.put('sess:' + h, JSON.stringify(user), 600);
  return user;
}

function getUser_(email) {
  var v = sheet_('Users').getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]).trim().toLowerCase() === email && v[i][3] !== false && String(v[i][3]).toUpperCase() !== 'FALSE') {
      return { email: email, name: String(v[i][1] || ''), role: String(v[i][2] || 'athlete').toLowerCase() === 'admin' ? 'admin' : 'athlete' };
    }
  }
  return null;
}

/* ---------------------------------------------------------------- athletes */

function childrenOf_(email) {
  var v = sheet_('Family').getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) if (String(v[i][0]).trim().toLowerCase() === email && v[i][1]) out.push(String(v[i][1]).trim().toLowerCase());
  return out;
}

/** The athlete's row, and whether this user may read or change it. */
function athlete_(u, id, write) {
  if (!/^[a-z0-9]+$/i.test(String(id || ''))) throw err_('bad_record', 'Unknown athlete.');
  var sh = sheet_('Athletes'), r = findRow_(sh, 1, id);
  if (!r) throw err_('bad_record', 'Unknown athlete.');
  var row = sh.getRange(r, 1, 1, 7).getValues()[0];
  var owner = String(row[1]).trim().toLowerCase();
  var mine = u.role === 'admin' || owner === u.email;
  if (!mine && (write || childrenOf_(u.email).indexOf(owner) < 0)) throw err_('denied', write ? 'You can\'t change this athlete.' : 'You can\'t see this athlete.');
  return { r: r, id: String(row[0]), owner: owner, name: String(row[2] || ''), fileId: String(row[6]) };
}

function readRec_(fileId) { return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString()); }

function writeRec_(at, rec) {
  var file = DriveApp.getFileById(at.fileId);
  rec.rev = Number(rec.rev || 0) + 1;
  file.setContent(JSON.stringify(rec));
  sheet_('Athletes').getRange(at.r, 3, 1, 4).setValues([[(rec.a && rec.a.name) || at.name, rec.step || 0, !!rec.plan, new Date(rec.updated || Date.now())]]);
  return rec;
}

function listAthletes(token) {
  var u = auth_(token);
  var kids = childrenOf_(u.email);
  var sh = sheet_('Athletes'), v = sh.getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    var owner = String(v[i][1]).trim().toLowerCase(), isKid = kids.indexOf(owner) >= 0;
    if (owner !== u.email && !isKid) continue;   // v2.6.1: admins see only their own profile and linked family, not every member
    try {
      var at = { r: i + 1, id: String(v[i][0]), owner: owner, name: String(v[i][2] || ''), fileId: String(v[i][6]) };
      var rec = applyAnswers_(at) || readRec_(at.fileId);
      rec.owner = v[i][1];
      if (isKid && owner !== u.email && u.role !== 'admin') rec.familyChild = true;
      out.push(rec);
    } catch (e) { log_(u.email, 'list_skip', v[i][0] + ': ' + e); }
  }
  u.family = kids;
  return { user: u, athletes: out, demo: false, v: VERSION };
}

function saveAthlete(token, rec) {
  var u = auth_(token);
  if (!rec || !rec.id || !/^[a-z0-9]+$/i.test(rec.id)) throw err_('bad_record', 'Nothing to save.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_('Athletes'), r = findRow_(sh, 1, rec.id), a = rec.a || {};
    if (r) {
      var row = sh.getRange(r, 1, 1, 7).getValues()[0];
      if (u.role !== 'admin' && String(row[1]).toLowerCase() !== u.email) throw err_('denied', 'You can\'t change this athlete.');
      var file = DriveApp.getFileById(row[6]);
      var current = {}; try { current = JSON.parse(file.getBlob().getDataAsString()); } catch (e) {}
      var curRev = Number(current.rev || 0), inRev = Number(rec.rev || 0);
      if (curRev && inRev !== curRev) { current.owner = row[1]; return { ok: false, conflict: true, latest: current }; }
      rec.rev = curRev + 1;
      file.setContent(JSON.stringify(rec));
      sh.getRange(r, 3, 1, 4).setValues([[a.name || '', rec.step || 0, !!rec.plan, new Date(rec.updated || Date.now())]]);
    } else {
      var folder = DriveApp.getFolderById(prop_('ATHLETE_FOLDER_ID'));
      rec.rev = 1;
      var f = folder.createFile(rec.id + '.json', JSON.stringify(rec), 'application/json');
      sh.appendRow([rec.id, u.email, a.name || '', rec.step || 0, !!rec.plan, new Date(rec.updated || Date.now()), f.getId()]);
    }
  } finally { lock.releaseLock(); }
  try { mirror_(rec); } catch (e) { log_(u.email, 'mirror_error', rec.id + ': ' + e); }
  return { ok: true, saved: Date.now(), rev: rec.rev };
}

function deleteAthlete(token, id) {
  var u = auth_(token), at = athlete_(u, id, true);
  try { DriveApp.getFileById(at.fileId).setTrashed(true); } catch (e) {}
  sheet_('Athletes').deleteRow(at.r);
  log_(u.email, 'athlete_removed', id);
  return true;
}

/* ------------------------------------------------------------------ files */

function uploadFile(token, athleteId, name, mime, b64) {
  var u = auth_(token);
  if (!/^[a-z0-9]+$/i.test(athleteId)) throw err_('bad_record', 'Unknown athlete.');
  var up = DriveApp.getFolderById(prop_('UPLOAD_FOLDER_ID'));
  var it = up.getFoldersByName(athleteId), folder = it.hasNext() ? it.next() : up.createFolder(athleteId);
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, String(name || 'upload').slice(0, 120)));
  file.setDescription('Uploaded by ' + u.email);
  return { id: file.getId() };
}

function appFile_(id) {
  var f = DriveApp.getFileById(id), up = prop_('UPLOAD_FOLDER_ID');
  var parent = f.getParents().hasNext() ? f.getParents().next() : null;
  var grand = parent && parent.getParents().hasNext() ? parent.getParents().next() : null;
  if (!grand || grand.getId() !== up) throw err_('denied', 'Not an app file.');
  return f;
}

function removeUpload(token, id) {
  var u = auth_(token), f = appFile_(id);
  f.setTrashed(true);
  log_(u.email, 'upload_removed', f.getName());
  return true;
}

function getFile(token, id) {
  auth_(token);
  var b = appFile_(id).getBlob();
  return { mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()), name: appFile_(id).getName() };
}

function listVideos(token) {
  auth_(token);
  try { return JSON.parse(prop_('VIDEOS') || '{}'); } catch (e) { return {}; }
}

/* --------------------------------------------------------------- requests */

/**
 * The screens queue anything that needs judgment. Claude's scheduled task answers it.
 * details: the full instructions for Claude (stored in Drive when it is too long for a cell).
 * meta: small JSON the screens need to apply the answer (for example which intake field a file belongs to).
 */
function submitRequest(token, athleteId, type, details, fileIds, meta) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  if (REQUEST_TYPES.indexOf(type) < 0) throw err_('bad_request', 'Unknown request type.');
  details = String(details || '');
  if (meta) details = 'META ' + JSON.stringify(meta) + '\n\n' + details;
  if (details.length > 40000) {
    var f = DriveApp.getFolderById(prop_('REQUEST_FOLDER_ID')).createFile('request-' + Date.now() + '.txt', details, 'text/plain');
    details = 'drive:' + f.getId();
  }
  var sh = sheet_('Requests');
  // One open request of a kind per athlete: a newer plan or meal request replaces the older one.
  if (['plan', 'revise', 'meals', 'checkin'].indexOf(type) >= 0) {
    var v = sh.getDataRange().getValues();
    for (var i = v.length - 1; i >= 1; i--) if (v[i][1] === at.id && v[i][3] === type && v[i][6] === 'new') sh.getRange(i + 1, 7).setValue('replaced');
  }
  var id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  var ids = (fileIds || []).filter(function (x) { return /^[\w-]{10,}$/.test(String(x)); }).slice(0, 30);
  sh.appendRow([id, at.id, at.name, type, details, ids.join(','), 'new', new Date(), u.email, '', '']);
  log_(u.email, 'request', type + ' ' + id + ' for ' + at.id);
  return { id: id, at: Date.now() };
}

function cancelRequest(token, reqId) {
  var u = auth_(token), sh = sheet_('Requests'), r = findRow_(sh, 1, reqId);
  if (!r) return false;
  var row = sh.getRange(r, 1, 1, 7).getValues()[0];
  athlete_(u, row[1], true);
  if (row[6] === 'new') sh.getRange(r, 7).setValue('cancelled');
  return true;
}

function markApplied(token, reqId) {
  var u = auth_(token), sh = sheet_('Requests'), r = findRow_(sh, 1, reqId);
  if (!r) return false;
  athlete_(u, sh.getRange(r, 2).getValue(), true);
  sh.getRange(r, 7).setValue('applied');
  return true;
}

function answerOf_(cell) {
  var s = String(cell || '').trim();
  if (/^drive:/.test(s)) s = DriveApp.getFileById(s.slice(6)).getBlob().getDataAsString();
  return extractJson_(s);
}

/** Applies Claude's answered plan, meal, coach and InBody requests to the athlete record. Returns the new record or null. */
function applyAnswers_(at) {
  var sh = sheet_('Requests'), v = sh.getDataRange().getValues(), todo = [];
  for (var i = 1; i < v.length; i++) if (v[i][1] === at.id && v[i][6] === 'answered' && SERVER_TYPES.indexOf(v[i][3]) >= 0) todo.push(i);
  if (!todo.length) return null;
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var rec = readRec_(at.fileId), changed = false, now = Date.now();
    todo.forEach(function (i) {
      var id = v[i][0], type = v[i][3], status = 'applied', meta = {};
      try { var d0 = String(v[i][4]); if (/^META /.test(d0)) meta = JSON.parse(d0.split('\n')[0].slice(5)) || {}; } catch (e) {}
      try {
        var ans = answerOf_(v[i][10]);
        if (!ans) throw new Error('answer is not JSON');
        if (type === 'plan' || type === 'revise') {
          var plan = ans.plan || ans;
          if (!plan.summary) throw new Error('plan has no summary');
          if (type === 'revise' && !(plan.days && plan.days.length) && rec.plan) plan.days = rec.plan.days;
          delete plan.meals;
          rec.plan = plan;
          if (type === 'plan') { rec.planDate = now; if (!rec.planStart) rec.planStart = mondayOf_(new Date()).getTime(); }
          if (ans.meals && ans.meals.days) rec.meals = ans.meals; else if (type === 'plan') rec.meals = null;
          rec.checks = null;
        } else if (type === 'meals') {
          if (!ans.days) throw new Error('meals has no days');
          rec.meals = ans;
        } else if (type === 'coach' || type === 'checkin') {
          var c = rec.coach = rec.coach || { msgs: [], summary: '', advice: [], checkins: [] };
          ['msgs', 'advice', 'checkins'].forEach(function (k) { if (!Array.isArray(c[k])) c[k] = []; });
          c.msgs.forEach(function (m) { if (m.req === id) delete m.pending; });
          var adv = (ans.advice || ans.adjust || []).filter(function (x) { return x && x.text; }).slice(0, 3)
            .map(function (x) { return { at: now, area: String(x.area || 'other'), text: String(x.text).slice(0, 300), src: type === 'checkin' ? 'check-in' : 'coach' }; });
          adv.forEach(function (x) { c.advice.push(x); });
          if (c.advice.length > 60) c.advice = c.advice.slice(-60);
          var text;
          if (type === 'coach') text = String(ans.reply || '').trim();
          else {
            c.checkins.push({ at: now, week: ans.week || null, summary: String(ans.summary || ''), wins: (ans.wins || []).slice(0, 3), stalls: (ans.stalls || []).slice(0, 3), adjust: adv });
            if (c.checkins.length > 26) c.checkins = c.checkins.slice(-26);
            text = 'Weekly check-in:\n' + [ans.summary].concat((ans.wins || []).length ? ['Going well: ' + ans.wins.join('; ')] : [], (ans.stalls || []).length ? ['Stalling: ' + ans.stalls.join('; ')] : []).join('\n');
          }
          if (!text) throw new Error('no reply');
          c.msgs.push({ r: 'c', t: text, at: now, adv: adv.map(function (x) { return x.text; }), req: id });
          if (c.msgs.length > 40) c.msgs = c.msgs.slice(-40);
          if (ans.summary && type === 'coach' && ans.conversationSummary) c.summary = String(ans.conversationSummary).slice(0, 1500);
        } else if (type === 'food') {
          // A meal the athlete typed or photographed: store the estimate on the item and in the Meals tab.
          var day = rec.daily && rec.daily[meta.dayKey], item = day && (day.food || []).filter(function (f) { return f.id === meta.itemId; })[0];
          var est = { calories: num_(ans.calories), protein_g: num_(ans.protein_g), carbs_g: num_(ans.carbs_g), fat_g: num_(ans.fat_g), desc: String(ans.desc || '').slice(0, 300), confidence: String(ans.confidence || '') };
          if (item) item.est = est;
          var ms = sheet_('Meals'), mv = ms.getDataRange().getValues();
          for (var q = mv.length - 1; q >= 1; q--) if (mv[q][0] === at.id && mv[q][9] === 'estimate:' + meta.itemId) ms.deleteRow(q + 1);
          ms.appendRow([at.id, String(meta.date || dateStr_(new Date())), 'eaten', String(meta.meal || 'Food').slice(0, 80), String(item ? item.text || est.desc : est.desc).slice(0, 300), est.calories, est.protein_g, est.carbs_g, est.fat_g, 'estimate:' + meta.itemId, v[i][8], new Date()]);
        } else if (type === 'inbody') {
          addInBody_(at.id, ans, 'claude', false, v[i][5]);
          status = 'applied';
        }
        changed = changed || type !== 'inbody';
      } catch (e) {
        status = 'error';
        log_('', 'apply_error', id + ' ' + type + ': ' + e);
      }
      sh.getRange(i + 1, 7).setValue(status);
    });
    if (!changed) return null;
    rec.updated = now;
    writeRec_(at, rec);
  } finally { lock.releaseLock(); }
  try { mirror_(rec); } catch (e) { log_('', 'mirror_error', at.id + ': ' + e); }
  return rec;
}

/**
 * Everything the screens show next to the record: progression suggestions, open and answered requests,
 * coach notes, InBody scans with comparisons, current targets and logged meals. Applies answers first.
 */
function getExtras(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, false);
  var mine = u.role === 'admin' || at.owner === u.email;
  var rec = mine ? applyAnswers_(at) : null;
  var reqs = [], v = sheet_('Requests').getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (v[i][1] !== at.id) continue;
    var st = v[i][6];
    if (['new', 'working', 'answered', 'error'].indexOf(st) < 0 && Date.now() - new Date(v[i][9] || v[i][7]).getTime() > 3 * 864e5) continue;
    var q = { id: v[i][0], type: v[i][3], status: st, created: new Date(v[i][7]).getTime(), answered: v[i][9] ? new Date(v[i][9]).getTime() : null };
    var d = String(v[i][4]);
    if (/^META /.test(d)) { try { q.meta = JSON.parse(d.split('\n')[0].slice(5)); } catch (e) {} }
    if (st === 'answered' && (q.type === 'read' || q.type === 'suppList')) q.answer = answerOf_(v[i][10]);
    if (st === 'answered' && q.type === 'question') q.answer = (q.meta && (q.meta.kind === 'suggest' || q.meta.kind === 'wear' || q.meta.kind === 'suppReview' || q.meta.kind === 'pain')) ? answerOf_(v[i][10]) : String(v[i][10]).slice(0, 4000);
    reqs.push(q);
  }
  return {
    rec: rec, requests: reqs, prog: progressionFor_(at.id), notes: notesFor_(at.id), body: bodyFor_(at.id),
    targets: targetsFor_(at.id), meals: mealsFor_(at.id, 7), wear: (function () { try { whoopAuto_(at.id); } catch (e) {} return wearFor_(at.id, 90); })(), whoop: (function () { var t = whoopTok_(at.id); return { ready: !!prop_('WHOOP_CLIENT_SECRET'), connected: !!(t && t.refresh), last: t && t.last || null }; })()
  };
}

function notesFor_(id) {
  var v = sheet_('CoachNotes').getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) if (v[i][0] === id) out.push({ row: i + 1, date: dateStr_(v[i][2]), type: String(v[i][3] || 'note'), note: String(v[i][4] || ''), by: String(v[i][6] || ''), seen: v[i][7] === true || String(v[i][7]).toUpperCase() === 'TRUE' });
  return out.slice(-20).reverse();
}

function markNotesSeen(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, true), sh = sheet_('CoachNotes'), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === at.id && !(v[i][7] === true || String(v[i][7]).toUpperCase() === 'TRUE')) sh.getRange(i + 1, 8).setValue(true);
  return true;
}

/* ------------------------------------------------------------ set logging */

/**
 * payload: { phase, sets: [{key, date, day, ex, reps (range), plannedSets, n, wt, reps_done, rir, t, done}], removed: [key] }
 * key is the screens' log key "w3|Mon|barbell-bench-press|2"; the SetLog Id is "<athleteId>|<key>".
 */
function syncSets(token, athleteId, payload) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  payload = payload || {};
  var sets = (payload.sets || []).slice(0, 200), removed = (payload.removed || []).slice(0, 200);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var touched = {};
  try {
    var sh = sheet_('SetLog'), n = sh.getLastRow();
    var ids = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    var idx = {}; ids.forEach(function (x, i) { idx[x] = i + 2; });
    var now = new Date(), add = [];
    sets.forEach(function (s) {
      if (!s || !s.key || !s.ex) return;
      var id = at.id + '|' + s.key;
      var row = [id, String(s.date || ''), at.id, at.name, String(s.day || ''), String(s.ex).slice(0, 120), Number(s.n) || 1,
        num_(s.wt), num_(s.reps), num_(s.rir), String(s.t || ''), !!s.done, 'app', u.email, now];
      if (idx[id]) sh.getRange(idx[id], 1, 1, row.length).setValues([row]); else add.push(row);
      touched[slug_(s.ex)] = { name: String(s.ex), reps: s.range || '', sets: s.plannedSets || '' };
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
    var info = {};
    removed.forEach(function (k) { if (k && typeof k === 'object') { info[k.key] = k; } });
    removed.map(function (k) { var key = typeof k === 'object' ? k.key : k; return { r: idx[at.id + '|' + key], i: info[key] || {} }; }).filter(function (x) { return x.r; })
      .sort(function (a, b) { return b.r - a.r; })
      .forEach(function (x) { var ex = sh.getRange(x.r, 6).getValue(), t = touched[slug_(ex)] = touched[slug_(ex)] || { name: ex, reps: '' }; if (!t.reps && x.i.range) t.reps = x.i.range; sh.deleteRow(x.r); });
  } finally { lock.releaseLock(); }
  var out = {};
  Object.keys(touched).forEach(function (k) { out[k] = updateProgression_(at.id, touched[k].name, touched[k], payload.phase || ''); });
  return { prog: out };
}

function num_(x) { if (x === '' || x == null) return ''; var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? '' : n; }

function slug_(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

/* --------------------------------------------------------- progression rules */

/** What kind of lift this is, the load step and the default target RIR. */
function classify_(name, age) {
  var n = String(name || '').toLowerCase();
  if (/warm.?up|cool.?down|foam|stretch|mobility|ankle rock|hip switch|90\/90|balance|copenhagen/.test(n)) return { type: 'skip', inc: 0, label: '' };
  if (/walk|jog|sprint|stride|row(ing|er)?\s*\d|\bzone\b|bike|cycle|treadmill|plank|carry|hang\b|skip|drill|cardio|swim/.test(n) && !/barbell row|dumbbell row|cable row|seated row|t-bar|pendlay|upright row|lateral walk/.test(n))
    return { type: 'skip', inc: 0, label: '' };
  var minor = Number(age) > 0 && Number(age) < 18;
  var lower = /squat|deadlift|\brdl\b|romanian|hip thrust|lunge|good morning|step.?up|split squat|glute bridge/.test(n);
  if (/leg press|hack squat/.test(n)) return { type: 'leg press', inc: 10, label: '+10 lb', rir: minor ? 3 : 2 };
  if (/dumbbell|\bdb\b|db\s/.test(n)) return { type: 'dumbbell', inc: 2.5, label: 'next dumbbell (+2.5 lb per hand)', rir: minor ? 2 : 1, perHand: true };
  if (/cable|machine|pulldown|pec deck|smith|selectorized|lever|leg curl|leg extension|calf raise machine|pushdown|face pull/.test(n)) return { type: 'cable/machine', inc: 5, label: 'one plate step (about +5 lb)', rir: minor ? 2 : 1 };
  if (/pull.?up|chin.?up|\bdip|push.?up|inverted row|nordic|back extension|hanging|bodyweight|sit.?up|crunch/.test(n) && !/weighted|barbell|dumbbell/.test(n)) return { type: 'bodyweight', inc: 5, label: 'add 5 lb (belt or vest)', rir: minor ? 2 : 1, bw: true };
  if (/barbell|\bbb\b|bench press|squat|deadlift|overhead press|military|\bohp\b|clean|ez.?bar|trap bar|hip thrust|\brdl\b|romanian|good morning|pendlay|t-bar/.test(n))
    return lower ? { type: 'barbell lower', inc: 10, label: '+10 lb', rir: minor ? 3 : 2 } : { type: 'barbell upper', inc: 5, label: '+5 lb', rir: minor ? 3 : 2 };
  return { type: 'other', inc: 5, label: '+5 lb', rir: minor ? 2 : 1 };
}

/** "8-10" -> [8,10]; "12" -> [12,12]; time or distance -> null */
function repRange_(s) {
  s = String(s || '').toLowerCase();
  if (/sec|\bs\b|min|yd|yard|meter|\bm\b|amrap|max/.test(s)) return null;
  var m = s.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  m = s.match(/(\d+)/);
  return m ? [Number(m[1]), Number(m[1])] : null;
}

function planRow_(id, name) {
  var v = sheet_('Plans').getDataRange().getValues(), k = slug_(name);
  for (var i = 1; i < v.length; i++) if (v[i][0] === id && slug_(v[i][5]) === k) return { reps: v[i][7], sets: v[i][6], rir: v[i][8], inc: v[i][11], type: v[i][12] };
  return null;
}

/**
 * Double progression. Sessions are the dates an exercise was logged.
 *  2 sessions in a row with every set at the top of the range at or above target RIR: suggest the next load.
 *  2 below the bottom of the range: hold. 3: drop 5 to 10%.
 *  Deload: same load, no increases. Contest prep or cut: keep loads, no increases.
 */
function computeProgression_(sets, range, tRir, cls, phase) {
  var byDate = {};
  sets.forEach(function (s) { if (s.reps === '' || s.reps == null) return; (byDate[s.date] = byDate[s.date] || []).push(s); });
  var dates = Object.keys(byDate).sort();
  if (!dates.length) return null;
  var sess = dates.map(function (d) {
    var ss = byDate[d], wts = ss.map(function (x) { return Number(x.wt) || 0; });
    return { date: d, sets: ss, wt: Math.max.apply(null, wts) };
  });
  var last = sess[sess.length - 1], cur = last.wt;
  var res = { cur: cur, next: cur, status: 'track', reason: '', top: 0, below: 0, last: last.date };
  if (!range || cls.type === 'skip') { res.reason = 'Logged. No rep range to progress on.'; return res; }
  var lo = range[0], hi = range[1];
  function isTop(s) {
    var work = s.sets.filter(function (x) { return (Number(x.wt) || 0) >= s.wt; });
    return work.every(function (x) { return Number(x.reps) >= hi && (x.rir === '' || x.rir == null || Number(x.rir) >= tRir); });
  }
  function isBelow(s) {
    var work = s.sets.filter(function (x) { return (Number(x.wt) || 0) >= s.wt; });
    return work.filter(function (x) { return Number(x.reps) < lo; }).length >= Math.ceil(work.length / 2);
  }
  for (var i = sess.length - 1; i >= 0 && sess[i].wt >= cur && isTop(sess[i]); i--) res.top++;
  for (var j = sess.length - 1; j >= 0 && sess[j].wt <= cur && isBelow(sess[j]); j--) res.below++;
  var step = cls.inc || 5, unit = cls.perHand ? ' lb each hand' : ' lb';
  var round = function (x) { var q = cls.perHand ? 2.5 : 5; return Math.max(0, Math.round(x / q) * q); };
  if (res.top >= 2) {
    res.status = 'increase'; res.next = cur + step;
    res.reason = 'Top of the range (' + hi + ' reps) on every set, 2 sessions in a row. Next time: ' + (cls.bw && !cur ? 'add 5 lb with a belt or vest' : res.next + unit + (cls.type === 'cable/machine' ? ' (one plate step)' : '')) + '.';
  } else if (res.below >= 3) {
    res.status = 'drop'; res.next = round(cur * 0.925);
    res.reason = 'Below ' + lo + ' reps for 3 sessions. Drop to about ' + res.next + unit + ' (5 to 10% less) and build back up.';
  } else if (res.below >= 2) {
    res.status = 'hold'; res.reason = 'Below ' + lo + ' reps 2 sessions in a row. Stay at ' + cur + unit + ' and own the range.';
  } else {
    res.status = 'build'; var need = 2 - res.top;
    res.reason = 'Stay at ' + (cur || 'bodyweight') + (cur ? unit : '') + '. Reach ' + hi + ' reps on every set' + (tRir ? ' with ' + tRir + '+ in reserve' : '') + (need === 1 ? ' one more session' : ' for 2 sessions') + ' to move up.';
  }
  if (/deload|peak/i.test(phase)) { res.status = 'deload'; res.next = cur; res.reason = 'Deload week: half the sets, same load, no increases.'; }
  else if (/prep|cut/i.test(phase) && res.status === 'increase') { res.status = 'keep'; res.next = cur; res.reason = 'Contest prep: keep the load, cut sets, no increases this phase.'; }
  return res;
}

function updateProgression_(athId, name, info, phase) {
  var plan = planRow_(athId, name) || {};
  var range = repRange_(plan.reps || (info && info.reps));
  var cls = classify_(name);
  if (plan.inc !== '' && plan.inc != null && !isNaN(Number(plan.inc))) cls.inc = Number(plan.inc);
  var tRir = plan.rir !== '' && plan.rir != null && !isNaN(Number(plan.rir)) ? Number(plan.rir) : (cls.rir || 1);
  var k = slug_(name), sets = [];
  var v = sheet_('SetLog').getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][2] === athId && slug_(v[i][5]) === k) sets.push({ date: dateStr_(v[i][1]), wt: v[i][7], reps: v[i][8], rir: v[i][9] });
  var res = computeProgression_(sets, range, tRir, cls, phase);
  var sh = sheet_('Progression'), pv = sh.getDataRange().getValues(), r = 0;
  for (var j = 1; j < pv.length; j++) if (pv[j][0] === athId && slug_(pv[j][1]) === k) { r = j + 1; break; }
  if (!res) { if (r) sh.deleteRow(r); return null; }
  var row = [athId, name, res.cur, res.next, res.status, res.reason, res.top, res.below, res.last, new Date()];
  if (r) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  return { cur: res.cur, next: res.next, status: res.status, reason: res.reason };
}

function progressionFor_(id) {
  var v = sheet_('Progression').getDataRange().getValues(), out = {};
  for (var i = 1; i < v.length; i++) if (v[i][0] === id) out[slug_(v[i][1])] = { cur: v[i][2], next: v[i][3], status: v[i][4], reason: v[i][5] };
  return out;
}

/* --------------------------------------------------------------- InBody */

/** Adds the Scan type and Details columns to an older InBody tab. */
function inBodyCols_() {
  var sh = sheet_('InBody'), head = TABS.InBody;
  if (sh.getMaxColumns() < head.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length - sh.getMaxColumns());
  if (sh.getRange(1, head.length).getValue() !== head[head.length - 1]) sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#141414').setFontColor('#ffffff');
  return sh;
}

/** Everything else read off the scan: device, every printed section and value, segment values, past results printed on the sheet. */
function scanDetails_(x) {
  var d = {};
  if (x.device) d.device = String(x.device).slice(0, 80);
  if (Array.isArray(x.sections)) d.sections = x.sections.slice(0, 30).map(function (sec) {
    return { title: String(sec.title || '').slice(0, 80), items: (sec.items || []).slice(0, 60).map(function (it) {
      var o = { label: String(it.label || '').slice(0, 80), value: typeof it.value === 'number' ? it.value : String(it.value == null ? '' : it.value).slice(0, 60) };
      if (it.key) o.key = String(it.key).slice(0, 40);
      if (it.unit) o.unit = String(it.unit).slice(0, 16);
      if (it.range) o.range = String(it.range).slice(0, 40);
      return o;
    }) };
  });
  if (x.segments && typeof x.segments === 'object') d.segments = x.segments;
  if (Array.isArray(x.history)) d.history = x.history.slice(0, 20).map(function (h) { return { date: String(h.date || '').slice(0, 10), weight: num_(h.weight), smm: num_(h.smm), bf: num_(h.bf) }; }).filter(function (h) { return /^\d{4}-\d\d-\d\d$/.test(h.date); });
  var t = JSON.stringify(d);
  return t === '{}' ? '' : t.slice(0, 45000);
}

function addInBody_(athId, x, source, confirmed, fileLink) {
  var id = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  inBodyCols_().appendRow([id, athId, String(x.date || dateStr_(new Date())).slice(0, 10), num_(x.weight), num_(x.bf), num_(x.smm), num_(x.lean), num_(x.bmr),
    String(x.file || fileLink || ''), source, !!confirmed, String(x.notes || '').slice(0, 500), String(x.type || (source === 'typed' ? '' : 'inbody')).slice(0, 20), scanDetails_(x)]);
  return id;
}

/** When a scan is confirmed, adds the earlier results printed on its sheet that aren't on file yet. */
function addHistory_(athId, details) {
  var d = {}; try { d = JSON.parse(details || '{}'); } catch (e) {}
  if (!d.history || !d.history.length) return 0;
  var v = sheet_('InBody').getDataRange().getValues(), have = {}, n = 0;
  for (var i = 1; i < v.length; i++) if (v[i][1] === athId) have[dateStr_(v[i][2])] = 1;
  d.history.forEach(function (h) {
    if (have[h.date] || h.weight === '') return;
    have[h.date] = 1; n++;
    addInBody_(athId, { date: h.date, weight: h.weight, smm: h.smm, bf: h.bf, type: 'history', notes: 'From the history printed on a later scan sheet.' }, 'history', true);
  });
  return n;
}

/** x: {id?, date, weight, bf, smm, lean, bmr, file, notes}. With an id it confirms or corrects that row. */
function saveInBody(token, athleteId, x) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  x = x || {};
  if (x.id) {
    var sh = sheet_('InBody'), r = findRow_(sh, 1, x.id);
    if (!r || sh.getRange(r, 2).getValue() !== at.id) throw err_('bad_record', 'Scan not found.');
    if (x.remove) { sh.deleteRow(r); return { body: bodyFor_(at.id) }; }
    sh.getRange(r, 3, 1, 6).setValues([[String(x.date).slice(0, 10), num_(x.weight), num_(x.bf), num_(x.smm), num_(x.lean), num_(x.bmr)]]);
    sh.getRange(r, 11).setValue(true);
    addHistory_(at.id, sh.getRange(r, 14).getValue());
  } else {
    if (!x.date || x.weight === '' || x.weight == null) throw err_('bad_request', 'Add at least the date and weight.');
    addInBody_(at.id, x, 'typed', true);
  }
  log_(u.email, 'inbody', at.id);
  return { body: bodyFor_(at.id) };
}

var MUSCLES = [
  ['Quads', /squat|leg press|lunge|leg extension|step.?up|split|hack/], ['Hamstrings', /\brdl\b|romanian|leg curl|deadlift|good morning|nordic|hamstring/],
  ['Glutes', /hip thrust|glute|bridge|kickback/], ['Chest', /bench|chest|fly|flye|push.?up|pec|\bdip/], ['Back', /row|pulldown|pull.?up|chin|lat\b|pullover|shrug/],
  ['Shoulders', /overhead|shoulder|lateral|raise|face pull|rear delt|military|arnold|\bohp\b/], ['Biceps', /curl/], ['Triceps', /tricep|pushdown|skull|close.?grip|extension(?!.*leg)/],
  ['Calves', /calf/], ['Core', /plank|crunch|sit.?up|ab\b|abs|pallof|leg raise|core/]
];
function muscleOf_(name) {
  var n = String(name || '').toLowerCase();
  if (/leg curl/.test(n)) return 'Hamstrings';
  for (var i = 0; i < MUSCLES.length; i++) if (MUSCLES[i][1].test(n)) return MUSCLES[i][0];
  return 'Other';
}

/** Scans, whether one is due, and what changed between the last two confirmed scans next to food and training for the same weeks. */
function bodyFor_(id) {
  var v = sheet_('InBody').getDataRange().getValues(), scans = [];
  for (var i = 1; i < v.length; i++) if (v[i][1] === id) scans.push({ id: v[i][0], date: dateStr_(v[i][2]), weight: v[i][3], bf: v[i][4], smm: v[i][5], lean: v[i][6], bmr: v[i][7], file: v[i][8], source: v[i][9], confirmed: v[i][10] === true || String(v[i][10]).toUpperCase() === 'TRUE', notes: v[i][11], type: v[i][12] || '', details: parseJ_(v[i][13]) });
  scans.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var ok = scans.filter(function (s) { return s.confirmed; });
  var last = ok[ok.length - 1], days = last ? Math.floor((Date.now() - new Date(last.date + 'T12:00:00').getTime()) / 864e5) : null;
  var out = { scans: scans, lastDate: last ? last.date : null, daysSince: days, due: !last || days >= SCAN_DAYS, cmp: null };
  if (ok.length >= 2) {
    var a = ok[ok.length - 2], b = last, d = function (k) { return a[k] === '' || b[k] === '' || a[k] == null || b[k] == null ? null : Math.round(10 * (Number(b[k]) - Number(a[k]))) / 10; };
    var cmp = { from: a.date, to: b.date, weeks: Math.max(1, Math.round((new Date(b.date) - new Date(a.date)) / 6048e5)),
      change: { weight: d('weight'), bf: d('bf'), smm: d('smm'), lean: d('lean') } };
    // food in the window
    var mv = sheet_('Meals').getDataRange().getValues(), byDay = {};
    for (var j = 1; j < mv.length; j++) {
      var ds = dateStr_(mv[j][1]);
      if (mv[j][0] !== id || ds < a.date || ds > b.date || mv[j][2] !== 'eaten') continue;
      byDay[ds] = byDay[ds] || { cal: 0, p: 0 }; byDay[ds].cal += Number(mv[j][5]) || 0; byDay[ds].p += Number(mv[j][6]) || 0;
    }
    var dl = Object.keys(byDay);
    cmp.food = dl.length ? { days: dl.length, cal: Math.round(dl.reduce(function (s, k) { return s + byDay[k].cal; }, 0) / dl.length), protein: Math.round(dl.reduce(function (s, k) { return s + byDay[k].p; }, 0) / dl.length) } : null;
    // training in the window
    var sv = sheet_('SetLog').getDataRange().getValues(), mus = {}, lifts = {};
    for (var k = 1; k < sv.length; k++) {
      var sd = dateStr_(sv[k][1]);
      if (sv[k][2] !== id || sd < a.date || sd > b.date || sv[k][8] === '' || Number(sv[k][8]) <= 0) continue;
      if (classify_(sv[k][5]).type === 'skip') continue;
      var m = muscleOf_(sv[k][5]); mus[m] = (mus[m] || 0) + 1;
      var e1 = (Number(sv[k][7]) || 0) * (1 + Number(sv[k][8]) / 30), L = lifts[sv[k][5]] = lifts[sv[k][5]] || { n: 0, first: null, last: null };
      L.n++;
      if (!L.first || sd < L.first.d || (sd === L.first.d && e1 > L.first.e)) L.first = { d: sd, e: e1 };
      if (!L.last || sd > L.last.d || (sd === L.last.d && e1 > L.last.e)) L.last = { d: sd, e: e1 };
    }
    cmp.setsPerWeek = Object.keys(mus).map(function (m) { return { muscle: m, sets: Math.round(10 * mus[m] / cmp.weeks) / 10 }; }).sort(function (x, y) { return y.sets - x.sets; });
    cmp.strength = Object.keys(lifts).filter(function (n) { return lifts[n].first.d !== lifts[n].last.d && lifts[n].first.e > 0; })
      .sort(function (x, y) { return lifts[y].n - lifts[x].n; }).slice(0, 5)
      .map(function (n) { return { lift: n, from: Math.round(lifts[n].first.e), to: Math.round(lifts[n].last.e), pct: Math.round(100 * (lifts[n].last.e - lifts[n].first.e) / lifts[n].first.e) }; });
    out.cmp = cmp;
  }
  return out;
}

/* ---------------------------------------------------------------- meals */

/** Replaces the logged ("eaten") meals for one date. rows: [{meal, food, cal, p, c, f}] */
function syncMeals(token, athleteId, date, rows, removeEst) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  date = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw err_('bad_request', 'Bad date.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_('Meals'), v = sh.getDataRange().getValues();
    var gone = (removeEst || []).map(function (x) { return 'estimate:' + x; });
    for (var i = v.length - 1; i >= 1; i--) if (v[i][0] === at.id && ((dateStr_(v[i][1]) === date && v[i][2] === 'eaten' && v[i][9] === 'app') || gone.indexOf(v[i][9]) >= 0)) sh.deleteRow(i + 1);
    var now = new Date(), add = (rows || []).slice(0, 20).map(function (x) {
      return [at.id, date, 'eaten', String(x.meal || '').slice(0, 80), String(x.food || '').slice(0, 300), num_(x.cal), num_(x.p), num_(x.c), num_(x.f), 'app', u.email, now];
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
  } finally { lock.releaseLock(); }
  return { meals: mealsFor_(at.id, 7), targets: targetsFor_(at.id) };
}

/* ---------- wearable data (uploaded exports, screenshots read by the coach, or a live connection) ---------- */
var WEAR_KEYS = ['rec', 'hrv', 'rhr', 'sleep', 'perf', 'deep', 'rem', 'debt', 'strain', 'steps', 'cal', 'spo2', 'temp', 'resp'];
/* Added in 2.6: stored after the Updated column so older rows keep their layout. */
var WEAR_X = ['light', 'awake', 'eff', 'cons', 'need', 'bed', 'dist', 'hravg', 'hrmax', 'kj', 'wkn', 'wkmin'];
function wearSheet_() {
  if (!SS_) sheet_('Users');
  var sh = SS_.getSheetByName('Wearables');
  if (!sh) { sh = SS_.insertSheet('Wearables'); sh.getRange(1, 1, 1, TABS.Wearables.length).setValues([TABS.Wearables]).setFontWeight('bold').setBackground('#141414').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < TABS.Wearables.length) sh.getRange(1, 1, 1, TABS.Wearables.length).setValues([TABS.Wearables]).setFontWeight('bold').setBackground('#141414').setFontColor('#ffffff');
  return sh;
}
/** Adds or replaces one row per date and source. rows: [{date, rec, hrv, rhr, sleep, perf, deep, rem, debt, strain, steps, cal, spo2, temp, resp}] */
function saveWearables(token, athleteId, rows, source) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  source = String(source || 'upload').toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 20) || 'upload';
  var n = saveWearRows_(at.id, (rows || []).slice(0, 800), source);
  return { wear: wearFor_(at.id, 90), saved: n };
}
function saveWearRows_(athId, rows, source) {
  var clean = {};
  rows.forEach(function (x) {
    var d = String(x.date || '').slice(0, 10); if (!/^\d{4}-\d\d-\d\d$/.test(d)) return;
    var r = clean[d] = clean[d] || { date: d };
    WEAR_KEYS.concat(WEAR_X).forEach(function (k) { var n = Number(x[k]); if (x[k] !== '' && x[k] != null && isFinite(n)) r[k] = Math.round(n * 100) / 100; });
  });
  var dates = Object.keys(clean); if (!dates.length) return 0;
  var at = { id: athId };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = wearSheet_(), v = sh.getDataRange().getValues(), now = new Date();
    for (var i = v.length - 1; i >= 1; i--) if (v[i][0] === at.id && String(v[i][2]) === source && clean[dateStr_(v[i][1])]) sh.deleteRow(i + 1);
    var add = dates.sort().map(function (d) { var r = clean[d]; return [at.id, d, source].concat(WEAR_KEYS.map(function (k) { return r[k] == null ? '' : r[k]; })).concat([now]).concat(WEAR_X.map(function (k) { return r[k] == null ? '' : r[k]; })); });
    sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
  } finally { lock.releaseLock(); }
  return dates.length;
}
/* ---------- WHOOP live connection (OAuth 2, read only). Client secret lives only in Script Properties as WHOOP_CLIENT_SECRET. ---------- */
var WHOOP_CLIENT_ID = 'a05d8094-2a52-4982-8c54-d676d259e7bf';
var WHOOP_SCOPES = 'offline read:recovery read:cycles read:sleep read:workout read:body_measurement';
function whoopRedirect_() { return ScriptApp.getService().getUrl(); }
function whoopTok_(id) { var t = prop_('WHOOP_TOK_' + id); try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function whoopStatus(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, false), t = whoopTok_(at.id);
  return { ready: !!prop_('WHOOP_CLIENT_SECRET'), connected: !!(t && t.refresh), last: t && t.last || null, err: t && t.err || null };
}
function whoopStart(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  if (!prop_('WHOOP_CLIENT_SECRET')) throw err_('not_setup', 'WHOOP isn\'t set up yet.');
  var state = 'wh_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  CacheService.getScriptCache().put(state, JSON.stringify({ id: at.id, email: u.email }), 900);
  return { url: 'https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=' + WHOOP_CLIENT_ID + '&redirect_uri=' + encodeURIComponent(whoopRedirect_()) +
    '&scope=' + encodeURIComponent(WHOOP_SCOPES) + '&state=' + state };
}
function whoopToken_(params) {
  params.client_id = WHOOP_CLIENT_ID; params.client_secret = prop_('WHOOP_CLIENT_SECRET');
  var r = UrlFetchApp.fetch('https://api.prod.whoop.com/oauth/oauth2/token', { method: 'post', payload: params, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('WHOOP token ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}
function whoopSave_(id, j, old) {
  var t = { access: j.access_token, refresh: j.refresh_token || (old && old.refresh), exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 - 60000, last: old && old.last || null };
  PropertiesService.getScriptProperties().setProperty('WHOOP_TOK_' + id, JSON.stringify(t)); return t;
}
function whoopCallback_(p) {
  var page = function (msg) { return HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;padding:24px;font-size:18px">' + msg + '<p><a href="' + APP_URL + '" target="_top">Back to Fit 2 Compete</a></p></div>').setTitle(APP_NAME); };
  var c = CacheService.getScriptCache(), s = c.get(p.state);
  if (!s) return page('That link expired. Open Fit 2 Compete and tap Connect WHOOP again.');
  c.remove(p.state); s = JSON.parse(s);
  if (p.error || !p.code) return page('WHOOP wasn\'t connected (' + String(p.error || 'no code').replace(/[<>]/g, '') + ').');
  try {
    whoopSave_(s.id, whoopToken_({ grant_type: 'authorization_code', code: p.code, redirect_uri: whoopRedirect_() }), null);
    var n = whoopPull_(s.id, 60);
    return page('WHOOP is connected. ' + n + ' days of recovery, sleep, strain and steps were added.');
  } catch (e) { return page('WHOOP connection failed: ' + String(e.message || e).replace(/[<>]/g, '').slice(0, 200)); }
}
function whoopAccess_(id) {
  var t = whoopTok_(id); if (!t || !t.refresh) return null;
  if (!t.access || Date.now() > t.exp) t = whoopSave_(id, whoopToken_({ grant_type: 'refresh_token', refresh_token: t.refresh, scope: 'offline' }), t);
  return t.access;
}
function whoopGet_(access, path, startIso) {
  var out = [], next = '', guard = 0;
  do {
    var r = UrlFetchApp.fetch('https://api.prod.whoop.com/developer' + path + '?limit=25&start=' + encodeURIComponent(startIso) + (next ? '&nextToken=' + encodeURIComponent(next) : ''), { headers: { Authorization: 'Bearer ' + access }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) throw new Error('WHOOP ' + path + ' ' + r.getResponseCode());
    var j = JSON.parse(r.getContentText()); out = out.concat(j.records || []); next = j.next_token || '';
  } while (next && ++guard < 20);
  return out;
}
/** Pull the last N days from WHOOP into the Wearables tab (source "whoop api"). Days are the local date you woke up. */
function whoopPull_(id, days) {
  var access = whoopAccess_(id); if (!access) return 0;
  var tz = Session.getScriptTimeZone(), start = new Date(Date.now() - days * 864e5).toISOString(), by = {};
  var day = function (iso) { return Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd'); };
  var cycles = whoopGet_(access, '/v2/cycle', start), cyDay = {};
  cycles.forEach(function (c) { var d = day(c.end || new Date().toISOString()); cyDay[c.id] = d; var r = by[d] = by[d] || { date: d };
    if (c.score) { if (c.score.strain != null) r.strain = c.score.strain; if (c.score.kilojoule != null) { r.cal = Math.round(c.score.kilojoule / 4.184); r.kj = Math.round(c.score.kilojoule); }
      if (c.score.average_heart_rate != null) r.hravg = c.score.average_heart_rate; if (c.score.max_heart_rate != null) r.hrmax = c.score.max_heart_rate; }
    if (c.step_count != null) r.steps = c.step_count; });
  whoopGet_(access, '/v2/recovery', start).forEach(function (x) { if (!x.score) return; var d = cyDay[x.cycle_id] || day(x.created_at); var r = by[d] = by[d] || { date: d };
    r.rec = x.score.recovery_score; r.rhr = x.score.resting_heart_rate; r.hrv = x.score.hrv_rmssd_milli; if (x.score.spo2_percentage != null) r.spo2 = x.score.spo2_percentage; if (x.score.skin_temp_celsius != null) r.temp = x.score.skin_temp_celsius; });
  whoopGet_(access, '/v2/activity/sleep', start).forEach(function (x) { if (x.nap || !x.score || !x.score.stage_summary) return; var d = day(x.end); var r = by[d] = by[d] || { date: d }, st = x.score.stage_summary;
    var asleep = (st.total_in_bed_time_milli || 0) - (st.total_awake_time_milli || 0) - (st.total_no_data_time_milli || 0);
    r.sleep = Math.round(asleep / 36e3) / 100; r.deep = Math.round((st.total_slow_wave_sleep_time_milli || 0) / 6e4); r.rem = Math.round((st.total_rem_sleep_time_milli || 0) / 6e4);
    if (x.score.sleep_performance_percentage != null) r.perf = x.score.sleep_performance_percentage; if (x.score.respiratory_rate != null) r.resp = x.score.respiratory_rate;
    if (x.score.sleep_needed && x.score.sleep_needed.need_from_sleep_debt_milli != null) r.debt = Math.round(x.score.sleep_needed.need_from_sleep_debt_milli / 6e4);
    r.light = Math.round((st.total_light_sleep_time_milli || 0) / 6e4); r.awake = Math.round((st.total_awake_time_milli || 0) / 6e4); r.bed = Math.round((st.total_in_bed_time_milli || 0) / 6e4);
    if (st.disturbance_count != null) r.dist = st.disturbance_count;
    if (x.score.sleep_efficiency_percentage != null) r.eff = x.score.sleep_efficiency_percentage; if (x.score.sleep_consistency_percentage != null) r.cons = x.score.sleep_consistency_percentage;
    var sn = x.score.sleep_needed; if (sn && sn.baseline_milli != null) r.need = Math.round(((sn.baseline_milli || 0) + (sn.need_from_sleep_debt_milli || 0) + (sn.need_from_recent_strain_milli || 0) - (sn.need_from_recent_nap_milli || 0)) / 6e4); });
  try { whoopGet_(access, '/v2/activity/workout', start).forEach(function (x) { if (!x.start || !x.end) return; var d = day(x.end); var r = by[d] = by[d] || { date: d };
    r.wkn = (r.wkn || 0) + 1; r.wkmin = (r.wkmin || 0) + Math.round((new Date(x.end) - new Date(x.start)) / 6e4); }); } catch (e) {}
  var rows = Object.keys(by).map(function (k) { return by[k]; });
  if (rows.length) saveWearRows_(id, rows, 'whoop api');
  try { var bm = UrlFetchApp.fetch('https://api.prod.whoop.com/developer/v2/user/measurement/body', { headers: { Authorization: 'Bearer ' + access }, muteHttpExceptions: true });
    if (bm.getResponseCode() === 200) PropertiesService.getScriptProperties().setProperty('WHOOP_BODY_' + id, bm.getContentText().slice(0, 500)); } catch (e) {}
  var t = whoopTok_(id); t.last = Date.now(); delete t.err; PropertiesService.getScriptProperties().setProperty('WHOOP_TOK_' + id, JSON.stringify(t));
  return rows.length;
}
function whoopSync(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  try { var n = whoopPull_(at.id, 14); return { saved: n, wear: wearFor_(at.id, 90) }; }
  catch (e) { var t = whoopTok_(at.id); if (t) { t.err = String(e.message || e).slice(0, 200); PropertiesService.getScriptProperties().setProperty('WHOOP_TOK_' + at.id, JSON.stringify(t)); } throw err_('whoop', 'WHOOP sync failed. Try again, or reconnect.'); }
}
function whoopDisconnect(token, athleteId) {
  var u = auth_(token), at = athlete_(u, athleteId, true);
  PropertiesService.getScriptProperties().deleteProperty('WHOOP_TOK_' + at.id); return { connected: false };
}
/** Called daily and when the app loads: refresh anyone connected whose last pull is over 4 hours old. */
function whoopAuto_(id) { var t = whoopTok_(id); if (!t || !t.refresh) return;
  if (!t.v26) { try { whoopPull_(id, 60); t = whoopTok_(id); t.v26 = 1; PropertiesService.getScriptProperties().setProperty('WHOOP_TOK_' + id, JSON.stringify(t)); } catch (e) {} return; }
  if (t.last && Date.now() - t.last < 4 * 36e5) return; try { whoopPull_(id, 4); } catch (e) {} }
function whoopSyncAll() { var v = sheet_('Athletes').getDataRange().getValues(); for (var i = 1; i < v.length; i++) whoopAuto_(v[i][0]); }

function wearFor_(id, days) {
  if (!SS_) sheet_('Users');
  var sh = SS_.getSheetByName('Wearables'); if (!sh) return [];
  var from = dateStr_(new Date(Date.now() - days * 864e5)), v = sh.getDataRange().getValues(), by = {};
  for (var i = 1; i < v.length; i++) {
    var d = dateStr_(v[i][1]); if (v[i][0] !== id || d < from) continue;
    var r = by[d] = by[d] || { date: d, src: [] }; r.src.push(String(v[i][2]));
    WEAR_KEYS.forEach(function (k, j) { var x = v[i][3 + j]; if (x !== '' && x != null && r[k] == null) r[k] = Number(x); });
    WEAR_X.forEach(function (k, j) { var x = v[i][4 + WEAR_KEYS.length + j]; if (x !== '' && x != null && x !== undefined && r[k] == null) r[k] = Number(x); });
  }
  return Object.keys(by).sort().map(function (k) { return by[k]; });
}

function mealsFor_(id, days) {
  var from = dateStr_(new Date(Date.now() - days * 864e5)), v = sheet_('Meals').getDataRange().getValues(), by = {};
  for (var i = 1; i < v.length; i++) {
    var d = dateStr_(v[i][1]);
    if (v[i][0] !== id || v[i][2] !== 'eaten' || d < from) continue;
    var t = by[d] = by[d] || { date: d, cal: 0, p: 0, c: 0, f: 0, n: 0 };
    t.cal += Number(v[i][5]) || 0; t.p += Number(v[i][6]) || 0; t.c += Number(v[i][7]) || 0; t.f += Number(v[i][8]) || 0; t.n++;
  }
  return Object.keys(by).sort().map(function (k) { return by[k]; });
}

function targetsFor_(id) {
  var v = sheet_('Targets').getDataRange().getValues(), last = null;
  for (var i = 1; i < v.length; i++) if (v[i][0] === id) last = { phase: v[i][1], from: dateStr_(v[i][2]), to: dateStr_(v[i][3]), cal: v[i][4], p: v[i][5], c: v[i][6], f: v[i][7], bw: v[i][8], by: v[i][9], why: v[i][10] };
  return last;
}

/* ------------------------------------------------- mirrors into the Sheet */

/** Keeps the Plans, Supplements and Targets tabs in step with the athlete record. Cheap when nothing changed. */
function mirror_(rec) {
  if (!rec || !rec.id) return;
  var props = PropertiesService.getScriptProperties(), a = rec.a || {}, name = a.name || '';
  var p = rec.plan || {};
  var hp = hash_(JSON.stringify(p.days || []) + '|' + (a.age || ''));
  if (props.getProperty('MP_' + rec.id) !== hp) { mirrorPlans_(rec.id, name, p, rec.planDate, a.age); props.setProperty('MP_' + rec.id, hp); }
  var hs = hash_(JSON.stringify(a.suppItems || []));
  if (props.getProperty('MS_' + rec.id) !== hs) { mirrorSupps_(rec.id, a.suppItems || []); props.setProperty('MS_' + rec.id, hs); }
  var ht = hash_(JSON.stringify(p.nutrition || {}) + '|' + (a.targetWeight || ''));
  if (p.nutrition && props.getProperty('MT_' + rec.id) !== ht) { mirrorTargets_(rec.id, p, a); props.setProperty('MT_' + rec.id, ht); }
}

function rewriteTab_(name, keep, add) {
  var sh = sheet_(name), w = TABS[name].length, n = sh.getLastRow();
  var rows = n > 1 ? sh.getRange(2, 1, n - 1, w).getValues().filter(keep) : [];
  rows = rows.concat(add);
  if (n > 1) sh.getRange(2, 1, n - 1, w).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, w).setValues(rows);
}

function mirrorPlans_(id, name, plan, planDate, age) {
  var old = {}, sh = sheet_('Plans'), n = sh.getLastRow();
  if (n > 1) sh.getRange(2, 1, n - 1, 16).getValues().forEach(function (r) { if (r[0] === id) old[slug_(r[5])] = { rir: r[8], inc: r[11] }; });
  var now = new Date(), ver = planDate ? Utilities.formatDate(new Date(planDate), tz_(), 'yyyy-MM-dd') : '', add = [];
  (plan.days || []).forEach(function (d) {
    (d.exercises || []).forEach(function (ex, i) {
      var cls = classify_(ex.name, age), o = old[slug_(ex.name)] || {};
      var rest = (String(ex.notes || '').match(/rest\s+([\d.]+\s*(?:-|to)?\s*[\d.]*\s*(?:min|sec|s|m)\w*)/i) || [])[1] || '';
      add.push([id, name, ver, String(d.day || ''), i + 1, String(ex.name || ''), ex.sets || '', String(ex.reps || ''),
        o.rir !== undefined && o.rir !== '' ? o.rir : (cls.type === 'skip' ? '' : cls.rir), String(ex.tempo || ''), rest,
        o.inc !== undefined && o.inc !== '' ? o.inc : (cls.type === 'skip' ? '' : cls.inc), cls.type, String(ex.notes || ''), true, now]);
    });
  });
  rewriteTab_('Plans', function (r) { return r[0] !== id; }, add);
}

function mirrorSupps_(id, items) {
  var now = new Date();
  rewriteTab_('Supplements', function (r) { return r[0] !== id; }, (items || []).map(function (x) {
    return [id, String(x.name || ''), String(x.dose || ''), String(x.time || ''), String(x.cat || ''), x.withFood === true ? true : x.withFood === false ? false : '', String(x.status || ''), String(x.note || x.notes || ''), now];
  }));
}

function firstNum_(s) { var m = String(s || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : ''; }

function mirrorTargets_(id, plan, a) {
  var n = plan.nutrition || {}, ph = (plan.phases || [])[0] || {};
  sheet_('Targets').appendRow([id, String(ph.name || ''), dateStr_(new Date()), '', firstNum_(n.calories), firstNum_(n.protein), firstNum_(n.carbs), firstNum_(n.fat),
    firstNum_(a.targetWeight), 'plan', 'From the current plan', new Date()]);
}

/* ------------------------------------------------------- one-time upgrade */

/**
 * Run once after setup. Copies each athlete's plan, supplements and targets into the Sheet, and every logged set
 * from the JSON files into SetLog, then works out progression. Safe to run again (rows are keyed, not duplicated).
 */
function migrateV2() {
  var v = sheet_('Athletes').getDataRange().getValues(), report = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    var id = String(v[i][0]), rec;
    try { rec = readRec_(v[i][6]); } catch (e) { report.push(id + ': file unreadable'); continue; }
    PropertiesService.getScriptProperties().deleteProperty('MP_' + id);
    PropertiesService.getScriptProperties().deleteProperty('MS_' + id);
    PropertiesService.getScriptProperties().deleteProperty('MT_' + id);
    mirror_(rec);
    var name = (rec.a && rec.a.name) || v[i][2], L = rec.log || {}, plan = rec.plan || {};
    var names = {}, ranges = {};
    (plan.days || []).forEach(function (d) { (d.exercises || []).forEach(function (ex) { names[slug_(ex.name)] = ex.name; ranges[slug_(ex.name)] = ex.reps; }); });
    Object.keys(rec.swaps || {}).forEach(function (k) { var alt = rec.swaps[k]; names[slug_(alt)] = alt; ranges[slug_(alt)] = ranges[k.split('|')[1]]; });
    var start = mondayOf_(new Date(rec.planStart || rec.planDate || Date.now()));
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], sets = [];
    Object.keys(L).forEach(function (key) {
      var p = key.split('|'), x = L[key] || {};
      if (p.length !== 4 || !(x.wt || x.reps || x.done)) return;
      var w = Number(String(p[0]).replace(/\D/g, '')), di = DAYS.indexOf(p[1]);
      if (!w || di < 0) return;
      var dt = new Date(start.getTime()); dt.setDate(dt.getDate() + (w - 1) * 7 + di);
      sets.push({ key: key, date: dateStr_(dt), day: p[1], ex: names[p[2]] || p[2].replace(/-/g, ' '), range: ranges[p[2]] || '', n: Number(p[3]), wt: x.wt, reps: x.reps, rir: x.rir, t: x.t, done: !!x.done });
    });
    var sh = sheet_('SetLog'), n = sh.getLastRow(), have = {};
    if (n > 1) sh.getRange(2, 1, n - 1, 1).getValues().forEach(function (r) { have[r[0]] = true; });
    var add = sets.filter(function (s) { return !have[id + '|' + s.key]; }).map(function (s) {
      return [id + '|' + s.key, s.date, id, name, s.day, s.ex, s.n, num_(s.wt), num_(s.reps), num_(s.rir), String(s.t || ''), s.done, 'v1 import', String(v[i][1]), new Date()];
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
    var seen = {};
    sets.forEach(function (s) { if (!seen[slug_(s.ex)]) { seen[slug_(s.ex)] = 1; updateProgression_(id, s.ex, { reps: s.range }, ''); } });
    report.push(name + ': plan ' + ((plan.days || []).length) + ' days, ' + sets.length + ' sets (' + add.length + ' new), ' + Object.keys(seen).length + ' exercises tracked');
  }
  log_('', 'migrate_v2', report.join(' | '));
  Logger.log(report.join('\n'));
  return report.join('\n');
}

/* ---------------------------------------------------- InBody reminder email */

/** Daily trigger: emails an athlete once a week while a scan is due (every 4 weeks). */
function dailyReminders() {
  try { whoopSyncAll(); } catch (e) {}
  var props = PropertiesService.getScriptProperties();
  var v = sheet_('Athletes').getDataRange().getValues(), sent = 0;
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0] || String(v[i][4]).toUpperCase() !== 'TRUE') continue;
    var id = String(v[i][0]), owner = String(v[i][1]).trim().toLowerCase();
    if (!getUser_(owner)) continue;
    var b = bodyFor_(id);
    if (!b.due) continue;
    var lastSent = Number(props.getProperty('REM_' + id) || 0);
    if (Date.now() - lastSent < 7 * 864e5) continue;
    MailApp.sendEmail({ to: owner, name: APP_NAME, subject: APP_NAME + ': time for your InBody scan',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a"><p>' + (b.lastDate ? 'Your last InBody scan was ' + b.daysSince + ' days ago (' + b.lastDate + ').' : 'There\'s no InBody scan on file yet.') + ' Scans every 4 weeks show whether the plan is building muscle and keeping fat in check.</p>' +
        '<p><b>For a fair comparison:</b> scan fasted or 2 to 3 hours after eating, at the same time of day as last time, and before any workout.</p>' +
        '<p>Then open <a href="' + APP_URL + '">' + APP_NAME + '</a>, go to <b>Scans</b>, and upload a photo of the printout or type the 5 numbers.</p></div>' });
    props.setProperty('REM_' + id, String(Date.now()));
    sent++;
  }
  if (sent) log_('', 'inbody_reminders', sent + ' sent');
  return sent;
}

/* ------------------------------------------------------------ access requests */

function secret_() {
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('APPROVAL_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('APPROVAL_SECRET', s); }
  return s;
}
function sig_(act, email) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(act + '|' + email, secret_())).replace(/=+$/, '').slice(0, 32); }
function blocked_() { return (prop_('BLOCKED') || '').split(',').filter(String); }
function admins_() {
  var v = sheet_('Users').getDataRange().getValues(), out = [];
  for (var i = 1; i < v.length; i++) if (String(v[i][2]).toLowerCase() === 'admin' && String(v[i][3]).toUpperCase() !== 'FALSE') out.push(String(v[i][0]).trim());
  return out;
}
function notifyAccessRequest_(email) {
  if (blocked_().indexOf(email) >= 0) return;
  var cache = CacheService.getScriptCache();
  if (cache.get('asked:' + email)) return;
  cache.put('asked:' + email, '1', 21600);
  var link = function (act) { return APP_URL + '?access=' + act + '&e=' + encodeURIComponent(email) + '&s=' + sig_(act, email); };
  var btn = function (href, label, bg) { return '<a href="' + href + '" style="display:inline-block;padding:12px 22px;margin:6px 8px 6px 0;border-radius:10px;background:' + bg + ';color:#fff;font-weight:bold;text-decoration:none">' + label + '</a>'; };
  var when = Utilities.formatDate(new Date(), tz_(), 'MMM d, h:mm a');
  admins_().forEach(function (a) {
    MailApp.sendEmail({ to: a, subject: APP_NAME + ': ' + email + ' wants to sign in',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a"><p><b>' + email + '</b> asked to sign in to ' + APP_NAME + ' (' + when + '). They aren\'t approved yet, so no code was sent.</p>' +
        '<p>' + btn(link('approve'), 'Approve', '#15803d') + btn(link('deny'), 'Deny', '#E42626') + '</p>' +
        '<p style="color:#475569;font-size:13px">Approve adds them to the Users list and emails them to sign in. Deny keeps them out and stops alerts about this email. Each button asks you to confirm first.</p></div>' });
  });
  log_(email, 'access_alert_sent', admins_().join(', '));
}
function accessDecision(act, email, s) {
  email = String(email || '').trim().toLowerCase();
  if (['approve', 'deny'].indexOf(act) < 0 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err_('bad_request', 'That link is incomplete.');
  if (String(s || '') !== sig_(act, email)) throw err_('denied', 'This link isn\'t valid. Use the buttons in the newest alert email.');
  var props = PropertiesService.getScriptProperties();
  if (act === 'deny') {
    var b = blocked_(); if (b.indexOf(email) < 0) { b.push(email); props.setProperty('BLOCKED', b.join(',')); }
    log_(email, 'access_denied', 'by admin link');
    return { done: 'denied', email: email };
  }
  props.setProperty('BLOCKED', blocked_().filter(function (x) { return x !== email; }).join(','));
  var sh = sheet_('Users'), r = findRow_(sh, 1, email);
  if (r) sh.getRange(r, 4).setValue(true); else sh.appendRow([email, '', 'athlete', true, new Date()]);
  MailApp.sendEmail({ to: email, subject: 'You\'re approved for ' + APP_NAME,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a"><p>You\'re all set. Go to <a href="' + APP_URL + '">' + APP_URL + '</a>, enter this email address and tap <b>Email me a code</b>. The code arrives within a minute or two; check spam or junk if you don\'t see it.</p></div>' });
  log_(email, 'access_approved', 'by admin link; user emailed');
  return { done: 'approved', email: email };
}

/* ---------------------------------------------------------------- helpers */

function extractJson_(text) {
  if (!text) return null;
  var t = String(text).replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  var a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

var SS_ = null;
function sheet_(name) {
  if (!SS_) { var id = prop_('SHEET_ID'); SS_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet(); }
  var sh = SS_.getSheetByName(name);
  if (!sh) throw err_('not_setup', 'The app isn\'t set up yet. Run setup() in the script editor.');
  return sh;
}

function parseJ_(t) { if (!t) return null; try { return JSON.parse(t); } catch (e) { return null; } }

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function tz_() { return Session.getScriptTimeZone() || 'America/Chicago'; }

function dateStr_(d) {
  if (!d) return '';
  if (Object.prototype.toString.call(d) === '[object Date]') return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd');
  var s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  var dt = new Date(s);
  return isNaN(dt) ? s : Utilities.formatDate(dt, tz_(), 'yyyy-MM-dd');
}

function mondayOf_(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

function findRow_(sh, col, value) {
  var n = sh.getLastRow(); if (n < 2) return 0;
  var v = sh.getRange(2, col, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][0]).trim().toLowerCase() === String(value).toLowerCase()) return i + 2;
  return 0;
}

function hash_(s) {
  var salt = prop_('SALT');
  if (!salt) { salt = Utilities.getUuid(); PropertiesService.getScriptProperties().setProperty('SALT', salt); }
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + s));
}

function err_(code, msg) { return new Error('F2C:' + code + ':' + msg); }

function log_(email, action, detail) {
  try { sheet_('Log').appendRow([new Date(), email, action, String(detail || '').slice(0, 500)]); } catch (e) {}
}
