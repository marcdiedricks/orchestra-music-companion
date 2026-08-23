(() => {
  const CONFIG_URL = './data/media-reference.json';

  async function getReferenceMediaConfig() {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) throw new Error('Reference media configuration unavailable');
    return response.json();
  }

  window.OrchestraReferenceMedia = {
    getConfig: getReferenceMediaConfig
  };
})();
