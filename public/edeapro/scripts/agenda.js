const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WD     = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const STEPS  = ["Servicios","Peluquero","Fecha","Confirmar"];

let CATS     = [];
let SVCS     = {};
let GROOMERS = [];
let ADICIONALES = [];

let S = {
  step:1, cat:null, sel:{}, adicionales:{},
  groomer:null, yr:2026, mo:3,
  date:null, slot:null, mascota:null, done:false
};

let MASCOTAS = [];

const $   = id => document.getElementById(id);
const fmt = n  => "$" + Number(n).toLocaleString("es-CO");
const sumP = () => Object.values(S.sel).reduce((a,s)=>a+Number(s.precio),0) +
                   Object.values(S.adicionales).reduce((a,s)=>a+Number(s.precio_adicional),0);
const sumD = () => Object.values(S.sel).reduce((a,s)=>a+parseInt(s.duracion),0) +
                   Object.values(S.adicionales).reduce((a,s)=>a+20,0);
const durL = m => m >= 60
  ? `${Math.floor(m/60)} h${m%60?" "+m%60+" min":""}`
  : m + " min";

function canGo(){
  if(S.step===1) return Object.keys(S.sel).length > 0;
  if(S.step===2) return S.groomer !== null;
  if(S.step===3) return S.date && S.slot;
  return true;
}

function togSvc(id){
  if(S.sel[id]) delete S.sel[id];
  else {
    const svc = Object.values(SVCS).flat().find(x=>x.id_raza==id);
    if(svc) S.sel[id] = svc;
  }
}

function togAdicional(id){
  if(S.adicionales[id]) delete S.adicionales[id];
  else {
    const ad = ADICIONALES.find(x=>x.id_adicional==id);
    if(ad) S.adicionales[id] = ad;
  }
}

/**
 * Horarios del paso 3. Laravel devuelve los horarios en los que el
 * estilista está libre durante TODA la duración del servicio y la cita
 * termina antes de las 5:00 PM (misma lógica que usa el reagendamiento).
 * Aquí se muestran todos los inicios posibles de 9:00 hasta (17:00 − duración),
 * marcando como ocupados los que no vinieron en esa lista y, si la fecha
 * es hoy, los que ya pasaron.
 */
async function genSlots(){
  const dur = sumD() || 60;
  let disponibles = [];

  if (S.groomer !== null && S.date) {
    try {
      const res  = await fetch(`${API_BASE}/api/citas/slots?id_estilista=${S.groomer}&fecha=${S.date}&duracion=${dur}`);
      const data = await res.json();
      if (data.ok) disponibles = data.disponibles;
    } catch(e) {}
  }

  // Si la fecha elegida es hoy, las horas que ya pasaron tampoco se pueden reservar
  const tn        = new Date();
  const esHoy     = S.date === `${tn.getDate()}/${tn.getMonth()+1}/${tn.getFullYear()}`;
  const minutosYa = tn.getHours()*60 + tn.getMinutes();

  const out = [];
  for(let inicio = 9*60; inicio + dur <= 17*60; inicio += 15){
    const label  = `${String(Math.floor(inicio/60)).padStart(2,"0")}:${String(inicio%60).padStart(2,"0")}`;
    const yaPaso = esHoy && inicio <= minutosYa;
    out.push({label, ocupado: !disponibles.includes(label) || yaPaso});
  }
  return out;
}

function render(){
  if(S.done){ renderDone(); return; }
  renderStepper();
  const fns = [,renderStep1,renderStep2,renderStep3,renderStep4];
  fns[S.step]();
}

function renderStepper(){
  $("stepper").innerHTML = STEPS.map((n,i)=>{
    const num = i+1;
    const cls = S.step===num?"active":S.step>num?"done":"";
    const ln  = S.step>num?"done":"";
    const ico = S.step>num
      ? `<svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
      : num;
    return `<div class="st-item"><div class="st-dot ${cls}">${ico}</div></div>
            ${i<3?`<div class="st-line ${ln}"></div>`:""}`;
  }).join("");
}

function renderStep1(){
  const items     = Object.values(S.sel);
  const adItems   = Object.values(S.adicionales);
  const cat       = S.cat || CATS[0];

  const esAdicional = cat === "Adicionales";
  const lista = esAdicional
    ? ADICIONALES.map(a => {
        const on = !!S.adicionales[a.id_adicional];
        return `<div class="svc-tile ${on?"on":""}" data-adid="${a.id_adicional}">
          <div class="svc-body">
            <strong>${a.nombre_adicional}</strong>
            <div class="meta">~20 min</div>
            <div class="price">${fmt(a.precio_adicional)}</div>
          </div>
          <div class="svc-check">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polyline points="2,6 5,9 10,3" stroke="#050505" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>`;
      }).join("")
    : (SVCS[cat]||[]).map(s=>{
        const on = !!S.sel[s.id_raza];
        return `<div class="svc-tile ${on?"on":""}" data-id="${s.id_raza}">
          <div class="svc-body">
            <strong>${s.nombre_raza}</strong>
            <div class="meta">${s.duracion}</div>
            <div class="price">${fmt(s.precio)}</div>
          </div>
          <div class="svc-check">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polyline points="2,6 5,9 10,3" stroke="#050505" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>`;
      }).join("");

  $("main").innerHTML = `
    <div>
      <div class="sec-eyebrow">Paso 1 de 4</div>
      <div class="sec-title">¿Qué necesita tu mascota?</div>
      <div class="sec-sub">Selecciona uno o más servicios. Los tiempos se acumulan automáticamente.</div>
    </div>
    <div class="svc-layout">
      <div style="flex:1">
        <div class="race-tabs">
          ${CATS.map(c=>`<button class="rtab ${c===cat?"on":""}" data-c="${c}">${c}</button>`).join("")}
        </div>
        <div class="svc-list">${lista}</div>
      </div>
      <div class="basket">
        <div class="basket-title">Tu selección</div>
        ${items.length===0 && adItems.length===0
          ? `<div class="basket-empty">Ningún servicio<br>seleccionado aún</div>`
          : `<div class="basket-items">
               ${items.map(s=>`
                 <div class="b-item">
                   <span class="bn">${s.nombre_raza}</span>
                   <span class="bp">${fmt(s.precio)}</span>
                 </div>
                 <div class="b-dur-row"><span></span><span>${s.duracion}</span></div>`).join("")}
               ${adItems.map(a=>`
                 <div class="b-item">
                   <span class="bn">${a.nombre_adicional}</span>
                   <span class="bp">${fmt(a.precio_adicional)}</span>
                 </div>`).join("")}
             </div>
             <div class="b-divider"></div>
             <div class="b-total"><span>Total</span><span>${fmt(sumP())}</span></div>
             <div class="b-total-dur">Duración total: ${durL(sumD())}</div>`
        }
        <button class="btn-go" id="bgo" ${canGo()?"":"disabled"}>Elegir peluquero →</button>
      </div>
    </div>`;

  document.querySelectorAll(".rtab").forEach(b=>b.onclick=()=>{S.cat=b.dataset.c;render()});
  document.querySelectorAll(".svc-tile[data-id]").forEach(t=>t.onclick=()=>{togSvc(t.dataset.id);render()});
  document.querySelectorAll(".svc-tile[data-adid]").forEach(t=>t.onclick=()=>{togAdicional(t.dataset.adid);render()});
  $("bgo").onclick=()=>{S.step=2;render()};
}

function renderStep2(){
  // Si no hay peluqueros disponibles, mostramos un aviso
  const listHtml = GROOMERS.length === 0 
    ? `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--muted);">No hay peluqueros disponibles con los criterios actuales.</div>`
    : GROOMERS.map(g=>`
        <div class="grm-tile ${S.groomer===g.id?"picked":""}" data-gid="${g.id}">
          <div class="grm-av">${g.init}</div>
          <div class="grm-info">
            <div class="grm-name">${g.name}</div>
            <div class="grm-spec">${g.spec}</div>
          </div>
          <div class="grm-radio"><div class="grm-radio-dot"></div></div>
        </div>`).join("");

  $("main").innerHTML = `
    <div>
      <div class="sec-eyebrow">Paso 2 de 4</div>
      <div class="sec-title">¿Con quién prefieres?</div>
      <div class="sec-sub">Elige al peluquero de tu preferencia.</div>
    </div>
    <div class="grm-list">
      ${listHtml}
    </div>
    <div class="actions">
      <button class="btn-sec" id="bbk">← Volver</button>
      <button class="btn-primary" id="bgo" ${canGo()?"":"disabled"}>Elegir fecha →</button>
    </div>`;

  document.querySelectorAll(".grm-tile").forEach(t=>{
    t.onclick=()=>{
      S.groomer=parseInt(t.dataset.gid);
      render();
    }
  });
  $("bbk").onclick=()=>{S.step=1;render()};
  $("bgo").onclick=()=>{S.step=3;render()};
}

async function renderStep3(){
  const {yr:y,mo:m} = S;
  const first = new Date(y,m,1).getDay();
  const total = new Date(y,m+1,0).getDate();
  const tn    = new Date();

  let cells = "";
  for(let i=0;i<first;i++) cells+=`<div class="cal-d emp"></div>`;
  for(let d=1;d<=total;d++){
    const dt   = new Date(y,m,d);
    const past = dt < new Date(tn.getFullYear(),tn.getMonth(),tn.getDate());
    const sun  = dt.getDay()===0;
    const ds   = `${d}/${m+1}/${y}`;
    const sel  = S.date===ds;
    const tod  = d===tn.getDate()&&m===tn.getMonth()&&y===tn.getFullYear();
    cells += `<div class="cal-d ${past||sun?"dis":""} ${sel?"sel":""} ${tod&&!sel?"tod":""}" data-d="${d}">${d}</div>`;
  }

  const mySlots= S.date ? await genSlots() : [];
  const g = GROOMERS.find(x=>x.id===S.groomer);

  $("main").innerHTML = `
    <div>
      <div class="sec-eyebrow">Paso 3 de 4</div>
      <div class="sec-title">¿Cuándo quieres la cita?</div>
      <div class="sec-sub">Horarios para <strong>${g?g.name:"cualquier peluquero"}</strong>. Duración aprox: <strong>${durL(sumD())}</strong></div>
    </div>
    <div class="cal-section">
      <div class="cal-box">
        <div class="cal-nav">
          <button class="cal-arr" id="pmb">‹</button>
          <span class="cal-month">${MONTHS[m]} ${y}</span>
          <button class="cal-arr" id="nmb">›</button>
        </div>
        <div class="cal-grid">
          ${WD.map(d=>`<div class="cal-dh">${d}</div>`).join("")}
          ${cells}
        </div>
      </div>
      <div class="slots-box">
        ${S.date
          ? `<div class="slots-label">Horarios — ${S.date}</div>
             <div class="slots-sublabel">Cada bloque reserva ${durL(sumD())}</div>
             <div class="slots-grid">
               ${mySlots.map(s=>`
                 <button class="slot-pill ${s.ocupado?"tk":""} ${S.slot===s.label&&!s.ocupado?"picked":""}"
                   data-s="${s.label}" ${s.ocupado?"disabled":""}>${formatoHora12(s.label)}</button>`).join("")}
             </div>`
          : `<div class="slots-empty">Selecciona primero un día en el calendario.</div>`
        }
      </div>
    </div>
    <div class="actions">
      <button class="btn-sec" id="bbk">← Volver</button>
      <button class="btn-primary" id="bgo" ${canGo()?"":"disabled"}>Revisar cita →</button>
    </div>`;

  $("pmb").onclick=()=>{S.mo===0?(S.mo=11,S.yr--):(S.mo--);S.date=null;S.slot=null;render()};
  $("nmb").onclick=()=>{S.mo===11?(S.mo=0,S.yr++):(S.mo++);S.date=null;S.slot=null;render()};
  document.querySelectorAll(".cal-d:not(.dis):not(.emp)").forEach(d=>d.onclick=()=>{
    S.date=`${d.dataset.d}/${S.mo+1}/${S.yr}`; S.slot=null; render();
  });
  document.querySelectorAll(".slot-pill:not(.tk)").forEach(b=>b.onclick=()=>{S.slot=b.dataset.s;render()});
  $("bbk").onclick=()=>{S.step=2;render()};
  $("bgo").onclick=()=>{S.step=4;render()};
}

async function renderStep4(){
  const items   = Object.values(S.sel);
  const adItems = Object.values(S.adicionales);
  const g = GROOMERS.find(x=>x.id===S.groomer);
  const user = JSON.parse(localStorage.getItem('user'));

  // ¿Para cuál mascota es la cita? Solo se puede saber si hay sesión de cliente.
  let mascotaHtml = "";
  if (user && user.id_cliente) {
    try {
      const res  = await fetchAuth(`${API_BASE}/api/cliente/mascotas?id_cliente=${user.id_cliente}`);
      const data = await res.json();
      MASCOTAS = (data.ok && data.mascotas) ? data.mascotas : [];
    } catch(e) { MASCOTAS = []; }

    if (MASCOTAS.length > 0) {
      // Mantener la selección previa si sigue siendo válida; si no, usar la primera
      if (!MASCOTAS.some(m => m.id_mascota === S.mascota)) {
        S.mascota = MASCOTAS[0].id_mascota;
      }
      mascotaHtml = `
        <div class="cc-row">
          <span class="cc-lbl">Mascota</span>
          <span class="cc-val">
            <select id="mascotaSel">
              ${MASCOTAS.map(m=>`<option value="${m.id_mascota}" ${m.id_mascota===S.mascota?"selected":""}>${m.nombre} (${m.especie})</option>`).join("")}
            </select>
          </span>
        </div>`;
    } else {
      S.mascota = null;
      mascotaHtml = `<div class="cc-row"><span class="cc-lbl">Mascota</span><span class="cc-val">No tienes mascotas registradas</span></div>`;
    }
  }

  $("main").innerHTML = `
    <div>
      <div class="sec-eyebrow">Paso 4 de 4</div>
      <div class="sec-title">Revisa y confirma</div>
      <div class="sec-sub">Verifica los detalles antes de agendar.</div>
    </div>
    <div class="confirm-layout">
      <div class="confirm-card">
        <div class="cc-head">Resumen de la cita</div>
        ${mascotaHtml}
        ${items.map(s=>`
          <div class="cc-row">
            <span class="cc-lbl">${s.nombre_raza}</span>
            <span class="cc-val">${fmt(s.precio)} · ${s.duracion}</span>
          </div>`).join("")}
        ${adItems.map(a=>`
          <div class="cc-row">
            <span class="cc-lbl">${a.nombre_adicional}</span>
            <span class="cc-val">${fmt(a.precio_adicional)}</span>
          </div>`).join("")}
        <div class="cc-row"><span class="cc-lbl">Peluquero</span><span class="cc-val">${g?g.name:"Cualquier disponible"}</span></div>
        <div class="cc-row"><span class="cc-lbl">Fecha</span><span class="cc-val">${S.date}</span></div>
        <div class="cc-row"><span class="cc-lbl">Hora</span><span class="cc-val">${formatoHora12(S.slot)}</span></div>
        <div class="cc-row"><span class="cc-lbl">Duración aprox.</span><span class="cc-val">${durL(sumD())}</span></div>
        <div class="cc-row"><span class="cc-lbl">Total</span><span class="cc-val">${fmt(sumP())}</span></div>
      </div>
    </div>
    <div class="actions">
      <button class="btn-sec" id="bbk">← Volver</button>
      <button class="btn-primary" id="bgo">Confirmar cita</button>
    </div>`;

  if ($("mascotaSel")) $("mascotaSel").onchange = e => { S.mascota = parseInt(e.target.value); };

  $("bbk").onclick=()=>{S.step=3;render()};
  $("bgo").onclick=()=>{
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id_cliente) {
        alert('Debes iniciar sesión para confirmar la cita');
        window.location.href = 'login.html';
        return;
    }
    if (!S.mascota) {
        alert('Selecciona para cuál mascota es esta cita (o regístrala primero en tu perfil).');
        return;
    }
    const id_cliente = user.id_cliente;

    fetchAuth('${API_BASE}/api/citas/crear', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        accion:      'crear',
        id_cliente:  id_cliente,
        id_mascota:  S.mascota,
        id_estilista: S.groomer,
        fecha:        S.date,
        hora:         S.slot,
        servicios:    JSON.stringify(Object.keys(S.sel)),
        adicionales:  JSON.stringify(Object.keys(S.adicionales))
      })
    })
    .then(r=>r.json())
    .then(data=>{
      if(data.ok){ S.done=true; render(); }
      else alert("Error al agendar: " + data.error);
    })
    .catch(err=>alert("Error: " + err.message));
  };
}

function renderDone(){
  const g = GROOMERS.find(x=>x.id===S.groomer);
  $("stepper").innerHTML="";
  $("main").innerHTML=`
    <div class="success-wrap">
      <span class="success-paw">🐾</span>
      <div class="success-title">¡Cita confirmada!</div>
      <div class="success-sub">Tu cita en <strong>Edea Grooming</strong> quedó agendada.</div>
      <div class="success-detail">
        <span><span class="sd-lbl">Peluquero</span><span class="sd-val">${g?g.name:"Cualquier disponible"}</span></span>
        <span><span class="sd-lbl">Fecha</span><span class="sd-val">${S.date} · ${formatoHora12(S.slot)}</span></span>
        <span><span class="sd-lbl">Total</span><span class="sd-val">${fmt(sumP())}</span></span>
      </div>
      <button class="btn-nueva" onclick="resetApp()">Agendar otra cita</button>
    </div>`;
}

function resetApp(){
  S={step:1,cat:null,sel:{},adicionales:{},groomer:null,yr:2026,mo:3,date:null,slot:null,mascota:null,done:false};
  render();
}

async function iniciar(){
  try {
    const [resSvcs, resAds, resGrm] = await Promise.all([
      fetch('${API_BASE}/api/citas/servicios').then(r=>r.json()),
      fetch('${API_BASE}/api/citas/adicionales').then(r=>r.json()),
      fetch('${API_BASE}/api/citas/estilistas').then(r=>r.json())
    ]);

    SVCS = {};
    resSvcs.servicios.forEach(s => {
      if(!SVCS[s.nombre_servicio]) SVCS[s.nombre_servicio] = [];
      SVCS[s.nombre_servicio].push(s);
    });
    CATS = Object.keys(SVCS);
    CATS.push("Adicionales");
    S.cat = CATS[0];

    ADICIONALES = resAds.adicionales;

    // --- ARREGLO PARA ESTILISTAS ---
    GROOMERS = [];
    if (resGrm.estilistas && resGrm.estilistas.length > 0) {
      // Solo agregamos "Cualquier" si hay alguien activo
      GROOMERS.push({id:0, init:"?", name:"Cualquier peluquero", spec:"El sistema asigna según disponibilidad"});
      resGrm.estilistas.forEach(e => {
        GROOMERS.push({
          id:   parseInt(e.id_estilista),
          init: e.nombre_estilista[0] + e.apellido_estilista[0],
          name: e.nombre_estilista + " " + e.apellido_estilista,
          spec: "Peluquero profesional"
        });
      });
    }
    // --------------------------------

    render();
  } catch(e) {
    alert("Error cargando datos: " + e.message);
  }
}

iniciar();
