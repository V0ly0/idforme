async function runEdit() {
  if (!imageBase64 || !dateInput.value) return;

  const date = formatDate(dateInput.value);
  const prompt = `Modifie la date de naissance par "${date}" en haut et en bas du document. Retourne uniquement l'image modifiée.`;

  setLoading(true);
  setStatus('');
  hideResult();

  try {
    const body = {
      proxy: 'grok-2', // Obligatoire pour Grok-Api
      message: [
        { type: 'input_text', text: prompt },
        { type: 'input_image', image_base64: imageBase64 }
      ]
    };

    const res = await fetch('https://test-kappa-six-70.vercel.app/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} → ${errText}`);
    }

    const data = await res.json();
    console.log('Réponse API:', data);

    const imageBlock = data?.choices?.[0]?.message?.content?.find(
      b => b.type === 'output_image'
    );

    if (imageBlock) {
      const src = `data:image/png;base64,${imageBlock.image_base64}`;
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
