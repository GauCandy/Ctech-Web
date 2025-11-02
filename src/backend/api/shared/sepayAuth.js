// Middleware xác thực API key từ SePay webhook
const SEPAY_API_KEY = 'gaukeo#7322';

function verifySepayApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.error('[SEPAY] Missing authorization header');
      return res.status(401).json({ error: 'Unauthorized - Missing API key' });
    }

    // SePay gửi header dạng "Apikey gaukeo#7322"
    const [type, apiKey] = authHeader.split(' ');

    if (type !== 'Apikey' || apiKey !== SEPAY_API_KEY) {
      console.error('[SEPAY] Invalid API key:', authHeader);
      return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }

    console.log('[SEPAY] API key verified successfully');
    next();
  } catch (error) {
    console.error('[SEPAY] Error verifying API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  verifySepayApiKey,
};
