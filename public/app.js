let me={};

function show(id){
 document.querySelectorAll('.panel')
  .forEach(p=>p.style.display='none');
 const el=document.getElementById(id);
 if(el) el.style.display='block';
}

/* LOGIN */
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

 if(!r.ok) return alert("invalid login");

 me=await r.json();

 loginBox.style.display="none";

 if(me.role==="admin"){
  adminBox.style.display="block";
  loadAdminUsers();
 }else{
  userBox.style.display="block";
  show("dsa");
  loadDSA(); loadCourse(); loadGym(); loadReplies();
 }
}

/* REGISTER */
async function register(){
 await fetch("/tracker/register",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
   email:rEmail.value,
   password:rPass.value
  })
 });

 rEmail.value=""; rPass.value="";
 alert("account created");
}

/* DSA */
async function loadDSA(){
 const r=await fetch("/tracker/dsa/"+me.email);
 const d=await r.json();

 total.innerText="Total: "+
  d.reduce((s,x)=>s+Number(x.count),0);

 new Chart(dsaCanvas,{
  type:"line",
  data:{
   labels:d.map(x=>x.date),
   datasets:[{
    label:"DSA",
    data:d.map(x=>x.count),
    borderColor:"#00c8ff"
   }]
  }
 });
}

/* COURSE */
async function loadCourse(){
 const r=await fetch("/tracker/course/"+me.email);
 const d=await r.json();

 new Chart(courseCanvas,{
  type:"bar",
  data:{
   labels:d.map(x=>x.date),
   datasets:[{
    label:"Modules",
    data:d.map(x=>x.modules),
    backgroundColor:"#00c8ff"
   }]
  }
 });
}

/* GYM */
async function loadGym(){
 const r=await fetch("/tracker/gym/"+me.email);
 const d=await r.json();

 gymStreak.innerText=
  "Days: "+d.filter(x=>x.went).length;

 new Chart(gymCanvas,{
  type:"line",
  data:{
   labels:d.map(x=>x.date),
   datasets:[{
    label:"Gym",
    data:d.map(x=>x.went?x.minutes:null),
    spanGaps:false,
    borderColor:"#00c8ff"
   }]
  }
 });
}

/* FEEDBACK */
async function loadReplies(){
 const r=await fetch("/tracker/fb/"+me.email);
 const d=await r.json();

 replies.innerHTML=d.map(x=>
  `<div class='card'>
     ${x.message}<br>
     <small>${x.reply||''}</small>
   </div>`
 ).join("");
}

/* ADMIN */
async function loadAdminUsers(){
 const r=await fetch("/tracker/admin/users");
 const d=await r.json();

 uSelect.innerHTML=
  d.map(u=>`<option>${u.username}</option>`).join("");
}
