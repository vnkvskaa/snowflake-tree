/* Конструктор подарков: сборка подарка из конфига {s:форма,p:бумага,t:узор,tc:цвет узора,r:лента,rc:цвет ленты} */
var GC=(function(){
  var GW=508,GH=396,PD=635;
  var SHAPES=[['cube','Куб'],['tall','Высокая'],['wide','Плоская']];
  var RIBS=[['w','Лента'],['b','Бант'],['','Без ленты']];
  function ribList(){return RIBS}
  var PATS=[['','Без узора'],['str','Полоски'],['dot','Горошек'],['star','Звёзды'],['fir','Ёлочки'],['flk','Снежинки']];
  var PAPERN=['Пудровая','Шалфей','Персик','Небесная','Молочная','Розовая','Лаванда','Ваниль'];
  var INKN=['Белый','Сливочный','Коралл','Голубой','Мятный','Золотой'];
  var RIBCN=['Сливочная','Белая','Коралловая','Мятная','Золотая','Голубая','Сиреневая'];
  var PAPER=['#EBAFA3','#A5C6A6','#F2CD9A','#A6C0E0','#F3E9D6','#EDBFCB','#C0B1DA','#F4E0A6'];
  var INK=['#FFFFFF','#F7EDD5','#DE8F84','#86A4CE','#8DB594','#E3BC68'];
  var RIBC=['#F7EDD5','#FFFFFF','#E39A8F','#97BFA0','#E8C57A','#9DB6DA','#C3A9CF'];
  var cache={};
  function hex(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]}
  function load(n){
    return cache[n]||(cache[n]=new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=function(){rej(n)};i.src=n+'.webp'}));
  }
  function data(n,kind){
    var k='d:'+n;
    return cache[k]||(cache[k]=load(n).then(function(im){
      var c=document.createElement('canvas');c.width=GW;c.height=GH;var x=c.getContext('2d');
      if(kind==='pat'){x.drawImage(im,(GW-PD)/2,(GH-PD)/2+10,PD,PD)}else{x.drawImage(im,0,0,GW,GH)}
      try{return x.getImageData(0,0,GW,GH).data}catch(e){return null}
    }));
  }
  var LIGHT={'#F3E9D6':1,'#F4E0A6':1,'#F2CD9A':1};
  function autoInk(p){return LIGHT[p]?'#DE8F84':'#FFFFFF'}
  function rnd(a){return a[Math.floor(Math.random()*a.length)]}
  function randomCfg(){
    var t=rnd(PATS.filter(function(x){return x[0]}))[0];
    var p=rnd(PAPER);
    return {s:rnd(SHAPES)[0],p:p,t:t,r:rnd(RIBS.filter(function(x){return x[0]}))[0],rc:rnd(RIBC)};
  }
  /* возвращает Promise<canvas> размером GW×GH */
  function render(cfg){
    cfg=cfg||{};
    var shp=cfg.s||'cube',rib=cfg.r||'',pat=cfg.t||'';if(rib&&rib!=='b')rib='w';
    var jobs=[data('gb_'+shp)];
    if(pat)jobs.push(data('gp_'+pat,'pat'));else jobs.push(null);
    if(rib)jobs.push(data('gr_'+rib+'_'+shp));else jobs.push(null);
    return Promise.all(jobs).then(function(d){
      if(!d[0])throw 0;
      var B=d[0],P=d[1],R=d[2];
      var c=document.createElement('canvas');c.width=GW;c.height=GH;
      var x=c.getContext('2d');var out=x.createImageData(GW,GH);var o=out.data;
      var pc=hex(cfg.p||'#D4483F'),tc=hex(cfg.tc||autoInk(cfg.p)),rc=hex(cfg.rc||'#F4EAD2');
      var n=GW*GH,i,j,s,ba,m,r,g,b,ra,sr,rr,gg,bb,ao,x0=GW,y0=GH,x1=0,y1=0,px,py;
      for(i=0;i<n;i++){
        j=i*4;ba=B[j+3];
        if(ba===0&&(!R||R[j+3]===0))continue;
        r=g=b=0;ao=0;
        if(ba>0){
          s=B[j]/255*1.12;
          r=pc[0];g=pc[1];b=pc[2];
          if(P){m=P[j]/255*(P[j+3]/255);if(m>0){r+= (tc[0]-r)*m;g+=(tc[1]-g)*m;b+=(tc[2]-b)*m}}
          r*=s;g*=s;b*=s;ao=ba/255;
        }
        if(R){
          ra=R[j+3]/255;
          if(ra>0){
            sr=R[j]/255*1.12;rr=rc[0]*sr;gg=rc[1]*sr;bb=rc[2]*sr;
            var na=ra+ao*(1-ra);
            r=(rr*ra+r*ao*(1-ra))/na;g=(gg*ra+g*ao*(1-ra))/na;b=(bb*ra+b*ao*(1-ra))/na;ao=na;
          }
        }
        o[j]=r>255?255:r;o[j+1]=g>255?255:g;o[j+2]=b>255?255:b;o[j+3]=ao*255;
        if(ao>.05){px=i%GW;py=(i/GW)|0;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py}
      }
      x.putImageData(out,0,0);
      c.bb=[x0,y0,x1+1,y1+1];
      return c;
    });
  }
  /* маленькая картинка (dataURL) для вставки в SVG/img */
  function url(cfg,w){
    return render(cfg).then(function(c){
      var b=c.bb||[0,0,GW,GH],bw=b[2]-b[0],bh=b[3]-b[1];
      w=w||bw;var h=Math.max(1,Math.round(w*bh/bw));var t=document.createElement('canvas');t.width=w;t.height=h;
      var x=t.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,b[0],b[1],bw,bh,0,0,w,h);
      return {src:t.toDataURL('image/png'),ar:bw/bh};
    });
  }
  /* заранее подгружаем и раскладываем все слои, чтобы переключение не ждало сеть */
  var pre=false;
  function preload(){
    if(pre)return;pre=true;
    var q=[];
    SHAPES.forEach(function(s){q.push(['gb_'+s[0]]);RIBS.forEach(function(r){if(r[0])q.push(['gr_'+r[0]+'_'+s[0]])})});
    PATS.forEach(function(p){if(p[0])q.push(['gp_'+p[0],'pat'])});
    (function next(){
      var it=q.shift();if(!it)return;
      data(it[0],it[1]).then(function(){setTimeout(next,30)},function(){setTimeout(next,30)});
    })();
  }
  return {preload:preload,PAPERN:PAPERN,INKN:INKN,RIBCN:RIBCN,SHAPES:SHAPES,RIBS:RIBS,ribList:ribList,PATS:PATS,PAPER:PAPER,INK:INK,RIBC:RIBC,GW:GW,GH:GH,render:render,url:url,random:randomCfg};
})();
