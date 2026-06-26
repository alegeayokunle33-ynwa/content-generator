// script.js
// AI Content Generator — Frontend Logic
// Communicates with Node.js/Express backend which calls the Claude API

let selectedPlatform = 'Blog post';
let selectedTone = 'Professional';

// ── Platform metadata ─────────────────────────────────────────────────
const platforms = {
  'Blog post': {
    title:    'Blog Post Generator',
    subtitle: 'Claude AI will write a full structured article with a headline, sections, and a call-to-action.',
    badge:    'Blog Post',
  },
  'LinkedIn': {
    title:    'LinkedIn Post Generator',
    subtitle: 'Claude AI will craft a professional post with a strong hook and thought-leadership framing.',
    badge:    'LinkedIn',
  },
  'Twitter/X': {
    title:    'Twitter / X Thread Generator',
    subtitle: 'Claude AI will write a numbered thread with each tweet under 280 characters.',
    badge:    'Twitter / X',
  },
  'Instagram': {
    title:    'Instagram Caption Generator',
    subtitle: 'Claude AI will write an engaging caption with emojis and hashtags for maximum reach.',
    badge:    'Instagram',
  },
};

// ── Navigate to generator ─────────────────────────────────────────────
function goToGenerator(platform) {
  selectedPlatform = platform;
  selectedTone = 'Professional';

  const meta = platforms[platform];
  document.getElementById('genTitle').textContent    = meta.title;
  document.getElementById('genSubtitle').textContent = meta.subtitle;
  document.getElementById('genBadge').textContent    = meta.badge;

  // Reset form
  document.getElementById('topic').value    = '';
  document.getElementById('audience').value = '';
  document.getElementById('length').value   = 'medium';

  // Reset tone buttons
  document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tone="Professional"]').classList.add('active');

  // Hide output
  document.getElementById('outputBox').classList.add('hidden');
  document.getElementById('errorMsg').classList.add('hidden');

  // Switch page
  document.getElementById('homePage').classList.remove('active');
  document.getElementById('generatorPage').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Navigate back home ────────────────────────────────────────────────
function goHome() {
  document.getElementById('generatorPage').classList.remove('active');
  document.getElementById('homePage').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Tone selection ────────────────────────────────────────────────────
document.querySelectorAll('.tone-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTone = btn.dataset.tone;
  });
});

// ── Generate content via Claude API ──────────────────────────────────
async function generateContent() {
  const topic    = document.getElementById('topic').value.trim();
  const audience = document.getElementById('audience').value.trim();
  const length   = document.getElementById('length').value;

  const btn        = document.getElementById('generateBtn');
  const outputBox  = document.getElementById('outputBox');
  const outputBody = document.getElementById('outputBody');
  const outputFooter = document.getElementById('outputFooter');
  const errorMsg   = document.getElementById('errorMsg');

  // Clear previous errors
  errorMsg.classList.add('hidden');

  // Validate
  if (!topic) {
    errorMsg.textContent = 'Please enter a topic or brief before generating.';
    errorMsg.classList.remove('hidden');
    document.getElementById('topic').focus();
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.textContent = '✦ Claude is writing...';
  outputBox.classList.remove('hidden');
  outputBody.textContent = 'Claude AI is generating your content...';
  outputFooter.classList.add('hidden');
  document.getElementById('outputLabel').textContent =
    `${selectedPlatform}  ·  ${selectedTone}`;

  try {
    // Call our Express backend which calls the Claude API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        platform: selectedPlatform,
        tone:     selectedTone,
        audience,
        length,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate content.');
    }

    // Display generated content
    outputBody.textContent = data.content;
    document.getElementById('wordCount').textContent  = `${data.wordCount} words`;
    document.getElementById('modelBadge').textContent = data.model || 'Claude AI';
    outputFooter.classList.remove('hidden');

  } catch (err) {
    outputBody.textContent = '';
    outputBox.classList.add('hidden');
    errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
    errorMsg.classList.remove('hidden');
  }

  // Reset button
  btn.disabled = false;
  btn.textContent = '✦ Generate with Claude AI';
}

// ── Copy content ──────────────────────────────────────────────────────
function copyContent(btn) {
  const text = document.getElementById('outputBody').textContent;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}
