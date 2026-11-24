// Classic worker: MediaPipe WASM uses importScripts internally.
let detector;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const {FilesetResolver,PoseLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   detector=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'VIDEO',numPoses:2,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6,outputSegmentationMasks:false});
   self.postMessage({type:'ready'});
  }else if(data.type==='frame'){
   try{const result=detector.detectForVideo(data.frame,data.t);self.postMessage({type:'pose',t:data.t,poses:result.landmarks});}finally{data.frame.close();}
  }
 }catch(error){self.postMessage({type:'error',message:String(error.message||error)});}
};
