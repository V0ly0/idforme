async function runEdit() {
  if (!imageBase64 || !dateInput.value) return;

  const date = formatDate(dateInput.value);
  const promptText = `Modifie la date de naissance par "${date}" en haut et en bas du document. Retourne uniquement l'image modifiée.`;

  setLoading(true);
  setStatus('');
  hideResult();

  try {
    const body = {
      proxy: 'grok-2', // Obligatoire
      message: [
        { type: 'input_text', text: promptText },
        { type: 'input_image', image: imageBase64 } // Attention : 'image' et non 'image_base64'
      ]
    };

    const res = await fetch('https://test-kappa-six-70.vercel.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} → ${text}`);
    }

    const data = await res.json();

    // Cherche l'image retournée
    const imageBlock = data?.choices?.[0]?.message?.content?.find(b => b.type === 'output_image');

    if (imageBlock) {
      showResultImage(`data:image/png;base64,${imageBlock.image}`);
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
