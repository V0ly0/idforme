// ─── Variables globales ───
let imageBase64 = null;
let imageMime = 'image/jpeg';

// ─── Gestion du drag & drop / upload ───
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');

uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) return;
  imageMime = file.type;
  const reader = new FileReader();
  reader.onload = e => {
    imageBase64 = e.target.result.split(',')[1];
    preview.src = e.target.result;
    uploadZone.classList.add('has-image');
    checkReady();
  };
  reader.readAsDataURL(file);
}

// ─── Date et API Key ───
const dateInput = document.getElementById('dateInput');
const runBtn = document.getElementById('runBtn');
const apiKeyInput = document.getElementById('apiKey');

dateInput.addEventListener('input', checkReady);
apiKeyInput.addEventListener('input', checkReady);

function checkReady() {
  runBtn.disabled = !(imageBase64 && dateInput.value && apiKeyInput.value.trim());
}

function toggleApiKey() {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
}

// ─── Format date en DD/MM/YYYY ───
function formatDate(val) {
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Affichage résultats ───
function setLoading(on) {
  runBtn.classList.toggle('loading', on);
  runBtn.disabled = on;
  if (on) setStatus('Envoi à Grok…');
}

function setStatus(msg, type = '') {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = 'status' + (type ? ` ${type}` : '');
}

function hideResult() {
  const section = document.getElementById('resultSection');
  section.classList.remove('visible');
  document.getElementById('resultImgWrap').innerHTML = '';
  document.getElementById('resultText').style.display = 'none';
}

function showResultImage(src) {
  const wrap = document.getElementById('resultImgWrap');
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Résultat Grok';
  wrap.appendChild(img);

  const dlBtn = document.getElementById('dlBtn');
  dlBtn.href = src;
  dlBtn.style.display = 'inline-flex';

  document.getElementById('resultSection').classList.add('visible');
}

function showResultText(txt) {
  const el = document.getElementById('resultText');
  el.textContent = txt;
  el.style.display = 'block';
  document.getElementById('resultSection').classList.add('visible');
}

// ─── Fonction principale ───
async function runEdit() {
  const apiKey = apiKeyInput.value.trim();
  const dateVal = dateInput.value;
  if (!apiKey || !dateVal || !imageBase64) return;

  const date = formatDate(dateVal);
  const prompt = `Modifie la date de naissance par "${date}" en haut et en bas du document. Retourne uniquement l'image modifiée.`;

  setLoading(true);
  setStatus('');
  hideResult();

  try {
    const body = {
      proxy: 'grok-2', // obligatoire pour Grok-Api
      message: [
        { type: 'input_text', text: prompt },
        { type: 'input_image', image_base64: imageBase64 }
      ]
    };

    const res = await fetch('https://test-kappa-six-70.vercel.app/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // si tu veux garder l’API key côté frontend
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} → ${errText}`);
    }

    const data = await res.json();
    console.log('Réponse API:', data);

    let foundImage = false;
    let textContent = '';

    for (const block of data?.choices?.[0]?.message?.content || []) {
      if (block.type === 'output_image') {
        const src = `data:image/png;base64,${block.image_base64}`;
        showResultImage(src);
        foundImage = true;
      } else if (block.type === 'output_text') {
        textContent += block.text;
      }
    }

    if (!foundImage) {
      const match = textContent.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (match) showResultImage(match[0]);
      else showResultText(textContent || 'Aucune image retournée.');
    }

    setStatus('Traitement terminé.', 'success');

  } catch (err) {
    console.error(err);
    setStatus(`Erreur : ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

// ─── Bouton run ───
runBtn.addEventListener('click', runEdit);
