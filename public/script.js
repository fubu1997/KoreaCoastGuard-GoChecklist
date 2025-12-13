const LS_PREVIEW_PREFIX = "cg_preview_org_"; // + orgId
const $ = (id) => document.getElementById(id);

const LS_USER_STATE = "cg_user_state_org_v1"; // orgId + type + case별 체크상태
const state = {
  index: null,        // /data/index.json
  orgId: null,
  orgMeta: null,      // {id,name,orgType,file}
  data: null,         // organization data JSON
  type: null,
  caseName: null,
  checklist: {},
  search: ""
};

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
function uid(){ return Math.random().toString(36).slice(2,10); }

function dataBase(){
  // 현재 페이지 기준으로 "../data/"를 절대 URL로 계산
  return new URL("../data/", window.location.href).toString();
}

async function loadIndex(){
  const res = await fetch("./data/index.json", { cache: "no-store" });
  if(!res.ok) throw new Error("index.json 로드 실패");
  return await res.json();
}

async function loadOrgFile(file){
  const res = await fetch(`./data/${file}`, { cache: "no-store" });
  if(!res.ok) throw new Error(`${file} 로드 실패`);
  return await res.json();
}




function renderOrgSelect(){
  const sel = $("orgSelect");
  sel.innerHTML = "";
  state.index.orgs.forEach(o=>{
    const opt = document.createElement("option");
    opt.value = o.id;
    opt.textContent = `${o.name} (${o.orgType})`;
    sel.appendChild(opt);
  });
  state.orgId = state.index.orgs[0]?.id || null;
  sel.value = state.orgId || "";
}

function setEmpty(){
  state.type = null;
  state.caseName = null;
  state.checklist = {};
  $("typeButtons").innerHTML = "";
  $("caseButtons").innerHTML = "";
  $("checkView").style.display = "none";
  $("emptyView").style.display = "block";
  $("title").textContent = "체크리스트";
  $("subtitle").textContent = "조직 → 유형 → 상황 선택";
  $("searchInput").value = "";
  $("memo").value = "";
  state.search = "";
  updateUnchecked();
}

function renderVersion(){
  const v = state.data?.version || "-";
  $("versionPill").innerHTML = `버전: <b>${v}</b>`;
}

function renderTypes(){
  const wrap = $("typeButtons");
  wrap.innerHTML = "";
  const types = state.data?.types || {};
  Object.keys(types).forEach(t=>{
    const btn = document.createElement("button");
    btn.className = "type-btn";
    btn.innerHTML = `<strong>${t}</strong><span>${types[t].description || ""}</span>`;
    btn.onclick = ()=> selectType(t);
    wrap.appendChild(btn);
  });
}

function renderCases(){
  const wrap = $("caseButtons");
  wrap.innerHTML = "";
  if(!state.type) return;
  const typeObj = state.data.types[state.type];
  const cases = typeObj?.cases || {};
  const names = Object.keys(cases);
  if(names.length === 0){
    wrap.innerHTML = `<div class="hint">등록된 상황이 없습니다.</div>`;
    return;
  }
  names.forEach(cn=>{
    const btn = document.createElement("button");
    btn.className = "type-btn";
    btn.innerHTML = `<strong>${cn}</strong><span>${cases[cn].description || ""}</span>`;
    btn.onclick = ()=> selectCase(cn);
    wrap.appendChild(btn);
  });
}

function selectType(type){
  state.type = type;
  state.caseName = null;
  state.checklist = {};
  $("caseButtons").innerHTML = "";
  $("checkView").style.display = "none";
  $("emptyView").style.display = "block";
  $("title").textContent = `체크리스트 · ${state.orgMeta.name} · ${type}`;
  $("subtitle").textContent = state.data.types[type]?.description || "";
  $("memo").value = "";
  $("searchInput").value = "";
  state.search = "";
  renderCases();
  updateUnchecked();
  toast(`"${type}" 유형 선택됨`);
}

function selectCase(caseName){
  state.caseName = caseName;
  const caseObj = state.data.types[state.type].cases[caseName];

  // categories -> 체크리스트 구조
  const checklist = {};
  Object.entries(caseObj.categories || {}).forEach(([cat, items])=>{
    checklist[cat] = (items || []).map(it=>({
      id: uid(),
      name: it.name ?? it,
      note: it.note || "",
      checked: false
    }));
  });

  // 로컬 복원
  const key = `${state.orgId}__${state.type}__${state.caseName}`;
  const all = JSON.parse(localStorage.getItem(LS_USER_STATE) || "{}");
  if(all[key]?.checklist){
    state.checklist = all[key].checklist;
    $("memo").value = all[key].memo || "";
  }else{
    state.checklist = checklist;
    $("memo").value = "";
  }

  $("title").textContent = `체크리스트 · ${state.orgMeta.name} · ${state.type} · ${state.caseName}`;
  $("subtitle").textContent = caseObj.description || "";

  $("emptyView").style.display = "none";
  $("checkView").style.display = "block";

  renderChecklist();
  updateUnchecked();
  toast(`"${caseName}" 상황 선택됨`);
}

function renderChecklist(){
  const container = $("categoryContainer");
  container.innerHTML = "";
  if(!state.type || !state.caseName) return;

  const q = (state.search || "").trim().toLowerCase();

  Object.entries(state.checklist).forEach(([cat, items])=>{
    const filtered = q ? items.filter(it => (it.name + " " + it.note).toLowerCase().includes(q)) : items;
    if(q && filtered.length === 0) return;

    const details = document.createElement("details");
    details.open = true;

    const checkedCount = items.filter(i=>i.checked).length;

    const summary = document.createElement("summary");
    summary.innerHTML = `<div><b>${cat}</b> <span class="badge">(${checkedCount}/${items.length})</span></div><div class="badge">탭</div>`;

    const wrap = document.createElement("div");
    wrap.className = "items";

    filtered.forEach(it=>{
      const row = document.createElement("div");
      row.className = "item";
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!it.checked;
      cb.onchange = ()=>{
        it.checked = cb.checked;
        renderChecklist();
        updateUnchecked();
      };

      const nameWrap = document.createElement("div");
      nameWrap.className = "name";
      nameWrap.innerHTML = `<span>${it.name}</span>${it.note ? `<small>${it.note}</small>` : ""}`;

      label.appendChild(cb);
      label.appendChild(nameWrap);
      row.appendChild(label);
      wrap.appendChild(row);
    });

    details.appendChild(summary);
    details.appendChild(wrap);
    container.appendChild(details);
  });
}

function updateUnchecked(){
  if(!state.type || !state.caseName){
    $("uncheckedPill").innerHTML = `미체크: <b>-</b>`;
    return;
  }
  let total=0, unchecked=0;
  Object.values(state.checklist).forEach(items => items.forEach(it=>{
    total++;
    if(!it.checked) unchecked++;
  }));
  $("uncheckedPill").innerHTML = `미체크: <b>${unchecked}</b> / ${total}`;
}

function bindUI(){
  $("orgSelect").addEventListener("change", async (e)=>{
    const id = e.target.value;
    await loadOrgById(id);
  });

  $("btnReload").onclick = async ()=>{
    state.index = await loadIndex();
    await loadOrgById(state.orgId || state.index.orgs[0].id);
    toast("데이터 다시 로드됨");
  };

  $("btnCheckAll").onclick = ()=>{
    if(!state.type || !state.caseName) return toast("상황 선택");
    Object.values(state.checklist).forEach(items => items.forEach(it=> it.checked=true));
    renderChecklist(); updateUnchecked(); toast("전체 체크");
  };

  $("btnUncheckAll").onclick = ()=>{
    if(!state.type || !state.caseName) return toast("상황 선택");
    Object.values(state.checklist).forEach(items => items.forEach(it=> it.checked=false));
    renderChecklist(); updateUnchecked(); toast("전체 해제");
  };

  $("btnSaveLocal").onclick = ()=>{
    if(!state.type || !state.caseName) return toast("상황 선택");
    const key = `${state.orgId}__${state.type}__${state.caseName}`;
    const all = JSON.parse(localStorage.getItem(LS_USER_STATE) || "{}");
    all[key] = { checklist: state.checklist, memo: $("memo").value || "" };
    localStorage.setItem(LS_USER_STATE, JSON.stringify(all));
    toast("체크 상태 저장됨(기기 내)");
  };

  $("searchInput").addEventListener("input", (e)=>{
    state.search = e.target.value || "";
    renderChecklist();
  });
}

async function loadOrgById(id){
  state.orgId = id;
  state.orgMeta = state.index.orgs.find(o=>o.id===id);
  setEmpty();

  $("orgDesc").textContent = `${state.orgMeta.name} · ${state.orgMeta.orgType} 기준 템플릿`;

  const preview = localStorage.getItem(LS_PREVIEW_PREFIX + state.orgId);

if(preview){
  state.data = JSON.parse(preview);
  toast("로컬 프리뷰(관리자 저장본) 로드됨");
}else{
  state.data = await loadOrgFile(state.orgMeta.file);
  toast("배포본(JSON) 로드됨");
}

  renderVersion();
  renderTypes();
  toast(`${state.orgMeta.name} 템플릿 로드됨`);
}

function tick(){ $("nowTime").textContent = fmt(new Date()); }

async function init(){
  state.index = await loadIndex();
  renderOrgSelect();
  bindUI();
  tick();
  setInterval(tick, 20000);

  await loadOrgById(state.orgId);
}
init();
