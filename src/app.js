import { parseIngredients } from './parser.js';
import { analyzeCosmetic, analyzeMedicine } from './ruleEngine.js';
import { recognizeImageFile, requestCameraAccess, captureFrameAndRecognize } from './ocr.js';
import { decodeImageFile, startCameraBarcodeScan, stopCameraBarcodeScan } from './barcode.js';

const $ = sel => document.querySelector(sel);

// Theme management
function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('mediglow_theme', theme);
  const ic = document.getElementById('themeIcon');
  if (ic) ic.style.transform = theme === 'dark' ? 'rotate(40deg)' : 'rotate(0deg)';
}

function lightMode() {
  applyTheme('light');
}

function darkMode() {
  applyTheme('dark');
}

function themeToggle() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

function readProfile(){
  return {
    skinType: $('#skinType').value,
    allergies: ($('#allergies').value||'').toLowerCase(),
    age: Number($('#age').value)||null,
    pregnancy: $('#pregnancy').value,
    riskSensitivity: $('#sensitivity').value
  };
}

async function analyzeBtn() {
  const productType = $('#productType').value;
  const productName = $('#productName').value || 'Unnamed Product';
  const raw = $('#ingredientText').value;

  if (!raw || raw.trim().length === 0) {
    showToast('Please enter product ingredients first', 3000);
    return;
  }

  try {
    showToast('Running safety analysis...');
    $('#jsonOut').textContent = 'Analyzing...';
    const profile = readProfile();
    const parsed = parseIngredients(raw, productType);

    let out;
    if (productType === 'Cosmetic') {
      out = await analyzeCosmetic({ productName, ingredients: parsed, profile, sensitivity: profile.riskSensitivity });
    } else {
      out = analyzeMedicine({ productName, ingredients: parsed, profile });
    }

    $('#jsonOut').textContent = JSON.stringify(out, null, 2);
    $('#humanSummary').textContent = buildHumanSummary(out);
    showToast('Analysis complete!', 2000);

    const rp = document.querySelector('.result-pane');
    if (rp) {
      rp.classList.remove('animate');
      void rp.offsetWidth;
      rp.classList.add('animate');
    }
  } catch (e) {
    showToast('Analysis failed: ' + e.message, 4000);
    $('#jsonOut').textContent = 'Analysis Error: ' + e.message;
  }
}

async function ocrImageBtn() {
  const f = $('#ocrImage').files && $('#ocrImage').files[0];
  if (!f) {
    showToast('Please select an image file first', 3000);
    return;
  }
  try {
    showToast('Running OCR... this may take a moment');
    $('#jsonOut').textContent = 'Running OCR...';
    const text = await recognizeImageFile(f);
    if (!text || text.trim().length === 0) {
      showToast('No text detected in image', 3000);
      $('#jsonOut').textContent = 'No text detected. Try a clearer image.';
      return;
    }
    $('#ingredientText').value = text;
    $('#jsonOut').textContent = 'OCR complete. Click Analyze to run safety analysis.';
    showToast('OCR successful! Click Analyze to continue.', 3000);
  } catch (e) {
    showToast('OCR failed: ' + e.message, 4000);
    $('#jsonOut').textContent = 'OCR Error: ' + e.message;
  }
}

// Helper: ensure camera is ready, request if needed
async function ensureCameraReady() {
  const ocrV = document.getElementById('ocrVideo');
  const barV = document.getElementById('barcodeVideo');
  const existingStream = (ocrV && ocrV.srcObject) || (barV && barV.srcObject);
  if (existingStream && ocrV && barV) {
    ocrV.srcObject = barV.srcObject = existingStream;
    ocrV.hidden = barV.hidden = false;
    ocrV.style.display = barV.style.display = 'block';
    await Promise.all([ocrV.play().catch(() => {}), barV.play().catch(() => {})]);
    $('#permissionStatus').textContent = 'Camera: ✓ Active';
    $('#permissionStatus').style.color = '#10b06f';
    return true;
  }
  try {
    const stream = await requestCameraAccess();
    if (ocrV && barV) {
      ocrV.srcObject = barV.srcObject = stream;
      ocrV.hidden = barV.hidden = false;
      ocrV.style.display = barV.style.display = 'block';
      await Promise.all([ocrV.play().catch(() => {}), barV.play().catch(() => {})]);
    }
    $('#permissionStatus').textContent = 'Camera: ✓ Active';
    $('#permissionStatus').style.color = '#10b06f';
    $('#startBarcodeCamBtn').disabled = false;
    return true;
  } catch (e) {
    $('#permissionStatus').textContent = 'Camera: ✗ Denied';
    $('#permissionStatus').style.color = '#dc2626';
    throw e;
  }
}

async function ocrCameraBtn() {
  const video = document.getElementById('ocrVideo');
  try {
    if (!video || !video.srcObject) await ensureCameraReady();
  } catch (e) {
    showToast('Camera permission denied or not available', 4000);
    return;
  }
  if (!video || !video.srcObject) return;
  try {
    showToast('Capturing frame for OCR...');
    $('#jsonOut').textContent = 'Capturing frame for OCR...';
    const text = await captureFrameAndRecognize(video);
    if (!text || text.trim().length === 0) {
      showToast('No text detected in frame', 3000);
      $('#jsonOut').textContent = 'No text detected. Try a clearer angle.';
      return;
    }
    $('#ingredientText').value = text;
    $('#jsonOut').textContent = 'OCR complete. Click Analyze to run safety analysis.';
    showToast('OCR successful! Click Analyze to continue.', 3000);
  } catch (e) {
    showToast('Camera OCR failed: ' + e.message, 4000);
    $('#jsonOut').textContent = 'Camera OCR Error: ' + e.message;
  }
}

async function barcodeImageBtn() {
  const f = $('#barcodeImage').files && $('#barcodeImage').files[0];
  if (!f) {
    showToast('Please select an image file first', 3000);
    return;
  }
  try {
    showToast('🔍 Scanning image for barcodes...');
    $('#barcodeResult').textContent = 'Scanning image for barcodes...';
    const result = await decodeImageFile(f);
    
    if (result.success && result.barcodes && result.barcodes.length > 0) {
      const formattedData = result.barcodes.map((b, i) => ({
        index: i + 1,
        barcode: b.rawValue,
        format: b.format,
        detected_at: b.timestamp || new Date().toISOString()
      }));
      
      $('#barcodeResult').textContent = JSON.stringify(formattedData, null, 2);
      
      // Populate first barcode
      if (result.barcodes[0].rawValue) {
        $('#productName').value = result.barcodes[0].rawValue;
        showToast(`✓ ${result.barcodes.length} barcode(s) detected!`, 3000);
      }
    } else {
      $('#barcodeResult').textContent = result.message || 'No barcode detected in image.';
      showToast('No barcode found. Try a clearer image.', 3000);
    }
  } catch (e) {
    showToast('❌ Barcode scan failed: ' + e.message, 4000);
    $('#barcodeResult').textContent = 'Barcode Scan Error: ' + e.message;
  }
}

async function startBarcodeCamBtn() {
  const video = document.getElementById('barcodeVideo');
  try {
    if (!video || !video.srcObject) await ensureCameraReady();
  } catch (e) {
    showToast('Camera permission denied or not available', 4000);
    return;
  }
  if (!video || !video.srcObject) return;
  
  try {
    showToast('🔍 Starting barcode scanner...');
    $('#barcodeResult').textContent = 'Barcode scanner active. Point camera at barcode...\n\nWaiting for detection...';
    
    let detectionCount = 0;
    
    await startCameraBarcodeScan(video, (barcodes) => {
      if (barcodes && barcodes.length > 0) {
        detectionCount++;
        
        const formattedData = barcodes.map((b, i) => ({
          detection: detectionCount,
          sequence: i + 1,
          barcode: b.rawValue,
          format: b.format,
          detected_at: b.timestamp
        }));
        
        $('#barcodeResult').textContent = `✓ Detection #${detectionCount}\n\n${JSON.stringify(formattedData, null, 2)}`;
        
        if (barcodes[0] && barcodes[0].rawValue) {
          $('#productName').value = barcodes[0].rawValue;
          showToast(`✓ Barcode detected: ${barcodes[0].rawValue}`, 2000);
        }
        
        $('#startBarcodeCamBtn').disabled = true;
        $('#stopBarcodeCamBtn').disabled = false;
      }
    }, video.srcObject);
    
    $('#startBarcodeCamBtn').disabled = true;
    $('#stopBarcodeCamBtn').disabled = false;
    showToast('✓ Barcode scanner active', 2000);
  } catch (e) {
    showToast('❌ Camera barcode start failed: ' + e.message, 4000);
    $('#barcodeResult').textContent = 'Barcode Scanner Error: ' + e.message;
  }
}


function stopBarcodeCamBtn() {
  const video = document.getElementById('barcodeVideo');
  const startBtn = $('#startBarcodeCamBtn');
  const stopBtn = $('#stopBarcodeCamBtn');
  try {
    stopCameraBarcodeScan(video);
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    $('#barcodeResult').textContent = 'Camera stopped. Click Start Scan to resume.';
    showToast('Barcode scanner stopped', 2000);
  } catch (e) {
    showToast('Error stopping scanner: ' + e.message, 3000);
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
  }
}

// Stop camera streams (pause without full power off)
function stopCameraBtn() {
  try {
    const ocrV = document.getElementById('ocrVideo');
    const barV = document.getElementById('barcodeVideo');
    const startBtn = $('#startBarcodeCamBtn');
    const stopBtn = $('#stopBarcodeCamBtn');
    const ocrCamBtn = $('#ocrCameraBtn');
    const stopCameraBtnEl = $('#stopCameraBtn');

    // Stop barcode scanner if active
    if (barV) {
      try {
        stopCameraBarcodeScan(barV);
      } catch (e) {
        console.warn('Error stopping barcode scan:', e);
      }
    }

    // Pause video playback but keep stream active
    let videosStopped = 0;
    if (ocrV) {
      try {
        ocrV.pause();
        ocrV.currentTime = 0;
        videosStopped++;
      } catch (e) {
        console.warn('Error pausing OCR video:', e);
      }
    }

    if (barV) {
      try {
        barV.pause();
        barV.currentTime = 0;
        videosStopped++;
      } catch (e) {
        console.warn('Error pausing barcode video:', e);
      }
    }

    // Disable camera-dependent buttons
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (ocrCamBtn) ocrCamBtn.disabled = true;
    if (stopCameraBtnEl) stopCameraBtnEl.disabled = false;

    $('#barcodeResult').textContent = 'Camera paused. Click "Request Camera" to resume.';
    showToast(`✓ ${videosStopped} camera(s) stopped`, 2000);
  } catch (e) {
    showToast('Error stopping camera: ' + e.message, 3000);
    console.error('Camera stop error:', e);
  }
}

async function requestCameraBtn() {
  const permissionStatus = $('#permissionStatus');
  try {
    permissionStatus.textContent = 'Requesting camera access...';
    showToast('Requesting camera permission...');
    const stream = await requestCameraAccess();
    const ocrV = document.getElementById('ocrVideo');
    const barV = document.getElementById('barcodeVideo');
    if (ocrV && barV) {
      ocrV.srcObject = barV.srcObject = stream;
      ocrV.hidden = barV.hidden = false;
      ocrV.style.display = barV.style.display = 'block';
      await Promise.all([ocrV.play().catch(() => {}), barV.play().catch(() => {})]);
    }
    permissionStatus.textContent = 'Camera: ✓ Active';
    permissionStatus.style.color = '#10b06f';
    $('#startBarcodeCamBtn').disabled = false;
    $('#ocrCameraBtn').disabled = false;
    showToast('Camera access granted!', 2000);
  } catch (e) {
    permissionStatus.textContent = 'Camera: ✗ Denied';
    permissionStatus.style.color = '#dc2626';
    showToast('Camera permission denied or not available', 4000);
  }
}

function downloadBtn() {
  const txt = $('#jsonOut').textContent;
  if (!txt || txt === '' || txt === '{/* results will appear here */}') {
    showToast('No analysis results to download. Run analysis first.', 3000);
    return;
  }
  try {
    const blob = new Blob([txt], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediglow_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Analysis downloaded successfully!', 2000);
  } catch (e) {
    showToast('Download failed: ' + e.message, 3000);
  }
}

function clearBtn() {
  try {
    $('#productName').value = '';
    $('#ingredientText').value = '';
    $('#ocrImage').value = '';
    $('#barcodeImage').value = '';
    $('#allergies').value = '';
    $('#age').value = '';
    $('#jsonOut').textContent = '{/* results will appear here */}';
    $('#humanSummary').textContent = 'Run analysis to see a concise summary here.';
    $('#barcodeResult').textContent = '';
    showToast('Form cleared successfully', 2000);
  } catch (e) {
    showToast('Error clearing form: ' + e.message, 3000);
  }
}

function showToast(msg, ms=2500){
  const t = document.getElementById('toast');
  if(!t) return; t.textContent = msg; t.hidden = false; t.style.opacity=1; t.style.transform='translateY(0)';
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(()=>{ t.style.transition='opacity 300ms, transform 300ms'; t.style.opacity=0; t.style.transform='translateY(12px)'; setTimeout(()=>t.hidden=true,300); }, ms);
}

function buildHumanSummary(result){
  try{
    const pa = result.Product_Analysis || result.Medicine_Analysis || {};
    const score = pa.Personalized_Safety_Score? pa.Personalized_Safety_Score['Overall Product Safety Score'] : (pa.Informational_Safety_Rating||'N/A');
    const suit = pa.Personalized_Safety_Score? pa.Personalized_Safety_Score['Suitability Score for THIS user'] : 'N/A';
    const preg = pa.Pregnancy_Risk_Assessment || (pa.Safety_Checks && pa.Safety_Checks['Pregnancy warning']) || 'Not applicable';
    const flags = pa.Harmful_Chemical_Detection || {};
    const topFlags = Object.entries(flags).filter(([k,v])=>!v.startsWith('Not Present')).map(([k,v])=>`${k}: ${v}`).slice(0,3);
    const parts = [];
    parts.push(`Overall safety score: ${score}/10 — Suitability: ${suit}/10`);
    if(topFlags.length) parts.push(`Top concerns: ${topFlags.join('; ')}`);
    if(preg) parts.push(`Pregnancy guidance: ${preg}`);
    if(pa.Cumulative_Risk_Analysis) parts.push(`Irritation load: ${pa.Cumulative_Risk_Analysis['Total Irritation Load']}`);
    return parts.join('\n');
  }catch(e){ return 'Summary unavailable'; }
}

// Expose functions for HTML onclick handlers
Object.assign(window, {
  themeToggle,
  lightMode,
  darkMode,
  ocrImageBtn,
  ocrCameraBtn,
  requestCameraBtn,
  barcodeImageBtn,
  startBarcodeCamBtn,
  stopBarcodeCamBtn,
  analyzeBtn,
  downloadBtn,
  clearBtn,
  stopCameraBtn
});

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('mediglow_theme');
  if (saved) applyTheme(saved);
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  $('#ocrImage')?.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) showToast(`Selected: ${f.name}. Click "OCR Image" to extract text.`, 2500);
  });
  $('#barcodeImage')?.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) showToast(`Selected: ${f.name}. Click "Scan Image" to read barcode.`, 2500);
  });
});

// Expose simple helper for future OCR integration
export async function analyzeFromText(rawText, options={}){
  const parsed = parseIngredients(rawText);
  if(options.type === 'Medicine') return analyzeMedicine({productName: options.name||'Unnamed', ingredients: parsed, profile: options.profile||{}});
  return await analyzeCosmetic({productName: options.name||'Unnamed', ingredients: parsed, profile: options.profile||{}});
}
