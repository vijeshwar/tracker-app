let me={};

// chart instances
let dsaChart=null;
let courseChart=null;
let gymChart=null;
let adminDsaChart=null;
let adminGymChart=null;

// ----- UTIL -----
function show(id){
  document.querySelectorAll('.panel')
    .forEach(p=>p.style.display='none');
  const el=document.getElementById(id);
  if(el) el.style.display='block';
}

function forceClear(){
  if(email) email.value="";
  if(pass) pass.value="";
  if(rEmail) rEmail.value="";
  if(rPass) rPass.value="";
}

// ----- LOGIN -----
async function login(){

 const r=await fetch("/tracker/login",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   email:email.value,
   password:pass.value
  })
 });

 email.value=""; pass.value="";

 if(!r.ok) return alert("invalid");

 me=await r.json();

 loginBox.style.display="none";

 if(me.role==="admin"){
   adminBox.style.display="block";
   await loadAdminUsers();
 }else{
   userBox.style.display="block";
   show("dsa");

   loadDSA();
   loadCourse();
   loadGym();
   loadReplies();
   loadHeat();
 }
}

// ----- REGISTER -----
async function register(){
 await fetch("/tracker/register",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   email:rEmail.value,
   password:rPass.value
  })
 });

 rEmail.value=""; 
 rPass.value="";
 alert("created");
}

// ----- DSA -----
async function addDSA(){

 const r=await fetch("/tracker/add/dsa",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   user:me.email,
   topic:dTopic.value,
   count:dCount.value,
   lc:dLc.value
  })
 });

 if(!r.ok) return alert("24h limit");

 dTopic.value=dCount.value=dLc.value="";
 loadDSA();
}

async function loadDSA(){

 const r=await fetch("/tracker/my/"+me.email);
 const d=await r.json();

 if(!window.total) return;

 const nums=d.map(x=>Number(x.count));

 total.innerText="Total: "+nums.reduce((a,b)=>a+b,0);

 if(dsaChart) dsaChart.destroy();

 dsaChart=new Chart(dsaCanvas,{
  type:"line",
  data:{
   labels:d.map(x=>x.date),
   datasets:[{
    label:"DSA",
    data:nums,
    borderColor:"#00c8ff",
    tension:0.2
   }]
  }
 });
}

// ----- COURSE -----
async function addCourse(){

 const r=await fetch("/tracker/add/course",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   user:me.email,
   site:cSite.value,
   name:cName.value,
   mod:cMod.value,
   time:cTime.value
  })
 });

 if(!r.ok) return alert("24h limit");

 cSite.value=cName.value=cMod.value=cTime.value="";
 loadCourse();
}

async function loadCourse(){

 const r=await fetch("/tracker/my/course/"+me.email);
 const d=await r.json();

 if(!window.courseTotal) return;

 courseTotal.innerText=
   "Time: "+d.reduce((s,x)=>s+Number(x.minutes),0)+" mins";

 if(courseChart) courseChart.destroy();

 courseChart=new Chart(courseCanvas,{
  type:"bar",
  data:{
   labels:d.map(x=>x.date+"-"+x.website),
   datasets:[{
    label:"Modules",
    data:d.map(x=>Number(x.modules)),
    backgroundColor:"#00c8ff"
   }]
  }
 });
}

// ----- GYM -----
async function addGym(){

 const r=await fetch("/tracker/add/gym",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   user:me.email,
   went:gWent.checked,
   time:gTime.value
  })
 });

 if(!r.ok) return alert("24h limit");

 gWent.checked=false;
 gTime.value="";
 loadGym();
}

async function loadGym(){

 const r=await fetch("/tracker/my/gym/"+me.email);
 const d=await r.json();

 if(!window.gymStreak) return;

 let streak=0,last=null;

 d.sort((a,b)=>a.date.localeCompare(b.date));

 for(let x of d){
  const day=new Date(x.date);

  if(!last) streak=1;
  else{
   const diff=(day-last)/(1000*60*60*24);
   if(diff<=1&&x.went) streak++;
   else streak=x.went?1:0;
  }
  last=day;
 }

 gymStreak.innerText="🔥 Streak: "+streak;

 if(gymChart) gymChart.destroy();

 gymChart=new Chart(gymCanvas,{
  type:"line",
  data:{
   labels:d.map(x=>x.date),
   datasets:[{
    label:"Minutes",
    data:d.map(x=>x.went?Number(x.minutes):null),
    spanGaps:false,
    borderColor:"#00c8ff"
   }]
  }
 });
}

// ----- FEEDBACK -----
async function sendFeedback(){

 const r=await fetch("/tracker/feedback",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   user:me.email,
   msg:msg.value
  })
 });

 if(!r.ok) return alert("24h limit");

 msg.value="";
 loadReplies();
}

async function loadReplies(){

 const r=await fetch("/tracker/my/feedback/"+me.email);
 const d=await r.json();

 myReplies.innerHTML=d.map(x=>`
 <div class='card'>
  <p>${x.message}</p>
  <b>Reply:</b>
  <p>${x.reply||'Waiting'}</p>
 </div>
 `).join("");
}

// ----- HEATMAP -----
async function loadHeat(){

 const r=await fetch("/tracker/heat/"+me.email);
 const d=await r.json();

 const today=new Date();
 let html="";

 for(let i=30;i>=0;i--){

  const dt=new Date();
  dt.setDate(today.getDate()-i);

  const s=dt.toISOString().slice(0,10);
  const c=d[s]||0;

  html+=`
   <div class='cell'
    style='background:${
      c?`rgba(0,200,255,${c/3})`:'#111'
    }'>
    ${s.slice(5)}
   </div>`;
 }

 heatmap.innerHTML=html;
}

// ----- ADMIN -----
async function loadAdminUsers(){

 const r=await fetch("/tracker/admin/users");
 const u=await r.json();

 uSelect.innerHTML=
  u.map(x=>`<option>${x}</option>`).join("");

 await loadAdminUser();
}
async function loadAdminUser(){

 const r = await fetch("/tracker/admin/user/" + uSelect.value);
 const d = await r.json();

 // -------- TEXT INFO --------
 adminView.innerHTML = `

 <h3>${uSelect.value}</h3>

 <p>DSA Total:
 ${d.dsa.reduce((s,x)=>s+Number(x.count),0)}</p>

 <p>Gym Days:
 ${d.gym.filter(x=>x.went).length}</p>

 <h4>Course Progress</h4>

 <div class="card">
   ${d.course.map(c=>`
     <div style="border-bottom:1px solid #333;margin:6px;padding:4px">
       <b>${c.website}</b> – ${c.course}<br>
       Modules: ${c.modules} | Minutes: ${c.minutes}<br>
       Date: ${c.date}
     </div>
   `).join("")}
 </div>

 <h4>Feedback</h4>

 ${d.fb.map(f=>`
  <div class='card'>
   <p>${f.message}</p>

   <input id='r${f.id}'>
   <button onclick='reply(${f.id})'>reply</button>

   <small>${f.reply||''}</small>
  </div>
 `).join("")}
 `;

 // -------- DSA CHART --------
 if(adminDsaChart) adminDsaChart.destroy();

 adminDsaChart = new Chart(adminDsaCanvas,{
  type:"line",
  data:{
   labels:d.dsa.map(x=>x.date),
   datasets:[{
    label:"DSA",
    data:d.dsa.map(x=>Number(x.count)),
    borderColor:"#00c8ff"
   }]
  }
 });

 // -------- GYM CHART --------
 if(adminGymChart) adminGymChart.destroy();

 adminGymChart = new Chart(adminGymCanvas,{
  type:"line",
  data:{
   labels:d.gym.map(x=>x.date),
   datasets:[{
    label:"Gym",
    data:d.gym.map(x=>x.went?Number(x.minutes):null),
    spanGaps:false,
    borderColor:"#00c8ff"
   }]
  }
 });

 // -------- COURSE CHART (NEW) --------

 // create dynamic canvas if not exists
 if(!document.getElementById("adminCourseCanvas")){
   const c = document.createElement("canvas");
   c.id = "adminCourseCanvas";
   adminView.appendChild(c);
 }

 const courseByDay = {};

 d.course.forEach(c=>{
   courseByDay[c.date] =
     (courseByDay[c.date] || 0) + Number(c.modules);
 });

 const labels = Object.keys(courseByDay);
 const values = Object.values(courseByDay);

 if(window.adminCourseChart)
   adminCourseChart.destroy();

 window.adminCourseChart = new Chart(adminCourseCanvas,{
  type:"bar",
  data:{
   labels: labels,
   datasets:[{
    label:"Modules per Day",
    data: values,
    backgroundColor:"#00c8ff"
   }]
  }
 });

}



