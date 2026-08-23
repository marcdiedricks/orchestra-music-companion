(() => {
  const list = document.getElementById('reference-media-list');
  if (!list || !window.OrchestraReferenceMedia) return;
  window.OrchestraReferenceMedia.getConfig().then(config => {
    list.textContent = `Reference media library connected (${config.mediaBasePath}).`;
  }).catch(() => {
    list.textContent = 'Reference media is currently unavailable.';
  });
})();
