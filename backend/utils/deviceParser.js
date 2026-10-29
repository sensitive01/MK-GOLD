/**
 * Device, Browser, OS and IP address parser utility
 * Extracts detailed client metadata from Express request headers without external dependencies.
 */

function getIpAddress(req) {
  if (!req) return 'Unknown';

  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';

  if (forwarded) {
    ip = String(forwarded).split(',')[0].trim();
  } else if (req.headers['x-real-ip']) {
    ip = String(req.headers['x-real-ip']).trim();
  } else if (req.headers['cf-connecting-ip']) {
    ip = String(req.headers['cf-connecting-ip']).trim();
  } else if (req.ip) {
    ip = String(req.ip).trim();
  } else if (req.socket && req.socket.remoteAddress) {
    ip = String(req.socket.remoteAddress).trim();
  } else if (req.connection && req.connection.remoteAddress) {
    ip = String(req.connection.remoteAddress).trim();
  }

  // Normalize IPv6 mapped IPv4 and loopback
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1 (Local)';
  }

  return ip || 'Unknown';
}

function parseUserAgent(uaString) {
  const ua = String(uaString || '').trim();
  if (!ua) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      deviceType: 'Desktop',
      deviceModel: 'Unknown Device',
    };
  }

  // 1. Detect Device Type
  let deviceType = 'Desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo)/i.test(ua);

  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isMobile) {
    deviceType = 'Mobile';
  }

  // 2. Detect Operating System
  let os = 'Unknown OS';
  if (/Windows Phone/i.test(ua)) {
    os = 'Windows Phone';
    deviceType = 'Mobile';
  } else if (/Windows NT 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6\.2/i.test(ua)) {
    os = 'Windows 8';
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9\.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS\s+([0-9_]+)/i);
    const version = match ? match[1].replace(/_/g, '.') : '';
    os = version ? `iOS ${version}` : 'iOS';
    deviceType = 'Mobile';
  } else if (/iPad/i.test(ua)) {
    const match = ua.match(/OS\s+([0-9_]+)/i);
    const version = match ? match[1].replace(/_/g, '.') : '';
    os = version ? `iPadOS ${version}` : 'iPadOS';
    deviceType = 'Tablet';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X\s+([0-9_]+)/i);
    const version = match ? match[1].replace(/_/g, '.') : '';
    os = version ? `macOS ${version}` : 'macOS';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Ubuntu/i.test(ua)) {
    os = 'Ubuntu Linux';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Detect Device Model / Vendor
  let deviceModel = 'PC';
  if (/iPhone/i.test(ua)) {
    deviceModel = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceModel = 'Apple iPad';
  } else if (/Macintosh/i.test(ua)) {
    deviceModel = 'Apple Mac';
  } else if (/Windows/i.test(ua)) {
    deviceModel = 'Windows PC';
  } else if (/Linux/i.test(ua) && deviceType === 'Desktop') {
    deviceModel = 'Linux Desktop';
  } else if (/Android/i.test(ua)) {
    const modelMatch = ua.match(/;\s*([^;]+?)\s*Build\//i);
    if (modelMatch && modelMatch[1]) {
      deviceModel = modelMatch[1].trim();
    } else if (/SM-|SAMSUNG/i.test(ua)) {
      deviceModel = 'Samsung Galaxy';
    } else if (/Pixel/i.test(ua)) {
      deviceModel = 'Google Pixel';
    } else if (/OnePlus/i.test(ua)) {
      deviceModel = 'OnePlus';
    } else if (/Redmi|POCO|Xiaomi/i.test(ua)) {
      deviceModel = 'Xiaomi Device';
    } else if (/vivo/i.test(ua)) {
      deviceModel = 'Vivo Device';
    } else if (/oppo/i.test(ua)) {
      deviceModel = 'Oppo Device';
    } else {
      deviceModel = 'Android Device';
    }
  }

  // 4. Detect Browser & Version
  let browser = 'Unknown Browser';
  let browserVersion = '';

  if (/OPR\/([0-9\.]+)/i.test(ua) || /Opera\/([0-9\.]+)/i.test(ua)) {
    browser = 'Opera';
    const match = ua.match(/(?:OPR|Opera)[\/\s]+([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/Edg\/([0-9\.]+)/i.test(ua) || /Edge\/([0-9\.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    const match = ua.match(/(?:Edg|Edge)[\/\s]+([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/SamsungBrowser\/([0-9\.]+)/i.test(ua)) {
    browser = 'Samsung Internet';
    const match = ua.match(/SamsungBrowser\/([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/Chrome\/([0-9\.]+)/i.test(ua) || /CriOS\/([0-9\.]+)/i.test(ua)) {
    browser = 'Google Chrome';
    const match = ua.match(/(?:Chrome|CriOS)[\/\s]+([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/Firefox\/([0-9\.]+)/i.test(ua) || /FxiOS\/([0-9\.]+)/i.test(ua)) {
    browser = 'Mozilla Firefox';
    const match = ua.match(/(?:Firefox|FxiOS)[\/\s]+([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/Safari\/([0-9\.]+)/i.test(ua) && /Version\/([0-9\.]+)/i.test(ua)) {
    browser = 'Apple Safari';
    const match = ua.match(/Version\/([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  } else if (/MSIE\s+([0-9\.]+)/i.test(ua) || /Trident\/.*rv:([0-9\.]+)/i.test(ua)) {
    browser = 'Internet Explorer';
    const match = ua.match(/(?:MSIE\s+|rv:)([0-9\.]+)/i);
    browserVersion = match ? match[1].split('.')[0] : '';
  }

  return {
    browser: browserVersion ? `${browser} ${browserVersion}` : browser,
    browserVersion,
    os,
    deviceType,
    deviceModel,
  };
}

module.exports = {
  getIpAddress,
  parseUserAgent,
};

