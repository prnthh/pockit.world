// Small enhancements; navigation and content work without JavaScript.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const playSound = url => { new Audio(url).play().catch(() => {}); };

for (const card of document.querySelectorAll('.nav-card')) {
  card.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') playSound('/sound/hover.mp3');
  });
  card.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.transform = `perspective(1200px) rotateX(${-(y - .5) * 50}deg) rotateY(${(x - .5) * 50}deg)`;
    card.style.setProperty('--shine-x', `${x * 100}%`);
    card.style.setProperty('--shine-y', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  card.addEventListener('click', () => playSound('/sound/select2.mp3'));
}

// Decode the logo sound only after the first interaction, then reverse it on exit.
const logo = document.querySelector('.site-logo');
if (logo) {
  let context, buffer, reversed, source, enteredAt, hovered = false;
  const play = (clip, offset = 0) => {
    source?.stop();
    source = context.createBufferSource();
    source.buffer = clip;
    source.connect(context.destination);
    source.start(0, offset);
  };
  logo.addEventListener('pointerenter', async () => {
    hovered = true;
    try {
      context ??= new AudioContext();
      await context.resume();
      buffer ??= await fetch('/sound/fluteup.mp3').then(r => r.arrayBuffer()).then(b => context.decodeAudioData(b));
      if (!reversed) {
        reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
        for (let i = 0; i < buffer.numberOfChannels; i++) reversed.copyToChannel(buffer.getChannelData(i).slice().reverse(), i);
      }
      if (!hovered) return;
      enteredAt = context.currentTime;
      play(buffer);
    } catch { /* Audio may be blocked until the visitor interacts. */ }
  });
  logo.addEventListener('pointerleave', () => {
    hovered = false;
    if (!reversed || enteredAt === undefined) return;
    const elapsed = context.currentTime - enteredAt;
    play(reversed, Math.max(0, reversed.duration - elapsed));
  });
}

const modelInput = document.getElementById('model-id');
if (modelInput) {
  let id = 5;
  const previous = document.getElementById('previous-model');
  const next = document.getElementById('next-model');
  const update = value => {
    const parsed = Number(value);
    const nextId = Number.isFinite(parsed) ? Math.min(1111, Math.max(1, Math.trunc(parsed))) : id;
    modelInput.value = String(nextId);
    previous.disabled = nextId === 1;
    next.disabled = nextId === 1111;
    if (nextId === id) return;
    id = nextId;
    const preview = document.getElementById('milady-preview');
    preview.src = `https://prnth.com/Pockit/web/${id}.html`;
    preview.title = `Pockit Milady #${id}`;
    document.getElementById('model-download').href = `https://prnth.com/Pockit/web/${id}.vrm`;
    document.getElementById('model-studio').href = `/milady/studio/?milady=${id}`;
  };
  modelInput.addEventListener('change', () => update(modelInput.value));
  previous.addEventListener('click', () => update(id - 1));
  next.addEventListener('click', () => update(id + 1));
}
