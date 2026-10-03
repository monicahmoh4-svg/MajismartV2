// SMS notifications via Africa's Talking when configured, else console log.
// Env: AT_API_KEY, AT_USERNAME, AT_SENDER_ID
async function sendSms(to, message) {
  const toList = Array.isArray(to) ? to : [to];
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    console.log(`[SMS:simulated] to=${toList.join(',')} msg=${message}`);
    return { mode: 'simulation', sent: toList.length };
  }
  try {
    const params = new URLSearchParams({
      username: process.env.AT_USERNAME,
      to: toList.join(','),
      message,
    });
    if (process.env.AT_SENDER_ID) params.append('from', process.env.AT_SENDER_ID);
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: { apiKey: process.env.AT_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await res.json().catch(() => ({}));
    return { mode: 'africastalking', data };
  } catch (e) {
    console.error('SMS send failed:', e.message);
    return { mode: 'failed', error: e.message };
  }
}

module.exports = { sendSms };
