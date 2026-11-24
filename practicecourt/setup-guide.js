for(const button of document.querySelectorAll('[data-setup]'))button.addEventListener('click',()=>{
 for(const b of document.querySelectorAll('[data-setup]'))b.setAttribute('aria-pressed',String(b===button));
 const device=button.dataset.setup;
 document.getElementById('setupPicture').src='setup-'+device+'.svg';
 document.getElementById('setupFullSize').href='setup-'+device+'.svg';
 document.getElementById('setupPicture').alt=({phone:'Phone on a stable stand facing a player, with full-body preview',tablet:'Tablet secured in a case or mount facing a player, with full-body preview',laptop:'Laptop on a stable table tilted to frame a player, with full-body preview'})[device];
 document.getElementById('deviceAdvice').textContent=({phone:'Use landscape orientation on a stable stand. For foot tracking, start with the lens around knee to hip height. Keep the screen facing you so you can check framing.',tablet:'Use landscape orientation in a secure case or tripod mount. Place it on a stable support, with the lens around knee to hip height. Leave room for both shoes and your full sideways movement.',laptop:'Place the laptop on a stable table farther back. Tilt the screen until both feet and the floor are visible. If the built-in camera points down too steeply, move back or use an external webcam on a lower stand.'})[device];
});
