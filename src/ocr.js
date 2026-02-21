export async function recognizeImageFile(file){
  if(!file) throw new Error('No file');
  // Use Tesseract.js global if available
  if(typeof Tesseract === 'undefined') throw new Error('Tesseract.js not loaded');
  const { data } = await Tesseract.recognize(file, 'eng', { logger: m=>{} });
  return data.text || '';
}

export async function requestCameraAccess(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    // keep stream consumer control to caller
    return stream;
  }catch(e){
    throw e;
  }
}

export async function captureFrameAndRecognize(videoElement){
  if(!videoElement || !videoElement.videoWidth) throw new Error('Video not ready');
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth; canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement,0,0,canvas.width,canvas.height);
  const blob = await new Promise(r=>canvas.toBlob(r,'image/png'));
  const text = await recognizeImageFile(blob);
  return text;
}

