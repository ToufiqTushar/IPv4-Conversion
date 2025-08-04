// Get DOM elements
const decimalIP = document.getElementById('decimalIP');
const binaryIP = document.getElementById('binaryIP');
const convertBtn = document.getElementById('convertBtn');
const decFeedback = document.getElementById('decFeedback');
const binFeedback = document.getElementById('binFeedback');
const convertedDecimal = document.getElementById('convertedDecimal');
const convertedBinary = document.getElementById('convertedBinary');
const ipClassEl = document.getElementById('ipClass');
const subnetMaskEl = document.getElementById('subnetMask');
const hostsCountEl = document.getElementById('hostsCount');
const historyLog = document.getElementById('historyLog');

// Debounce function to limit how often a function runs
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Validate decimal IP (IPv4)
function validateDecimalIP(ip) {
  const parts = ip.split('.');
  if(parts.length !== 4) return false;
  for(let part of parts) {
    if(part === '' || isNaN(part)) return false;
    const n = Number(part);
    if(n < 0 || n > 255) return false;
    if(part.length > 1 && part.startsWith('0')) return false; // no leading zeros allowed except single 0
  }
  return true;
}

// Validate binary IP (32 bits, dot-separated every 8 bits)
function validateBinaryIP(ip) {
  const parts = ip.split('.');
  if(parts.length !== 4) return false;
  for(let part of parts) {
    if(part.length !== 8) return false;
    if(!/^[01]+$/.test(part)) return false;
  }
  return true;
}

// Auto-format decimal IP: clean input, allow digits and dots only
function autoFormatDecimal(val) {
  // Remove invalid chars except digits and dots
  val = val.replace(/[^\d.]/g, '');
  // Remove extra dots
  let parts = val.split('.');
  if(parts.length > 4) {
    parts = parts.slice(0, 4);
  }
  // Remove leading zeros from each octet (except '0')
  parts = parts.map(p => p.replace(/^0+(?=\d)/, ''));
  return parts.join('.');
}

// Auto-format binary IP: remove invalid chars, split every 8 bits by dot
function autoFormatBinary(val) {
  val = val.replace(/[^01]/g, '');
  const parts = [];
  for(let i = 0; i < val.length; i += 8) {
    parts.push(val.substring(i, i + 8));
  }
  return parts.join('.');
}

// Get IP class from decimal IP
function getIPClass(ip) {
  if (!validateDecimalIP(ip)) return '-';
  const firstOctet = Number(ip.split('.')[0]);
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  else if (firstOctet >= 240 && firstOctet <= 254) return 'E (Experimental)';
  else return 'Unknown';
}

// Get subnet mask and hosts count for classful IPs
function getSubnetAndHosts(ipClass) {
  switch (ipClass) {
    case 'A': return { mask: '255.0.0.0', hosts: 16777214 };
    case 'B': return { mask: '255.255.0.0', hosts: 65534 };
    case 'C': return { mask: '255.255.255.0', hosts: 254 };
    default: return { mask: '-', hosts: '-' };
  }
}

// Convert decimal IP to binary IP
function decimalToBinary(ip) {
  if (!validateDecimalIP(ip)) return null;
  return ip.split('.').map(octet => {
    let bin = Number(octet).toString(2);
    return bin.padStart(8, '0');
  }).join('.');
}

// Convert binary IP to decimal IP
function binaryToDecimal(ip) {
  if (!validateBinaryIP(ip)) return null;
  return ip.split('.').map(bin => parseInt(bin, 2)).join('.');
}

// Show feedback messages
function showFeedback(element, message, isValid) {
  element.textContent = message;
  element.className = 'feedback ' + (isValid ? 'valid' : 'invalid');
}

// Highlight element with animation
function highlightElement(el) {
  el.classList.add('highlight');
  setTimeout(() => el.classList.remove('highlight'), 1200);
}

// Add entry to conversion history
function addHistoryEntry(decimal, binary) {
  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.textContent = `Decimal: ${decimal} ↔ Binary: ${binary}`;
  historyLog.prepend(entry);
  if (historyLog.children.length > 10) {
    historyLog.removeChild(historyLog.lastChild);
  }
}

// Confetti on success
function confettiSuccess() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
  });
}

// State to track input mode to avoid loops
let inputMode = null; // 'decimal' or 'binary' or null

// Process input debounce
const processInputs = debounce(() => {
  const decValue = decimalIP.value.trim();
  const binValue = binaryIP.value.trim();

  const decValid = validateDecimalIP(decValue);
  const binValid = validateBinaryIP(binValue);

  showFeedback(decFeedback, decValid ? 'Valid Decimal IP' : 'Invalid Decimal IP', decValid);
  showFeedback(binFeedback, binValid ? 'Valid Binary IP' : 'Invalid Binary IP', binValid);

  convertBtn.disabled = !(decValid || binValid);

  if (!decValid && !binValid) {
    convertedDecimal.textContent = '-';
    convertedBinary.textContent = '-';
    ipClassEl.textContent = '-';
    subnetMaskEl.textContent = '-';
    hostsCountEl.textContent = '-';
    return;
  }

  if (decValid) {
    const ipClass = getIPClass(decValue);
    ipClassEl.textContent = ipClass;
    const { mask, hosts } = getSubnetAndHosts(ipClass);
    subnetMaskEl.textContent = mask;
    hostsCountEl.textContent = hosts;
  } else {
    ipClassEl.textContent = '-';
    subnetMaskEl.textContent = '-';
    hostsCountEl.textContent = '-';
  }
}, 300);

// Event listeners for decimal IP input
decimalIP.addEventListener('input', () => {
  if (inputMode === 'binary') return;
  inputMode = 'decimal';

  const formatted = autoFormatDecimal(decimalIP.value);
  if (decimalIP.value !== formatted) decimalIP.value = formatted;

  if (binaryIP.value) binaryIP.value = '';
  processInputs();

  inputMode = null;
});

// Event listeners for binary IP input
binaryIP.addEventListener('input', () => {
  if (inputMode === 'decimal') return;
  inputMode = 'binary';

  const formatted = autoFormatBinary(binaryIP.value);
  if (binaryIP.value !== formatted) binaryIP.value = formatted;

  if (decimalIP.value) decimalIP.value = '';
  processInputs();

  inputMode = null;
});

// Convert button click handler
convertBtn.addEventListener('click', () => {
  let decValue = decimalIP.value.trim();
  let binValue = binaryIP.value.trim();
  let convDec = null, convBin = null;

  if (validateDecimalIP(decValue)) {
    convBin = decimalToBinary(decValue);
    convDec = decValue;
  } else if (validateBinaryIP(binValue)) {
    convDec = binaryToDecimal(binValue);
    convBin = binValue;
  }

  if (convDec && convBin) {
    convertedDecimal.textContent = convDec;
    convertedBinary.textContent = convBin;

    const ipClass = getIPClass(convDec);
    ipClassEl.textContent = ipClass;
    const { mask, hosts } = getSubnetAndHosts(ipClass);
    subnetMaskEl.textContent = mask;
    hostsCountEl.textContent = hosts;

    addHistoryEntry(convDec, convBin);

    highlightElement(convertedDecimal);
    highlightElement(convertedBinary);

    confettiSuccess();
  }
});

// Initialize on load
processInputs();
