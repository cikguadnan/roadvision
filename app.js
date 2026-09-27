const video=document.querySelector('#camera');
const startBtn=document.querySelector('#startBtn');
const switchBtn=document.querySelector('#switchBtn');
const fullscreenBtn=document.querySelector('#fullscreenBtn');
const liveBadge=document.querySelector('#liveBadge');
const cameraName=document.querySelector('#cameraName');
const resolution=document.querySelector('#resolution');
const fpsEl=document.querySelector('#fps');
const emptyState=document.querySelector('#emptyState');
const message=document.querySelector('#message');
const systemStatus=document.querySelector('#systemStatus');

let stream=null;
let facingMode='environment';
let rafId=null;
let frames=0;
let fpsStart=performance.now();

function showMessage(text){message.textContent=text;message.hidden=false;}
function clearMessage(){message.hidden=true;message.textContent='';}

async function startCamera(){
  clearMessage();
  if(!navigator.mediaDevices?.getUserMedia){
    showMessage('Camera access is not supported in this browser. Try Safari on iPhone or Chrome on Android.');
    return;
  }
  try{
    stopTracks();
    systemStatus.textContent='Requesting camera permission…';
    stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:facingMode},width:{ideal:1920},height:{ideal:1080}},audio:false
    });
    video.srcObject=stream;
    await video.play();
    const track=stream.getVideoTracks()[0];
    const settings=track.getSettings();
    cameraName.textContent=track.label|| (facingMode==='environment'?'Rear camera':'Front camera');
    resolution.textContent=`${settings.width||video.videoWidth}×${settings.height||video.videoHeight}`;
    liveBadge.classList.add('on');liveBadge.innerHTML='<span></span> LIVE';
    emptyState.classList.add('hide');
    startBtn.classList.add('stop');startBtn.querySelector('b').textContent='Stop Camera';
    switchBtn.disabled=false;
    systemStatus.textContent='Live video pipeline active';
    startFpsMeter();
  }catch(err){
    console.error(err);
    stopCamera();
    let text='Could not access the camera.';
    if(err.name==='NotAllowedError') text='Camera permission was denied. Allow camera access in your browser settings and try again.';
    else if(err.name==='NotFoundError') text='No camera was found on this device.';
    else if(err.name==='NotReadableError') text='The camera is busy or unavailable. Close other apps using it and try again.';
    showMessage(text);
    systemStatus.textContent='Camera unavailable';
  }
}

function stopTracks(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
}

function stopCamera(){
  stopTracks();
  video.srcObject=null;
  cancelAnimationFrame(rafId);
  fpsEl.textContent='0';
  liveBadge.classList.remove('on');liveBadge.innerHTML='<span></span> OFFLINE';
  startBtn.classList.remove('stop');startBtn.querySelector('b').textContent='Start Camera';
  switchBtn.disabled=true;
  cameraName.textContent='Not started';resolution.textContent='—';
  emptyState.classList.remove('hide');
  systemStatus.textContent='Ready for camera access';
}

function startFpsMeter(){
  frames=0;fpsStart=performance.now();
  const tick=(now)=>{
    if(!stream)return;
    frames++;
    if(now-fpsStart>=1000){fpsEl.textContent=Math.round(frames*1000/(now-fpsStart));frames=0;fpsStart=now;}
    rafId=requestAnimationFrame(tick);
  };
  rafId=requestAnimationFrame(tick);
}

startBtn.addEventListener('click',()=>stream?stopCamera():startCamera());
switchBtn.addEventListener('click',async()=>{facingMode=facingMode==='environment'?'user':'environment';await startCamera();});
fullscreenBtn.addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }catch(e){console.warn(e);}
});

video.addEventListener('loadedmetadata',()=>{if(video.videoWidth)resolution.textContent=`${video.videoWidth}×${video.videoHeight}`;});
window.addEventListener('pagehide',stopTracks);