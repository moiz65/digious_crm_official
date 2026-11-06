const form = document.getElementById('setup-form');
const urlInput = document.getElementById('crm-url');
const errorOutput = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorOutput.textContent = '';
  try {
    await window.desktopMonitorConfig.saveCrmUrl(urlInput.value.trim());
  } catch (error) {
    errorOutput.textContent = error.message || 'Could not save the CRM URL.';
  }
});
