let _cameraStream = null;
let _cameraInterval = null;
let _weOwnStream = true;

// Try to detect QR code using jsQR
function detectQRCode(imageData) {
  if (typeof jsQR !== 'undefined') {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        return {
          success: true,
          data: code.data,
          format: 'QR_CODE'
        };
      }
    } catch (e) {
      console.debug('jsQR error:', e.message);
    }
  }
  return null;
}

// ZXing helper function
function initZXing() {
  if (typeof ZXing !== 'undefined') {
    return {
      codeReader: new ZXing.BrowserMultiFormatReader(),
      available: true
    };
  }
  return { available: false };
}

export async function decodeImageFile(file) {
  if (!file) throw new Error('No file provided');
  
  try {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Try QR code first with jsQR (most reliable for QR)
    const qrResult = detectQRCode(imageData);
    if (qrResult && qrResult.success) {
      return {
        success: true,
        message: 'QR Code detected',
        method: 'jsQR',
        barcodes: [{
          rawValue: qrResult.data,
          format: 'QR_CODE',
          timestamp: new Date().toISOString()
        }]
      };
    }

    // Try native BarcodeDetector
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({
          formats: ['code_128', 'ean_13', 'qr_code', 'code_39', 'upca', 'upce', 'ean_8']
        });
        const barcodes = await detector.detect(img);
        
        if (barcodes && barcodes.length > 0) {
          return {
            success: true,
            message: `Found ${barcodes.length} barcode(s)`,
            method: 'BarcodeDetector',
            barcodes: barcodes.map(b => ({
              rawValue: b.rawValue || 'Unknown',
              format: b.format || 'Unknown',
              timestamp: new Date().toISOString()
            }))
          };
        }
      } catch (e) {
        console.debug('BarcodeDetector failed:', e.message);
      }
    }

    // Fallback to ZXing for 1D barcodes
    const zxing = initZXing();
    if (zxing.available) {
      try {
        const luminanceSource = new ZXing.RGBLuminanceSource(
          imageData.data,
          imageData.width,
          imageData.height
        );
        const binarizer = new ZXing.HybridBinarizer(luminanceSource);
        const binaryBitmap = new ZXing.BinaryBitmap(binarizer);
        
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
          ZXing.BarcodeFormat.EAN_8
        ]);
        
        const result = new ZXing.MultiFormatReader().decode(binaryBitmap, hints);
        
        return {
          success: true,
          message: 'Barcode detected',
          method: 'ZXing',
          barcodes: [{
            rawValue: result.text,
            format: result.getBarcodeFormat(),
            timestamp: new Date().toISOString()
          }]
        };
      } catch (e) {
        console.debug('ZXing decode failed:', e.message);
      }
    }

    // No barcode found
    return {
      success: false,
      message: 'No barcode or QR code detected in image',
      method: 'None',
      barcodes: []
    };

  } catch (e) {
    throw new Error(`Barcode decode failed: ${e.message}`);
  }
}

export async function startCameraBarcodeScan(videoEl, onDetected, existingStream = null) {
  try {
    if (existingStream) {
      _cameraStream = existingStream;
      _weOwnStream = false;
    } else {
      _cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      _weOwnStream = true;
    }
    
    videoEl.srcObject = _cameraStream;
    videoEl.hidden = false;
    videoEl.style.display = 'block';
    await videoEl.play();

    const canvas = document.createElement('canvas');
    let lastDetectionTime = 0;
    let detectionAttempts = 0;

    _cameraInterval = setInterval(async () => {
      try {
        const now = Date.now();
        if (now - lastDetectionTime < 300) return; // Debounce

        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) return;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        detectionAttempts++;

        // Try jsQR for QR codes first (fastest and most reliable)
        const qrResult = detectQRCode(imageData);
        if (qrResult && qrResult.success) {
          lastDetectionTime = now;
          onDetected([{
            rawValue: qrResult.data,
            format: 'QR_CODE',
            timestamp: new Date().toISOString()
          }]);
          return;
        }

        // Try native BarcodeDetector for 1D barcodes
        if ('BarcodeDetector' in window && detectionAttempts % 3 === 0) {
          try {
            const detector = new BarcodeDetector({
              formats: ['code_128', 'ean_13', 'code_39', 'upca', 'upce', 'ean_8']
            });
            const barcodes = await detector.detect(videoEl);
            if (barcodes && barcodes.length > 0) {
              lastDetectionTime = now;
              onDetected(barcodes.map(b => ({
                rawValue: b.rawValue || 'Unknown',
                format: b.format || 'Unknown',
                timestamp: new Date().toISOString()
              })));
              return;
            }
          } catch (e) {
            console.debug('Native detector frame error');
          }
        }

        // Try ZXing as backup (every 3rd frame to save CPU)
        if (detectionAttempts % 3 === 0) {
          const zxing = initZXing();
          if (zxing.available) {
            try {
              const luminanceSource = new ZXing.RGBLuminanceSource(
                imageData.data,
                imageData.width,
                imageData.height
              );
              const binarizer = new ZXing.HybridBinarizer(luminanceSource);
              const binaryBitmap = new ZXing.BinaryBitmap(binarizer);

              const hints = new Map();
              hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
              hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.BarcodeFormat.CODE_128,
                ZXing.BarcodeFormat.EAN_13,
                ZXing.BarcodeFormat.CODE_39,
                ZXing.BarcodeFormat.UPC_A,
                ZXing.BarcodeFormat.UPC_E,
                ZXing.BarcodeFormat.EAN_8
              ]);

              const result = new ZXing.MultiFormatReader().decode(binaryBitmap, hints);
              
              if (result) {
                lastDetectionTime = now;
                onDetected([{
                  rawValue: result.text,
                  format: result.getBarcodeFormat(),
                  timestamp: new Date().toISOString()
                }]);
              }
            } catch (e) {
              // Silently ignore
            }
          }
        }
      } catch (e) {
        console.debug('Frame processing error:', e.message);
      }
    }, 100);

  } catch (e) {
    throw new Error(`Camera barcode scan failed: ${e.message}`);
  }
}

export function stopCameraBarcodeScan(videoEl) {
  if (_cameraInterval) {
    clearInterval(_cameraInterval);
    _cameraInterval = null;
  }

  if (_cameraStream && _weOwnStream) {
    _cameraStream.getTracks().forEach(t => {
      try {
        t.stop();
      } catch (e) {
        console.warn('Error stopping track:', e);
      }
    });
  }

  _cameraStream = null;

  if (videoEl) {
    try {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoEl.srcObject = null;
      videoEl.hidden = true;
      videoEl.style.display = 'none';
    } catch (e) {
      console.warn('Error stopping video:', e);
    }
  }
}
