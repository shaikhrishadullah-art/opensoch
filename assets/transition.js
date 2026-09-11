/* Opensoch — arrival transition and the way back to the brain.
 *
 * The home page dives into a region on click: it scales the tile grid up out
 * of the clicked tile until that region's colour fills the screen, then
 * navigates with ?from=<region>&x=&y=. This picks the thread back up — the
 * section opens out of the same flat colour, which breaks into big tiles and
 * clears outward from the exact point that was clicked. Same material as the
 * preloader, so the two halves of the site feel like one thing.
 *
 * Drop into any page:
 *   <body data-region="tl">                       tl|tr|bl|br
 *   <link rel="stylesheet" href="/assets/transition.css">
 *   <script src="/assets/transition.js" defer></script>
 *   <a href="/" data-home>…</a>                   any link back to the brain
 */
(function(){
  const COLOUR={tl:'--purple', tr:'--blue', bl:'--red', br:'--yellow'};
  const q=new URLSearchParams(location.search);
  const region=document.body.dataset.region;

  /* Links home carry this page's region, so the brain opens on the closed
     colour state instead of replaying its load sequence. */
  document.querySelectorAll('a[data-home]').forEach(a=>{
    a.setAttribute('href', region && COLOUR[region] ? '/?from='+region : '/');
  });

  const from=q.get('from');
  if(!from || !COLOUR[from]) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ clean(); return; }

  /* the point the user actually clicked, so the opening is where they went in */
  const fx=Math.min(1,Math.max(0, parseFloat(q.get('x'))||0.5));
  const fy=Math.min(1,Math.max(0, parseFloat(q.get('y'))||0.5));

  const wrap=document.createElement('div');
  wrap.id='arrival';
  wrap.style.setProperty('--arrive',
    getComputedStyle(document.documentElement).getPropertyValue(COLOUR[from]).trim() || '#000');

  const COLS=14;
  const cw=100/COLS;
  const rows=Math.max(1, Math.ceil(COLS*innerHeight/innerWidth));
  const rh=100/rows;
  const cells=[];
  let far=0;
  for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){
    const d=Math.hypot((c+0.5)/COLS-fx, (r+0.5)/rows-fy);
    if(d>far) far=d;
    cells.push({c,r,d});
  }
  for(const {c,r,d} of cells){
    const i=document.createElement('i');
    i.style.cssText=`left:${c*cw}%;top:${r*rh}%;width:${cw+0.05}%;height:${rh+0.05}%;`+
                    `transition-delay:${Math.round((d/far)*460)}ms`;
    wrap.appendChild(i);
  }
  document.body.appendChild(wrap);

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    wrap.classList.add('go');
    setTimeout(()=>wrap.remove(), 1000);
  }));
  clean();

  /* drop the transition parameters so a refresh is just the page */
  function clean(){ history.replaceState(null,'',location.pathname); }
})();
