// server.js
// AI-Powered Content Generator — Backend using Anthropic Claude API
// Final Year Project

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Anthropic Claude Client ───────────────────────────────────────────
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Platform-specific prompt builder ─────────────────────────────────
function buildPrompt({ topic, platform, tone, audience, length }) {
  const lengthGuide = {
    short:  'very short (under 100 words)',
    medium: 'medium length (300–600 words)',
    long:   'long-form (800–1200 words)',
  };

  const platformGuide = {
    'Blog post': `Write a full blog post with:
- A compelling headline
- An engaging introduction
- 3 to 4 well-structured body sections with subheadings
- A conclusion with a clear call-to-action`,

    'LinkedIn': `Write a LinkedIn post with:
- A strong opening hook (first line must grab attention)
- Value-packed body paragraphs
- A clear call-to-action at the end
- Professional but human tone
- No excessive hashtags`,

    'Twitter/X': `Write a Twitter/X thread with:
- 4 to 6 numbered tweets (1/, 2/, 3/ etc.)
- Each tweet must be under 280 characters
- First tweet must hook the reader immediately
- End with a strong closing tweet`,

    'Instagram': `Write an Instagram caption with:
- An attention-grabbing opening line
- Engaging body content with emojis placed naturally
- A call-to-action (like, comment, share, or follow)
- 6 to 10 relevant hashtags at the end on a new line`,
  };

  return `You are an expert content writer specialising in digital marketing and social media.

Platform: ${platform}
Topic: ${topic}
Tone: ${tone}
Target audience: ${audience || 'general audience'}
Length: ${lengthGuide[length] || lengthGuide.medium}

${platformGuide[platform] || ''}

Important: Write ONLY the content itself. Do not include any explanations, comments, or meta-text before or after the content.`;
}

// ── Generate endpoint ─────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, platform, tone, audience, length } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter a topic or brief.' });
    }

    const prompt = buildPrompt({ topic, platform, tone, audience, length });

    // Call the Anthropic Claude API
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const generatedText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const wordCount = generatedText.split(/\s+/).filter(Boolean).length;

    res.json({
      content: generatedText,
      wordCount,
      platform,
      tone,
      model: message.model,
    });

  } catch (error) {
    console.error('Claude API Error:', error.message);

    // Handle specific Anthropic errors
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Please check your .env file.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    if (error.status === 402) {
      return res.status(402).json({ error: 'Insufficient API credits. Please top up your Anthropic account.' });
    }

    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    claude_api: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing — add key to .env',
  });
});

app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
  console.log(`🔑  Claude API key: ${process.env.ANTHROPIC_API_KEY ? 'Found ✓' : 'MISSING — add to .env file'}`);
});
