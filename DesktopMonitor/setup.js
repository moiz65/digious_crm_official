const form = document.getElementById('setup-form');
const errorOutput = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorOutput.textContent = '';
  try {
    await window.desktopMonitorConfig.saveCrmUrl('https://digious-crm.vercel.app');
  } catch (error) {
    errorOutput.textContent = error.message || 'Could not save the CRM URL.';
  }
});
