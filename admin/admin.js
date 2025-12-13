const LS_PREVIEW_PREFIX = "cg_preview_org_"; // + orgId
const $ = (id) => document.getElementById(id);

const LS_SESSION = "cg_session_org_v1";
const LS_STORE   = "cg_admin_store_org_v1";

/** 네가 바꾼 계정 그대로 유지 */
const ACCOUNTS = [
  { id: "dept-bieung", name: "비응파출소", orgType: "부서", username: "bieung", password: "1234", role: "EDITOR" },
  { id: "dept-haemang", name: "해망파출소", orgType: "부서", username: "haemang", password: "1234", role: "EDITOR" },
  { id: "dept-saemangeum", name: "새만금파출소", orgType: "부서", username: "saemangeum", password: "1234", role: "EDITOR" },

  { id: "p-67", name: "P-67", orgType: "P정", username: "p67", password: "1234", role: "EDITOR" },
  { id: "p-69", name: "P-69", orgType: "P정", username: "p69", password: "1234", role: "EDITOR" },
  { id: "p-91", name: "P-91", orgType: "P정", username: "p91", password: "1234", role: "EDITOR" },

  { id: "ship-321", name: "321함", orgType: "함정", username: "321", password: "1234", role: "EDITOR" },
  { id: "ship-322", name: "322함", orgType: "함정", username: "322", password: "1234", role: "EDITOR" },
  { id: "ship-1001", name: "1001함", orgType: "함정", username: "1001", password: "1234", role: "EDITOR" },
  { id: "ship-3010", name: "3010함", orgType: "함정", username: "3010", password: "1234", role: "EDITOR" },
  { id: "ship-3013", name: "3013함", orgType: "함정", username: "3013", password: "1234", role: "EDITOR" }
];

let me = null;
let store = null; // 조직별 데이터: { meta, types }
let selectedType = null;
let selectedCase = null;
let selectedCat  = null;

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1400);
}
function fmt(d){
  const pad = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadAll(){
  return JSON.parse(localStorage.getItem(LS_STORE) || "{}");
}
function saveAll(all){
  localStorage.setItem(LS_STORE, JSON.stringify(all));
}
function loadOrgStore(){
  const all = loadAll();
  if(!all[me.id]){
    all[me.id] = { meta: { versionSeed: 1 }, types: {} };
    saveAll(all);
  }
  return all[me.id];
}
function saveOrgStore(){
  const all = loadAll();
  all[me.id] = store;
  saveAll(all);
}

function login(username, password){
  const acc = ACCOUNTS.find(a => a.username === username && a.password === password);
  if(!acc) return false;
  me = acc;
  localStorage.setItem(LS_SESSION, me.id);
  return true;
}
function restoreSession(){
  const id = localStorage.getItem(LS_SESSION);
  if(!id) return false;
  const acc = ACCOUNTS.find(a => a.id === id);
  if(!acc) return false;
  me = acc;
  return true;
}
function logout(){
  localStorage.removeItem(LS_SESSION);
  me = null;
  store = null;
}

function ensureSeed(){
  if(Object.keys(store.types).length > 0) return;

  store.types = {
    "수색": {
      "description": "실종자·선박 위치 탐색",
      "cases": {
        "실종자 수색(기본)": {
          "description": "초기 정보 수집 및 탐색 중심",
          "categories": {
            "개인장비": [
              { "name": "장갑", "note": "" },
              { "name": "헤드랜턴", "note": "야간 대비" }
            ],
            "수색장비": [
              { "name": "쌍안경", "note": "" },
              { "name": "조명/서치라이트", "note": "작동 확인" }
            ],
            "통신": [
              { "name": "무전기", "note": "예비 배터리 포함" }
            ]
          }
        }
      }
    },

    "구조": {
      "description": "인명 구조/응급 대응",
      "cases": {
        "기본 구조": {
          "description": "일반 구조 상황",
          "categories": {
            "개인장비": [
              { "name": "장갑", "note": "작업용/보온" },
              { "name": "헤드랜턴", "note": "야간 대비" }
            ],
            "구조장비": [
              { "name": "로프", "note": "마모 확인" },
              { "name": "구명부환", "note": "" }
            ],
            "응급": [
              { "name": "응급처치 세트", "note": "재고 확인" }
            ]
          }
        }
      }
    },

    "단속": {
      "description": "법 집행 및 증거 확보",
      "cases": {
        "음주운항 단속": {
          "description": "측정·기록·증거 보전 중심",
          "categories": {
            "개인장비": [
              { "name": "제복/우의", "note": "" }
            ],
            "단속": [
              { "name": "바디캠/녹화장비", "note": "저장공간 확인" },
              { "name": "측정장비(부서기준)", "note": "배터리/작동 확인" },
              { "name": "증거물 봉투", "note": "" }
            ],
            "문서": [
              { "name": "필요 서식(업무별)", "note": "" },
              { "name": "필기구", "note": "" }
            ]
          }
        }
      }
    },

    "경비": {
      "description": "해상 질서 유지/예방 활동",
      "cases": {
        "연안·항만 경비(기본)": {
          "description": "예방 순찰 및 현장 대응",
          "categories": {
            "개인장비": [
              { "name": "제복/방한", "note": "기상에 맞게" }
            ],
            "장비": [
              { "name": "손전등", "note": "" },
              { "name": "확성기", "note": "작동 확인" }
            ],
            "통신": [
              { "name": "무전기", "note": "채널/예비 배터리" }
            ]
          }
        }
      }
    },

    "사고 대응": {
      "description": "사고 현장 통제/추가 피해 방지",
      "cases": {
        "충돌·좌초 사고(기본)": {
          "description": "현장 통제 및 안전 확보 중심",
          "categories": {
            "개인장비": [
              { "name": "안전모", "note": "" },
              { "name": "장갑", "note": "" }
            ],
            "안전/통제": [
              { "name": "통제선/표지테이프", "note": "현장 통제" }
            ],
            "기록": [
              { "name": "카메라/기록장비", "note": "증거/기록" }
            ]
          }
        }
      }
    },

    "해양 오염": {
      "description": "유류 유출·오염 대응/방제",
      "cases": {
        "유류 유출(기본)": {
          "description": "초기 확산 방지 및 방제 지원",
          "categories": {
            "개인보호구": [
              { "name": "방제복/보호복", "note": "" },
              { "name": "보호장갑", "note": "내유성" },
              { "name": "보안경/마스크", "note": "" }
            ],
            "방제": [
              { "name": "흡착포/흡착재", "note": "재고 확인" },
              { "name": "폐기물 포대/봉투", "note": "" }
            ],
            "기록/보고": [
              { "name": "현장 기록(사진/메모)", "note": "위치/시간 포함" }
            ]
          }
        }
      }
    }
  };

  saveOrgStore();
}


function getTypes(){ return store.types; }
function getTypeObj(){ return selectedType ? getTypes()[selectedType] : null; }
function getCaseObj(){
  const t = getTypeObj();
  return (t && selectedCase) ? t.cases[selectedCase] : null;
}

function renderHeader(){
  $("whoText").textContent  = `${me.name} (${me.orgType})`;
  $("roleText").textContent = me.role || "EDITOR";
}

function renderTypeSelect(){
  const sel = $("typeSelect");
  sel.innerHTML = "";

  const types = getTypes();
  const names = Object.keys(types);
  names.forEach(n=>{
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = n;
    sel.appendChild(opt);
  });

  selectedType = names[0] || null;
  sel.value = selectedType || "";

  $("typeDesc").value = selectedType ? (types[selectedType].description || "") : "";
}

function renderCaseSelect(){
  const sel = $("caseSelect");
  sel.innerHTML = "";

  const t = getTypeObj();
  const cases = t?.cases || {};
  const names = Object.keys(cases);

  names.forEach(n=>{
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = n;
    sel.appendChild(opt);
  });

  selectedCase = names[0] || null;
  sel.value = selectedCase || "";

  $("caseDesc").value = selectedCase ? (cases[selectedCase].description || "") : "";

  renderCatSelect();
}

function renderCatSelect(){
  const sel = $("catSelect");
  sel.innerHTML = "";

  const c = getCaseObj();
  const cats = c?.categories || {};
  const names = Object.keys(cats);

  names.forEach(n=>{
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = n;
    sel.appendChild(opt);
  });

  selectedCat = names[0] || null;
  sel.value = selectedCat || "";

  renderItemList();
}

function renderItemList(){
  const list = $("itemList");
  list.innerHTML = "";

  const c = getCaseObj();
  if(!selectedType || !selectedCase || !c){
    list.innerHTML = `<div class="hint">유형/상황을 먼저 선택해줘.</div>`;
    return;
  }
  if(!selectedCat){
    list.innerHTML = `<div class="hint">카테고리를 추가해줘.</div>`;
    return;
  }
  const items = c.categories[selectedCat] || [];
  if(items.length === 0){
    list.innerHTML = `<div class="hint">항목이 없습니다. 아래 입력창에 여러 줄로 붙여넣고 일괄 추가해줘.</div>`;
    return;
  }

  items.forEach((it, idx)=>{
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <b>${it.name}</b>
      <div class="small">${it.note || ""}</div>
      <div class="actions">
        <button data-act="edit" data-idx="${idx}" class="small-btn">수정</button>
        <button data-act="del" data-idx="${idx}" class="danger small-btn">삭제</button>
        <button data-act="up" data-idx="${idx}" class="small-btn">위로</button>
        <button data-act="down" data-idx="${idx}" class="small-btn">아래로</button>
      </div>
    `;
    card.querySelectorAll("button").forEach(btn=>{
      btn.onclick = ()=> handleItemAction(btn.dataset.act, Number(btn.dataset.idx));
    });
    list.appendChild(card);
  });
}

function handleItemAction(act, idx){
  const c = getCaseObj();
  const arr = c.categories[selectedCat];

  if(act === "edit"){
    const cur = arr[idx];
    const name = prompt("항목명", cur.name);
    if(name === null) return;
    const note = prompt("메모(선택)", cur.note || "");
    if(note === null) return;
    arr[idx] = { name: name.trim(), note: (note||"").trim() };
    saveOrgStore(); renderItemList(); toast("수정됨");
  }

  if(act === "del"){
    arr.splice(idx, 1);
    saveOrgStore(); renderItemList(); toast("삭제됨");
  }

  if(act === "up" && idx > 0){
    [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    saveOrgStore(); renderItemList();
  }

  if(act === "down" && idx < arr.length-1){
    [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
    saveOrgStore(); renderItemList();
  }
}

function parseBulkLines(text){
  // 한 줄: "이름 | 메모" 또는 "이름 - 메모" 또는 "이름"
  const lines = (text || "")
    .split(/\r?\n/)
    .map(l=>l.trim())
    .filter(Boolean);

  const parsed = [];
  for(const line of lines){
    let name = line, note = "";
    if(line.includes("|")){
      const [a, ...rest] = line.split("|");
      name = a.trim();
      note = rest.join("|").trim();
    }else if(line.includes(" - ")){
      const [a, ...rest] = line.split(" - ");
      name = a.trim();
      note = rest.join(" - ").trim();
    }else if(line.includes("-")){
      // 너무 공격적이면 이름에 '-'가 들어갈 수 있어서 가볍게만
      const parts = line.split("-");
      if(parts.length >= 2){
        name = parts[0].trim();
        note = parts.slice(1).join("-").trim();
      }
    }
    if(name) parsed.push({ name, note });
  }
  return parsed;
}

function exportOrgJson(){
  const payload = {
    ownerId: me.id,
    ownerName: me.name,
    ownerType: me.orgType,
    version: `v1.${store.meta.versionSeed++}`,
    publishedAt: fmt(new Date()),
    publishedBy: me.username,
    types: store.types
  };
  saveOrgStore();

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `latest-${me.id}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast("내보내기 완료");
}

function bindUI(){
  $("btnLogin").onclick = ()=>{
    const id = $("loginId").value.trim();
    const pw = $("loginPw").value.trim();
    if(login(id, pw)) openAdmin();
    else toast("아이디 또는 비밀번호 오류");
  };

  $("btnLogout").onclick = ()=>{
    logout();
    $("adminView").style.display = "none";
    $("loginView").style.display = "block";
    toast("로그아웃됨");
  };

  $("btnExportOrg").onclick = exportOrgJson;

  $("typeSelect").onchange = (e)=>{
    selectedType = e.target.value;
    $("typeDesc").value = getTypes()[selectedType]?.description || "";
    renderCaseSelect();
  };

  $("caseSelect").onchange = (e)=>{
    selectedCase = e.target.value;
    $("caseDesc").value = getCaseObj()?.description || "";
    renderCatSelect();
  };

  $("catSelect").onchange = (e)=>{
    selectedCat = e.target.value;
    renderItemList();
  };

  $("btnAddType").onclick = ()=>{
    const name = prompt("새 유형명", "단속");
    if(!name || !name.trim()) return;
    const types = getTypes();
    if(types[name.trim()]) return toast("이미 존재하는 유형");
    types[name.trim()] = { description:"", cases:{} };
    saveOrgStore();
    renderTypeSelect();
    selectedType = name.trim();
    $("typeSelect").value = selectedType;
    renderCaseSelect();
    toast("유형 추가됨");
  };

  $("btnDelType").onclick = ()=>{
    if(!selectedType) return;
    if(!confirm(`유형 "${selectedType}" 삭제할까?`)) return;
    delete getTypes()[selectedType];
    saveOrgStore();
    renderTypeSelect();
    renderCaseSelect();
    toast("유형 삭제됨");
  };

  $("btnSaveTypeDesc").onclick = ()=>{
    if(!selectedType) return;
    getTypes()[selectedType].description = ($("typeDesc").value || "").trim();
    saveOrgStore();
    toast("유형 설명 저장됨");
  };

  $("btnAddCase").onclick = ()=>{
    if(!selectedType) return toast("유형 먼저 선택");
    const name = prompt("새 상황명", "음주운항 단속");
    if(!name || !name.trim()) return;
    const t = getTypeObj();
    if(t.cases[name.trim()]) return toast("이미 존재하는 상황");
    t.cases[name.trim()] = { description:"", categories:{} };
    saveOrgStore();
    renderCaseSelect();
    selectedCase = name.trim();
    $("caseSelect").value = selectedCase;
    renderCatSelect();
    toast("상황 추가됨");
  };

  $("btnDelCase").onclick = ()=>{
    if(!selectedType || !selectedCase) return;
    if(!confirm(`상황 "${selectedCase}" 삭제할까?`)) return;
    delete getTypeObj().cases[selectedCase];
    saveOrgStore();
    renderCaseSelect();
    renderCatSelect();
    toast("상황 삭제됨");
  };

  $("btnSaveCaseDesc").onclick = ()=>{
    if(!selectedType || !selectedCase) return;
    getTypeObj().cases[selectedCase].description = ($("caseDesc").value || "").trim();
    saveOrgStore();
    toast("상황 설명 저장됨");
  };

  $("btnAddCat").onclick = ()=>{
    if(!selectedType || !selectedCase) return toast("유형/상황 먼저 선택");
    const name = prompt("새 카테고리명", "단속");
    if(!name || !name.trim()) return;
    const c = getCaseObj();
    if(c.categories[name.trim()]) return toast("이미 존재하는 카테고리");
    c.categories[name.trim()] = [];
    saveOrgStore();
    renderCatSelect();
    selectedCat = name.trim();
    $("catSelect").value = selectedCat;
    renderItemList();
    toast("카테고리 추가됨");
  };

  $("btnRenameCat").onclick = ()=>{
    if(!selectedType || !selectedCase || !selectedCat) return;
    const next = prompt("새 카테고리명", selectedCat);
    if(!next || !next.trim()) return;
    const c = getCaseObj();
    if(c.categories[next.trim()]) return toast("이미 존재하는 카테고리명");
    c.categories[next.trim()] = c.categories[selectedCat];
    delete c.categories[selectedCat];
    selectedCat = next.trim();
    saveOrgStore();
    renderCatSelect();
    $("catSelect").value = selectedCat;
    renderItemList();
    toast("카테고리명 변경됨");
  };

  $("btnDelCat").onclick = ()=>{
    if(!selectedType || !selectedCase || !selectedCat) return;
    if(!confirm(`카테고리 "${selectedCat}" 삭제할까?`)) return;
    const c = getCaseObj();
    delete c.categories[selectedCat];
    selectedCat = null;
    saveOrgStore();
    renderCatSelect();
    toast("카테고리 삭제됨");
  };

  $("btnAddBulk").onclick = ()=>{
    if(!selectedType || !selectedCase || !selectedCat) return toast("유형/상황/카테고리 선택 필요");
    const text = $("bulkItems").value;
    const parsed = parseBulkLines(text);
    if(parsed.length === 0) return toast("추가할 항목이 없어요");

    const c = getCaseObj();
    const arr = c.categories[selectedCat];
    parsed.forEach(p => arr.push({ name: p.name, note: p.note || "" }));

    $("bulkItems").value = "";
    saveOrgStore();
    renderItemList();
    toast(`${parsed.length}개 항목 추가됨`);
  };
}

function openAdmin(){
  $("loginView").style.display = "none";
  $("adminView").style.display = "block";

  store = loadOrgStore();
  ensureSeed();

  renderHeader();
  renderTypeSelect();
  renderCaseSelect();
  renderCatSelect();

  toast(`${me.name} 로그인됨`);
}

function init(){
  bindUI();
  if(restoreSession()) openAdmin();
  $("btnSavePreview").onclick = savePreviewNow;
}
init();


  // 사용자 화면 프리뷰용(즉시 반영)
  localStorage.setItem(LS_PREVIEW_PREFIX + me.id, JSON.stringify({
    ownerId: me.id, ownerName: me.name, ownerType: me.orgType,
    version: `preview-${store.meta?.versionSeed || 1}`,
    publishedAt: fmt(new Date()),
    publishedBy: me.username,
    types: store.types
  }));

  function savePreviewNow(){
  // store(types)가 최신 상태라는 가정(각 동작에서 store 수정함)
  saveOrgStore();

  const payload = {
    ownerId: me.id,
    ownerName: me.name,
    ownerType: me.orgType,
    version: `preview-${store.meta?.versionSeed || 1}`,
    publishedAt: fmt(new Date()),
    publishedBy: me.username,
    types: store.types
  };

  localStorage.setItem(LS_PREVIEW_PREFIX + me.id, JSON.stringify(payload));
  toast("저장됨 → 사용자 화면에서 즉시 확인 가능");
}
