const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw file
const MAX_CHARS = 40000; // cap extracted text sent to the model

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let raw = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', resolve);
    req.on('error', reject);
  });

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { filename, dataBase64 } = data;
  if (!filename || !dataBase64) {
    return res.status(400).json({ error: 'filename and dataBase64 are required' });
  }

  const buffer = Buffer.from(dataBase64, 'base64');
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'File too large for the demo (max 3MB).' });
  }

  const ext = (filename.split('.').pop() || '').toLowerCase();
  let text;

  try {
    if (ext === 'pdf') {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'txt' || ext === 'md') {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use .txt, .md, .pdf, or .docx.' });
    }
  } catch (e) {
    console.error('Extraction error:', e);
    return res.status(422).json({ error: 'Could not read that file. Try a different one.' });
  }

  text = (text || '').trim();
  if (!text) {
    return res.status(422).json({ error: 'No readable text found in that file.' });
  }

  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }

  return res.status(200).json({ text, truncated, chars: text.length });
};
