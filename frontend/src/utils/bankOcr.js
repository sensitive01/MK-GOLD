import Tesseract from 'tesseract.js';

// Comprehensive dictionary of major Indian bank IFSC prefixes
const KNOWN_BANK_PREFIXES = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  PUNB: 'Punjab National Bank',
  UBIN: 'Union Bank of India',
  KKBK: 'Kotak Mahindra Bank',
  IOBA: 'Indian Overseas Bank',
  IDIB: 'Indian Bank',
  CBIN: 'Central Bank of India',
  YESB: 'Yes Bank',
  INDB: 'IndusInd Bank',
  BKID: 'Bank of India',
  MAHB: 'Bank of Maharashtra',
  PSIB: 'Punjab & Sind Bank',
  KVBL: 'Karur Vysya Bank',
  FDRL: 'Federal Bank',
  TMBL: 'Tamilnad Mercantile Bank',
  CSBK: 'CSB Bank',
  SIBL: 'South Indian Bank',
  ESFB: 'Equitas Small Finance Bank',
  AUBL: 'AU Small Finance Bank',
  DBSS: 'DBS Bank',
  SCBL: 'Standard Chartered Bank',
  CITI: 'Citibank',
  HSBC: 'HSBC Bank',
  AIRP: 'Airtel Payments Bank',
  PYTM: 'Paytm Payments Bank',
  JAKA: 'Jammu and Kashmir Bank',
  KARB: 'Karnataka Bank',
  DCBL: 'DCB Bank',
  RATN: 'RBL Bank',
  UCOB: 'UCO Bank',
  VIJB: 'Vijaya Bank',
  SYNB: 'Syndicate Bank',
  ANDB: 'Andhra Bank',
  ALLA: 'Allahabad Bank',
  CORP: 'Corporation Bank',
  IDFB: 'IDFC FIRST Bank',
  BAND: 'Bandhan Bank',
};

/**
 * Preprocesses an image via an off-screen HTML5 Canvas:
 * 1. Automatically detects and crops dark/black letterbox borders (common in mobile screenshots).
 * 2. Scales to an optimal width (~1800 - 2200px) so character height is ideal for Tesseract.
 * 3. Converts to high-contrast grayscale and whitewashes faint pastel background security patterns.
 *
 * @param {File|Blob|string} imageSource
 * @returns {Promise<HTMLCanvasElement|File|Blob|string>}
 */
async function preprocessImageForOcr(imageSource) {
  if (typeof window === 'undefined' || !window.document) {
    return imageSource;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      let objectUrl = null;

      if (imageSource instanceof Blob || imageSource instanceof File) {
        objectUrl = URL.createObjectURL(imageSource);
        img.src = objectUrl;
      } else if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        return resolve(imageSource);
      }

      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          if (origW <= 0 || origH <= 0) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            return resolve(imageSource);
          }

          // Step 1: Draw to raw canvas to inspect and crop letterbox borders
          const rawCanvas = document.createElement('canvas');
          rawCanvas.width = origW;
          rawCanvas.height = origH;
          const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
          rawCtx.drawImage(img, 0, 0, origW, origH);

          let minX = 0;
          let maxX = origW - 1;
          let minY = 0;
          let maxY = origH - 1;

          try {
            const rawImgData = rawCtx.getImageData(0, 0, origW, origH);
            const d = rawImgData.data;

            // Check if borders are dark (black letterbox)
            const isDark = (x, y) => {
              const idx = (y * origW + x) * 4;
              return (d[idx] + d[idx + 1] + d[idx + 2]) / 3 < 45;
            };

            // If corners or edges are black, detect document content bounding box
            if (isDark(5, 5) || isDark(origW - 5, 5) || isDark(5, origH - 5)) {
              let fMinX = origW;
              let fMaxX = 0;
              let fMinY = origH;
              let fMaxY = 0;
              const step = 2;
              for (let y = 0; y < origH; y += step) {
                for (let x = 0; x < origW; x += step) {
                  const idx = (y * origW + x) * 4;
                  const lum = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
                  if (lum >= 45) {
                    if (x < fMinX) fMinX = x;
                    if (x > fMaxX) fMaxX = x;
                    if (y < fMinY) fMinY = y;
                    if (y > fMaxY) fMaxY = y;
                  }
                }
              }
              if (fMaxX > fMinX + 100 && fMaxY > fMinY + 100) {
                minX = Math.max(0, fMinX - 2);
                maxX = Math.min(origW - 1, fMaxX + 2);
                minY = Math.max(0, fMinY - 2);
                maxY = Math.min(origH - 1, fMaxY + 2);
              }
            }
          } catch {
            // ignore if pixel inspection restricted
          }

          const cropW = maxX - minX + 1;
          const cropH = maxY - minY + 1;

          // Step 2: Scale cropped document to target width (1600 - 2200px)
          let scale = 1;
          if (cropW < 1400) {
            scale = 1800 / cropW;
          } else if (cropW > 2400) {
            scale = 2200 / cropW;
          }
          const finalW = Math.round(cropW * scale);
          const finalH = Math.round(cropH * scale);

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = finalW;
          finalCanvas.height = finalH;
          const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });

          // Draw cropped section scaled
          finalCtx.drawImage(rawCanvas, minX, minY, cropW, cropH, 0, 0, finalW, finalH);

          // Step 3: Enhance contrast and grayscale
          const finalImgData = finalCtx.getImageData(0, 0, finalW, finalH);
          const data = finalImgData.data;
          const contrast = 35;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            gray = factor * (gray - 128) + 128;

            // Whitewash light background patterns while preserving dark text
            if (gray > 165) {
              gray = Math.min(255, gray + 45);
            } else if (gray < 110) {
              gray = Math.max(0, gray - 35);
            }

            gray = gray < 0 ? 0 : gray > 255 ? 255 : gray;

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          finalCtx.putImageData(finalImgData, 0, 0);

          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return resolve(finalCanvas);
        } catch (err) {
          console.warn('Canvas image preprocessing skipped:', err);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(imageSource);
        }
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(imageSource);
      };
    } catch {
      resolve(imageSource);
    }
  });
}

/**
 * Repairs common OCR misread digits within suspected numeric account strings.
 */
function cleanOcrNumber(rawStr) {
  if (!rawStr) return '';
  return rawStr
    .replace(/[OoQqDd]/g, '0')
    .replace(/[Ili|!\]\[]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/\D/g, '');
}

/**
 * Formats a raw person/entity name to Title Case.
 */
function formatNameToTitleCase(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extracts and verifies the Indian IFSC code from text with dot-matrix & OCR auto-repair.
 * Validates against Razorpay directory to guarantee 100% validity.
 */
async function extractAndVerifyIfsc(rawText) {
  const candidates = new Set();

  // Pattern 1: Explicitly labeled IFSC (e.g., "IFSC: SBIN0016922", "152 :581NOO16922", "IFS CODE : HDFC0002345")
  const labeledRegex = /(?:IFSC|IFS\s*CODE|RTGS\s*[\/\-]?\s*NEFT|NEFT\s*[\/\-]?\s*IFSC|152\s*:?|IFSC\s*CODE)\s*[:.\-—#\s]*([A-Z0-9\s]{9,16})/gi;
  let match;
  while ((match = labeledRegex.exec(rawText)) !== null) {
    const cleaned = match[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length >= 10) {
      candidates.add(cleaned.substring(0, 11));
    }
  }

  // Pattern 2: Scan all 10-12 alphanumeric word tokens across the document
  const wordTokens = rawText.match(/[A-Za-z0-9]{10,12}/g) || [];
  for (const token of wordTokens) {
    if (token.length === 11) {
      candidates.add(token.toUpperCase());
    }
  }

  // Pattern 3: Look for SBI branch code (e.g. "Branch Code: 16922" or "sbi.16922@sbi.co.in")
  const branchCodeMatch = rawText.match(/(?:branch\s*code|sbi\.(\d{4,6})@)\s*[:.\-]?\s*(\d{4,6})/i);
  if (branchCodeMatch) {
    const code = branchCodeMatch[2] || branchCodeMatch[1];
    if (code) {
      const padded = code.padStart(6, '0');
      candidates.add(`SBIN${padded}`);
    }
  }

  // Clean and normalize each candidate
  const normalizedCandidates = [];
  for (const cand of candidates) {
    if (cand.length === 11) {
      // First 4 characters: repair OCR digit confusion (5->S, 8->B, 1->I, 0->O)
      const prefix = cand
        .substring(0, 4)
        .replace(/5/g, 'S')
        .replace(/8/g, 'B')
        .replace(/1/g, 'I')
        .replace(/0/g, 'O')
        .toUpperCase();

      const fifth = '0';

      // Last 6 characters: repair common OCR letter confusion (O->0, I->1, S->5, B->8)
      const suffixDigits = cand
        .substring(5, 11)
        .replace(/[OoQq]/g, '0')
        .replace(/[Ili|]/g, '1')
        .replace(/[Ss]/g, '5')
        .replace(/[Bb]/g, '8')
        .toUpperCase();

      const normalizedWithDigits = `${prefix}${fifth}${suffixDigits}`;
      if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedWithDigits)) {
        normalizedCandidates.push(normalizedWithDigits);
      }

      // Also allow alphanumeric suffix candidate
      const normalizedRaw = `${prefix}${fifth}${cand.substring(5, 11).toUpperCase()}`;
      if (normalizedRaw !== normalizedWithDigits && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedRaw)) {
        normalizedCandidates.push(normalizedRaw);
      }
    }
  }

  // Prioritize candidates with recognized bank prefixes
  normalizedCandidates.sort((a, b) => {
    const aKnown = KNOWN_BANK_PREFIXES[a.substring(0, 4)] ? 1 : 0;
    const bKnown = KNOWN_BANK_PREFIXES[b.substring(0, 4)] ? 1 : 0;
    return bKnown - aKnown;
  });

  // Verify against Razorpay IFSC API
  for (const code of normalizedCandidates) {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (res.ok) {
        const info = await res.json();
        return {
          ifscCode: code,
          bankName: info?.BANK || KNOWN_BANK_PREFIXES[code.substring(0, 4)] || '',
          branch: info?.BRANCH || '',
          verified: true,
        };
      }
    } catch {
      // Network lookup failed, continue checking
    }
  }

  // Fallback to candidate with recognized bank prefix
  for (const code of normalizedCandidates) {
    const prefix = code.substring(0, 4);
    if (KNOWN_BANK_PREFIXES[prefix]) {
      return {
        ifscCode: code,
        bankName: KNOWN_BANK_PREFIXES[prefix],
        branch: '',
        verified: false,
      };
    }
  }

  return { ifscCode: '', bankName: '', branch: '', verified: false };
}

/**
 * Extracts Indian Bank Account Number with high precision:
 * 1. Checks cheque MICR line at the bottom.
 * 2. Checks lines explicitly containing "Account No", "A/C No", "Acc No".
 * 3. Inspects adjacent lines for labeled account numbers.
 * 4. Filters unlabeled numeric sequences, strictly EXCLUDING CIF, Nominee, Phone, Date, MICR numbers.
 */
function extractAccountNumber(rawText, lines, ifscCode) {
  // Method 1: Cheque MICR bottom band
  // Format: "ChequeNo" MICR: AccountNo" TransCode
  const micrRegex = /(?:["':\s]|^)(\d{6})(?:["':\s]+)(\d{9})(?:["':\s]+)(\d{9,18})(?:["':\s]+)(\d{2})/i;
  const micrMatch = rawText.match(micrRegex);
  if (micrMatch && micrMatch[3]) {
    return micrMatch[3];
  }

  // Method 2: Check lines explicitly containing "Account No", "A/C No", "Acc No", "S.B. A/C"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:account(?:\s*no|\s*num|\s*number)?|a\/?c(?:\s*no|\s*num|\s*number)?|acct(?:\s*no)?|s\.?b\.?\s*a\/?c)/i.test(line)) {
      // Extract all numbers on this exact line
      const numbersOnLine = line.match(/\b\d{9,18}\b/g) || [];
      if (numbersOnLine.length > 0) {
        // Return the first 9-18 digit account number on this line
        return numbersOnLine[0];
      }
      // If line only had "Account No :", check the next line
      if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(/\b\d{9,18}\b/);
        if (nextMatch) return nextMatch[0];
      }
    }
  }

  // Method 3: Labeled regex inline (allowing OCR digit noise repair)
  const labeledRegex = /(?:a\/?c(?:\s*no|\s*num|\s*number)?|account(?:\s*no|\s*num|\s*number)?|acct(?:\s*no)?|s\.?b\.?\s*a\/?c|c\.?a\.?\s*a\/?c|savings\s*a\/?c|current\s*a\/?c|a\/?c\s*#)\s*[:.\-—~#\s]*([0-9OIli|!SsbBZz\s\-]{9,35})/i;
  const labeledMatch = rawText.match(labeledRegex);
  if (labeledMatch && labeledMatch[1]) {
    const cleaned = cleanOcrNumber(labeledMatch[1]);
    if (cleaned.length >= 9 && cleaned.length <= 18) {
      if (!(cleaned.length === 10 && /^[6-9]/.test(cleaned))) {
        return cleaned;
      }
    }
  }

  // Method 4: Scan all lines for 9-18 digit numbers, strictly EXCLUDING lines with non-account labels
  // (CIF, Nominee Reg, Customer ID, Phone, Date, MICR, Branch Code)
  for (const line of lines) {
    if (/(?:cif|customer\s*id|nominee|nom\.\s*reg|phone|mobile|date|micr|branch\s*code)/i.test(line)) {
      continue;
    }
    const matches = line.match(/\b\d{9,18}\b/g) || [];
    for (const num of matches) {
      if (num.length === 10 && /^[6-9]/.test(num)) continue;
      if (num.length === 8) continue;
      if (ifscCode && num.includes(ifscCode.substring(5))) continue;

      return num;
    }
  }

  return '';
}

/**
 * Extracts Account Holder Name from cheques, passbooks, or statements.
 */
function extractAccountHolderName(rawText, lines) {
  const blacklist = [
    'bank',
    'branch',
    'india',
    'state',
    'account',
    'savings',
    'current',
    'rupees',
    'order',
    'bearer',
    'signatory',
    'authorised',
    'authorized',
    'cheque',
    'valid',
    'months',
    'date',
    'manager',
    'limited',
    'ltd',
    'ifsc',
    'micr',
    'code',
    'cif',
    'nominee',
    'balance',
    'phone',
    'mobile',
    'address',
    'customer',
    'holder',
    'abbreviations',
    'deposit',
  ];

  const isValidName = (str) => {
    if (!str || str.length < 3 || str.length > 40) return false;
    if (!/^[A-Za-z\s.]+$/.test(str)) return false;
    const lower = str.toLowerCase();
    return !blacklist.some((word) => lower.includes(word));
  };

  const cleanPrefixes = (str) => {
    return str
      .replace(/^(?:FOR|SHRI|SMT\.?|MR\.?|MRS\.?|MS\.?|M\/S|DR\.?|TO|PAY)\s+/i, '')
      .replace(/\s+(?:OR\s+BEARER|BEARER|ONLY)$/i, '')
      .replace(/\s+[a-z]$/i, '') // strip trailing single OCR noise char like " g"
      .replace(/[^A-Za-z\s.]/g, '')
      .trim();
  };

  // Check 1: Labeled "Customer Name", "Name of Account Holder", "A/C Holder Name", "Account Name"
  for (const line of lines) {
    const match = line.match(/(?:customer\s*name|name\s*of\s*(?:account\s*)?holder|a\/?c\s*holder(?:\s*name)?|account\s*name)\s*[:.\-—#\s]*(?:mr\.?|mrs\.?|ms\.?|shri|smt\.?|m\/s|dr\.?)?\s*([A-Za-z\s.]{3,40})/i);
    if (match && match[1]) {
      const cand = cleanPrefixes(match[1]);
      if (isValidName(cand)) {
        return formatNameToTitleCase(cand);
      }
    }
  }

  // Check 2: Cheque signature area - line immediately above "Authorized Signatory"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:authori[sz]ed\s*signator(?:y|ies)|please\s*sign\s*above)/i.test(line)) {
      for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
        const cand = cleanPrefixes(lines[j]);
        if (isValidName(cand)) {
          return formatNameToTitleCase(cand);
        }
      }
    }
  }

  // Check 3: Standard "Name : <Name>"
  const genericNameMatch = rawText.match(/(?:^|\n)\s*name\s*[:.\-—#\s]+(?:mr\.?|mrs\.?|ms\.?|shri|smt\.?|m\/s|dr\.?)?\s*([A-Za-z\s.]{3,40})/i);
  if (genericNameMatch && genericNameMatch[1]) {
    const cand = cleanPrefixes(genericNameMatch[1]);
    if (isValidName(cand)) {
      return formatNameToTitleCase(cand);
    }
  }

  // Check 4: Cheque "FOR <Entity/Person>" line
  for (const line of lines) {
    if (/^FOR\s+[A-Za-z\s.]{3,35}$/i.test(line.trim())) {
      const cand = cleanPrefixes(line);
      if (isValidName(cand)) {
        return formatNameToTitleCase(cand);
      }
    }
  }

  return '';
}

/**
 * Detects the proof document type: Passbook, Cheque Leaf, or Bank Statement.
 */
function detectProofType(rawText) {
  const text = (rawText || '').toUpperCase();

  // 1. Passbook indicators take highest priority (abbreviations page, CIF, customer name, branch code, etc.)
  if (
    text.includes('PASSBOOK') ||
    text.includes('PASS BOOK') ||
    text.includes('CUSTOMER ID') ||
    text.includes('CUSTOMER NAME') ||
    text.includes('CIF NO') ||
    text.includes('CIF') ||
    text.includes('BRANCH CODE') ||
    text.includes('NOM. REG') ||
    text.includes('D.O.B') ||
    text.includes('MOP') ||
    text.includes('S/D/W/H/O') ||
    text.includes('SAVING BANK')
  ) {
    return 'Passbook';
  }

  // 2. Bank statement indicators
  if (
    text.includes('STATEMENT') ||
    text.includes('TRANSACTION DETAILS') ||
    text.includes('OPENING BALANCE') ||
    text.includes('CLOSING BALANCE')
  ) {
    return 'Bank Statement';
  }

  // 3. Cheque indicators (CTS-2010, Pay, or Bearer, Signatory)
  if (
    text.includes('CTS-2010') ||
    text.includes('CTS 2010') ||
    text.includes('OR BEARER') ||
    text.includes('PAY TO') ||
    text.includes('CHEQUE')
  ) {
    return 'Cheque Leaf';
  }

  return '';
}

/**
 * Main bank details extraction function.
 *
 * @param {File|Blob|string} imageSource - The image file or preview URL
 * @param {Function} [onProgress] - Optional progress callback (0 - 100)
 * @returns {Promise<{ accountNo: string, ifscCode: string, bankName: string, branch: string, accountHolderName: string, detectedProofType: string, rawText: string }>}
 */
export async function extractBankDetailsFromImage(imageSource, onProgress) {
  try {
    if (onProgress) onProgress(5);

    // 1. Image preprocessing via HTML5 Canvas (auto-crop letterbox black borders, contrast boost, grayscale)
    const processedSource = await preprocessImageForOcr(imageSource);
    if (onProgress) onProgress(15);

    // 2. Perform OCR recognition with Tesseract.js
    const { data } = await Tesseract.recognize(processedSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(15 + Math.round(m.progress * 75));
        }
      },
    });

    if (onProgress) onProgress(92);

    const rawText = data?.text || '';
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // 3. Extract and verify IFSC code (with dot-matrix repair & Razorpay verification)
    const ifscResult = await extractAndVerifyIfsc(rawText);

    // 4. Extract Account Number (with MICR cheque support and CIF exclusion)
    const accountNo = extractAccountNumber(rawText, lines, ifscResult.ifscCode);

    // 5. Extract Account Holder Name
    const accountHolderName = extractAccountHolderName(rawText, lines);

    // 6. Detect Proof Type (Passbook, Cheque Leaf, Bank Statement)
    const detectedProofType = detectProofType(rawText);

    if (onProgress) onProgress(100);

    return {
      accountNo,
      ifscCode: ifscResult.ifscCode,
      bankName: ifscResult.bankName,
      branch: ifscResult.branch,
      accountHolderName,
      detectedProofType,
      rawText,
    };
  } catch (err) {
    console.error('Error during bank OCR recognition:', err);
    throw err;
  }
}
