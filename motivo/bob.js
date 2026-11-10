/* cada BOB abana quando entra no ecra e volta a abanar se voltar a entrar */
(function(){
  var bobs=[].slice.call(document.querySelectorAll('.bob'));
  if(!bobs.length) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!('IntersectionObserver' in window)){ bobs.forEach(function(b){b.classList.add('viva');}); return; }
  var obs=new IntersectionObserver(function(ents){
    ents.forEach(function(e){
      var el=e.target;
      if(e.isIntersecting){
        el.classList.remove('viva');
        void el.offsetWidth;            /* reinicia a animacao */
        setTimeout(function(){ el.classList.add('viva'); }, 260);
      } else {
        el.classList.remove('viva');
      }
    });
  },{threshold:.55});
  bobs.forEach(function(b){ obs.observe(b); });
})();