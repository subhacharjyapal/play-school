document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 2.4 } });

  const toast = document.getElementById('toast');
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  /* ---- mascot tooltip auto-greet ---- */
  const tip = document.getElementById('tip');
  setTimeout(() => {
    tip.classList.add('on');
    setTimeout(() => tip.classList.remove('on'), 3200);
  }, 1100);

  /* ---- avatar picker ---- */
  const avatars = [...document.querySelectorAll('.avatar')];
  const pick = (btn) => {
    avatars.forEach(a => a.setAttribute('aria-checked', 'false'));
    btn.setAttribute('aria-checked', 'true');
    btn.classList.remove('bounce');
    void btn.offsetWidth;
    btn.classList.add('bounce');
    say(`${btn.dataset.name} is ready for adventure!`);
  };
  avatars.forEach((btn, i) => {
    btn.addEventListener('click', () => pick(btn));
    btn.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % avatars.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + avatars.length) % avatars.length;
      if (n !== null) { e.preventDefault(); avatars[n].focus(); pick(avatars[n]); }
    });
  });

  /* ---- password peek-a-boo ---- */
  const pw = document.getElementById('password');
  const pip = document.getElementById('pip');
  const eyeBtn = document.getElementById('eyeBtn');
  const hideEyes = () => pip.classList.add('hide');
  const showEyes = () => { if (document.activeElement !== pw && !pw.value) pip.classList.remove('hide'); };
  pw.addEventListener('focus', hideEyes);
  pw.addEventListener('blur', showEyes);
  pw.addEventListener('input', () => { if (pw.value) hideEyes(); else showEyes(); });

  eyeBtn.addEventListener('click', () => {
    const showing = pw.type === 'text';
    pw.type = showing ? 'password' : 'text';
    eyeBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    eyeBtn.innerHTML = `<i data-lucide="${showing ? 'eye' : 'eye-off'}"></i>`;
    if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 2.4 } });
    pw.focus();
  });
  /* ---- confetti ---- */
  const confetti = (el) => {
    const r = el.getBoundingClientRect();
    const colors = ['#E07A5F', '#F4D06F', '#81B29A', '#90CAF9', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const size = 6 + Math.random() * 8;
      s.style.width = s.style.height = size + 'px';
      s.style.left = r.left + r.width / 2 + 'px';
      s.style.top = r.top + r.height / 2 + 'px';
      s.style.position = 'fixed';
      s.style.background = colors[i % colors.length];
      s.style.boxShadow = '0 0 6px rgba(255,255,255,.7)';
      s.style.setProperty('--dx', (Math.random() * 260 - 130) + 'px');
      s.style.setProperty('--dy', (-70 - Math.random() * 130) + 'px');
      s.style.animationDelay = (Math.random() * .15) + 's';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  };

  /* ---- form ---- */
  const form = document.getElementById('form');
  const user = document.getElementById('user');
  const cta = document.getElementById('cta');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!user.value.trim()) {
      user.closest('.field').classList.add('wiggle');
      setTimeout(() => user.closest('.field').classList.remove('wiggle'), 550);
      say('Oops! We still need your nickname.');
      user.focus();
      return;
    }
    if (!pw.value) {
      pw.closest('.field').classList.add('wiggle');
      setTimeout(() => pw.closest('.field').classList.remove('wiggle'), 550);
      say('Shhh... the secret password is missing!');
      pw.focus();
      return;
    }
    confetti(cta);
    const who = document.querySelector('.avatar[aria-checked="true"]').dataset.name;
    say(`Adventure loading... see you inside, ${who}!`);
  });

  /* ---- gentle card tilt ---- */
  const card = document.getElementById('card');
  if (window.matchMedia('(pointer:fine)').matches) {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(900px)'; });
  }
});
