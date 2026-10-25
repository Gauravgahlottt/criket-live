const HTML = `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cricket Live Score</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#101827;color:#fff;font-family:Arial,sans-serif;padding:20px}
main{max-width:850px;margin:auto}
h1{color:#ffb224;text-align:center}
button{background:#f59e0b;color:#111827;border:0;border-radius:8px;padding:12px 18px;font-weight:bold;cursor:pointer}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;margin:12px 0}
.muted{color:#cbd5e1}
</style>
</head>
<body>
<main>
<h1>🏏 Cricket Live Score</h1>
<p class="muted">Live cricket matches and scores</p>
<button onclick="loadScores()">Refresh Scores</button>
<div id="status" class="card">Loading matches...</div>
<div id="matches"></div>
</main>
<script>
async function loadScores(){
 const status=document.getElementById('status');
 const matches=document.getElementById('matches');
 status.textContent='Loading matches...';
 matches.replaceChildren();
 try{
  const response=await fetch('/api/matches');
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||'Request failed');
  const items=data.data;
  if(!Array.isArray(items)||items.length===0){
   status.textContent='No matches returned by the API.';
   return;
  }
  status.textContent='Matches loaded: '+items.length;
  items.forEach(match=>{
   const card=document.createElement('div');
   card.className='card';
   const title=document.createElement('h3');
   title.textContent=match.name||match.title||'Cricket Match';
   const detail=document.createElement('p');
   detail.className='muted';
   detail.textContent=match.status||'Status unavailable';
   const score=document.createElement('p');
   score.textContent=Array.isArray(match.score)
    ? match.score.map(s=>
      (s.inning||'')+': '+(s.r||0)+'/'+(s.w||0)+
      ' ('+(s.o||0)+' overs)'
     ).join(' | ')
    : '';
   card.append(title,detail,score);
   matches.appendChild(card);
  });
 }catch(error){
  status.textContent='Error: '+error.message;
 }
}
loadScores();
</script>
</body>
</html>`;

export default {
 async fetch(request, env) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
   return new Response(null, {
    status: 204,
    headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type'
    }
   });
  }

  if (url.pathname === '/api/matches') {
   if (!env.CRICKETDATA_API_KEY) {
    return Response.json({
     error: 'API key missing. Set CRICKETDATA_API_KEY in Cloudflare Secrets.'
    }, {status: 500});
   }

   try {
    const apiUrl = new URL(
     'https://api.cricapi.com/v1/currentMatches'
    );
    apiUrl.searchParams.set('apikey', env.CRICKETDATA_API_KEY);
    apiUrl.searchParams.set('offset', '0');

    const apiResponse = await fetch(apiUrl.toString());
    const data = await apiResponse.json();

    if (!apiResponse.ok || data.status === 'failure') {
     return Response.json({
      error: data.reason || data.message || 'Cricket API request failed'
     }, {status: 502});
    }

    return Response.json(data, {
     headers: {'Cache-Control': 'no-store'}
    });
   } catch (error) {
    return Response.json({
     error: 'Could not contact cricket API.'
    }, {status: 502});
   }
  }

  if (url.pathname === '/api/health') {
   return Response.json({
    ok: true,
    service: 'Cricket Live Score'
   });
  }

  return new Response(HTML, {
   headers: {'Content-Type': 'text/html; charset=UTF-8'}
  });
 }
};
