'use strict';
/* Mobile-only login-first gate. API still applies staff role checks server-side. */
(async function guard(){
  const auth='https://uskemdfbmuilvirqudml.supabase.co/auth/v1';
  const key='sb_publishable_iZEnOA3f0yvz6M5hnTfOvA_sMYS38Oq';
  const fail=()=>location.replace('index.html');
  const access=localStorage.getItem('gaba.resident.access');
  if(!access){fail();return}
  async function who(token){
    try{const r=await fetch(auth+'/user',{headers:{apikey:key,Authorization:'Bearer '+token},cache:'no-store'});
      if(r.status===401||r.status===403)return null;if(!r.ok)throw Error('Sign-in service unavailable');const user=await r.json();return user.email_confirmed_at ? user : null}
    catch(error){throw error}
  }
  let user=await who(access);
  if(!user){
    const refresh=localStorage.getItem('gaba.resident.refresh');
    if(refresh)try{
      const r=await fetch(auth+'/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})});
      if(r.ok){const d=await r.json();localStorage.setItem('gaba.resident.access',d.access_token);localStorage.setItem('gaba.resident.refresh',d.refresh_token);user=await who(d.access_token)}else if(![400,401,403].includes(r.status)){throw Error('Sign-in service unavailable')}
    }catch(error){throw error}
  }
  if(!user){localStorage.removeItem('gaba.resident.access');localStorage.removeItem('gaba.resident.refresh');fail();return}
  document.documentElement.classList.remove('needs-auth');
  window.GABA_VERIFIED_RESIDENT_EMAIL=user.email;
})().catch(()=>location.replace('index.html'));

document.addEventListener('DOMContentLoaded', () => {
  const button=document.getElementById('mobile-logout-button');
  if(!button)return;
  button.addEventListener('click',async()=>{
    button.disabled=true;button.textContent='Signing out…';
    const token=localStorage.getItem('gaba.resident.access');
    if(token)try{await fetch('https://uskemdfbmuilvirqudml.supabase.co/auth/v1/logout',
      {method:'POST',headers:{apikey:'sb_publishable_iZEnOA3f0yvz6M5hnTfOvA_sMYS38Oq',Authorization:'Bearer '+token}})}catch{}
    localStorage.removeItem('gaba.resident.access');
    localStorage.removeItem('gaba.resident.refresh');
    location.replace('index.html');
  });
});
