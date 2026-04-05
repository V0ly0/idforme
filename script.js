let imageBase64 = null;
let imageMime = 'image/jpeg';

/* ── File handling ── */
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  loadImage(file);
}

function loadImage(file) {
  imageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = ev => {
    const result = ev.target.result;
    imageBase64 = result.split(',')[1];
    document.getElementById('preview').src = result;
    const zone = document.getElementById('uploadZone');
    zone.classList.add('has-image');
    checkReady();
  };
  reader.readAsDataURL(file);
}

/* Drag & drop */
const zone = document.getElementById('uploadZone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});

/* Date listeners */
document.getElementById('dateInput').addEventListener('input', checkReady);

function checkReady() {
  const ok = imageBase64 && document.getElementById('dateInput').value;
  document.getElementById('runBtn').disabled = !ok;
}

function formatDate(val) {
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

async function runEdit() {
  const dateVal = document.getElementById('dateInput').value;
  if (!dateVal || !imageBase64) return;

  const date = formatDate(dateVal);
  const prompt = `Modifie la date de naissance par "${date}" en haut et en bas du document. Retourne uniquement l'image modifiée.`;

  setLoading(true);
  setStatus('');
  hideResult();

  try {
    const res = await fetch('https://test-kappa-six-70.vercel.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image_base64: imageBase64
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (data?.image_base64) {
      const src = `data:image/png;base64,${data.image_base64}`;
      showResultImage(src);
    } else {
      showResultText('Aucune image retournée.');
    }

    setStatus('Traitement terminé.', 'success');

  } catch (err) {
    console.error(err);
    setStatus(`Erreur : ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

/* ── UI helpers ── */
function setLoading(on) {
  const btn = document.getElementById('runBtn');
  btn.classList.toggle('loading', on);
  btn.disabled = on;
  if (on) setStatus('Envoi à Grok…');
}

function setStatus(msg, type = '') {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = 'status' + (type ? ` ${type}` : '');
}

function hideResult() {
  document.getElementById('resultSection').classList.remove('visible');
  document.getElementById('resultImgWrap').innerHTML = '';
  document.getElementById('resultText').style.display = 'none';
}

function showResultImage(src, isOriginal = false) {
  const wrap = document.getElementById('resultImgWrap');
  const img = document.createElement('img');
  img.src = src;
  wrap.appendChild(img);

  const dlBtn = document.getElementById('dlBtn');
  dlBtn.href = src;
  dlBtn.style.display = isOriginal ? 'none' : 'inline-flex';

  document.getElementById('resultSection').classList.add('visible');
}

function showResultText(txt) {
  const el = document.getElementById('resultText');
  el.textContent = txt;
  el.style.display = 'block';
  document.getElementById('resultSection').classList.add('visible');
}
