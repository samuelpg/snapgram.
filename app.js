navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(userHasAccepted).catch(userHasDenied);
//Variables
var stream;
function userHasAccepted(mediaStream){
    stream = mediaStream;
}
function userHasDenied(err){
  console.log(err);
}
//Indexable DB
var indexedDB = window.indexedDB;
var database, request;

request = indexedDB.open("STG", 1);
request.onsuccess = ()=>{
  database = request.result;
  console.log("Se abrio la base de datos");
  seeGallery();
}
request.onupgradeneeded = ()=>{
  database = request.result;
  database.createObjectStore("multimedia", {keyPath: "id"});
  console.log("Se cambio la estructura de la base de datos");
}
//new video Variables
var newVideo = document.querySelector("#new_video");
var newVideoInput = document.querySelector("#new_video_input");
var videoFeedback = document.querySelector("#video_feedback");
var videoControls = document.querySelector("#video_controls");
var videoStartStop = document.querySelector("#video_start_stop");
var finalVideoSave = document.querySelector("#final_video_save");
var finalVideo = document.querySelector("#final_video");
var videoName = document.querySelector("#video_name");
var videoDesc = document.querySelector("#video_desc");
var saveVideo = document.querySelector("#save_video");
var videoEffect = document.querySelector("#video_effect");
var videoCutStart = document.querySelector("#video_cut_start");
var videoCutStop = document.querySelector("#video_cut_stop");
var videoCut = document.querySelector("#cut_video");
var cancelVideo = document.querySelector("#cancel_video");
var retakeVideo = document.querySelector("#retake_video");
var timeLeftVideo = document.querySelector("#time_left_video");
//Video Methods
newVideo.onclick = ()=>{
  videoFeedback.srcObject = stream;
  newVideoInput.className = "center";
  gallery.className = "hidden";
}

var timer, milli, mediaRecorder, videoLength;
var videoChunk = new Array();
function startVideoRecording(){
  videoEffect.className = "hidden";
  let time = 31;
  if(videoEffect.value === "normal"){
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(10);
    mediaRecorder.ondataavailable = addVideoChunk;
    mediaRecorder.onstop = processVideoChunk;
    timer = new Worker("timer.js");
    timer.onmessage = (e)=>{
      mili = e.data;
      timeLeftVideo.textContent = time;
      if(mili % 1000 === 0){
        time -= 1;
        videoLength = 30 - time;
        if(time === 0){
          mediaRecorder.stop();
        }
      }
      videoStartStop.onclick = stopVideoRecording;
      videoStartStop.textContent = "Stop";
    }
  }else{
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(10000);
    setTimeout(function(){
      try{
        mediaRecorder.stop();
      }catch(err){
        console.log(err);
      }
    }, 2000);
    mediaRecorder.onstop = processVideoBoom;
    mediaRecorder.ondataavailable = addBoomChunk;
  }
}
var timeSlice = new Array();
function addVideoChunk(chunk){
  videoChunk.push(chunk.data);
  timeSlice.push({
    "time":mili,
    "size":chunk.data.size
  })
}

var videoBlob, size;
function processVideoChunk(){
  timer.terminate();
  videoBlob = new Blob(videoChunk, {"type":"video/webm; codecs=opus"});
  size = videoBlob.size;
  let fr = new FileReader();
  fr.readAsDataURL(videoBlob);
  fr.onload = (e)=>{
    finalVideo.src = e.target.result;
  }
  videoFeedback.className = "hidden";
  videoControls.className = "hidden";
  finalVideoSave.className = "";
  //videoBlob = null;
  videoChunk = [];
}
function stopVideoRecording(){
  mediaRecorder.stop();
  videoStartStop.onclick = startVideoRecording;
  videoStartStop.textContent = "Start";
}
videoStartStop.onclick = startVideoRecording;

function saveVideoTaken(boom, name, desc){
  let x = getNewId();
  //console.log(videoBlob);
  let object = {
    "type":"video",
    "url": videoBlob,
    "name":name,
    "desc":desc,
    "id":x,
    "boom":boom
  }
  console.log(object);
  request = database.transaction(["multimedia"],"readwrite");
  request = request.objectStore("multimedia").add(object);
  request.onsuccess = ()=>{
    console.log("Added");
    newVideoInput.className = "hidden";
    videoChunk = [];
    finalVideo.src = "";
    finalVideoSave.className = "hidden";
    videoFeedback.className = "";
    videoControls.className = "";
    videoName.value = "";
    videoDesc.value = "";
    videoBlob = null;
    gallery.className = "";
    boomerang.className = "hidden"
    videoEffect.className = "";
    timeLeftVideo.textContent = "";
  }
  request.onerror = (e)=>{
    console.log(e);
  }
  addToGallery(object, true);
}

saveVideo.onclick = ()=>{
  saveVideoTaken(false, videoName.value, videoDesc.value);
}

cancelVideo.onclick = ()=>{
  newVideoInput.className = "hidden";
  videoChunk = [];
  videoBlob = null;
  finalVideo.src = "";
  finalVideoSave.className = "hidden";
  videoFeedback.className = "";
  videoControls.className = "";
  videoName.value = "";
  videoDesc.value = "";
  gallery.className = "";
  boomerang.className = "hidden"
  videoEffect.className = "";
  timeLeftVideo.textContent = "";
}
retakeVideo.onclick = retakeMyVideo;
function retakeMyVideo(){
  videoChunk = [];
  videoBlob = null;
  finalVideo.src = "";
  finalVideoSave.className = "hidden";
  videoFeedback.className = "";
  videoControls.className = "";
  videoName.value = "";
  videoDesc.value = "";
  boomerang.className = "hidden"
  videoEffect.className = "";
  timeLeftVideo.textContent = "";
  videoStartStop.textContent = "Grabar"
  timeLeftVideo.textContent = "";
  timeLeftVideo.className = "clock";
}
function cutVideo(){
  let start = videoCutStart.value;
  let stop = videoCutStop.value;
  console.log(start);
  console.log(stop)
  console.log((start<stop) && (start>0 && stop>0) && (start<=30 && stop<=30));
  console.log(start<stop);
  console.log(start<=30 && stop<=30);
  console.log(start>0 && stop>0);
  if((start>0 && stop>0) && (start<=30 && stop<=30)){
    try{
      let byteStart = returnByteStart(start*1000, timeSlice);
      let byteRemove = returnByteStart(stop*1000, timeSlice);
      console.log(byteStart);
      console.log(byteRemove);
      let x = videoBlob.slice(0, byteStart);
      let y = videoBlob.slice(byteRemove);
      console.log(videoBlob);
      videoBlob = new Blob([x, y],{ "type":"video/webm; codecs=opus"})
      let fr = new FileReader();
      console.log(videoBlob);
      console.log(x);
      fr.readAsDataURL(videoBlob);
      fr.onload = (e)=>{
        finalVideo.src = e.target.result;
      }
      }catch(err){
        console.log(err);
      }
  }
}

function returnByteStart(n, x){
  let sum = 0;
  x.forEach(function(i){
    if(i.time <= n){
      sum += i.size
    }
  })
  return sum;
}

videoCut.onclick = cutVideo;
//Boomerang effect
function addBoomChunk(e){
  videoChunk.push(e.data);
}

var boomerang = document.querySelector("#boomerang");
var videoBoom = document.querySelector("#video_boom");
var nameBoom = document.querySelector("#video_name_boom");
var descBoom = document.querySelector("#video_desc_boom");
var saveBoom = document.querySelector("#save_video_boom");

function processVideoBoom(){
  videoBlob = new Blob(videoChunk, {"type":"video/webm; codecs=opus"});
  videoBoom.src = window.URL.createObjectURL(videoBlob);
  videoBoom.onended = ()=>{
    boomerangEffect(videoBoom)
  }
  boomerang.className = "";
  videoFeedback.className = "hidden";
  videoControls.className = "hidden";
}

function boomerangEffect(x){
  let run = setInterval(()=>{
    x.currentTime -= 0.1;
  }, 100);
  setTimeout(function() {
    clearInterval(run);
    x.play();
  }, x.duration * 1000);
}

saveBoom.onclick = ()=>{
  saveVideoTaken(true, nameBoom.value, descBoom.value);
}
//new Picture Variables
//Related Variables
var newPicture = document.querySelector("#new_picture");
var newImgInput = document.querySelector("#new_img_input");
var imgFeedbackModal = document.querySelector("#img_feedback_modal");
var imgFeedback = document.querySelector("#img_feedback");
var imgDelay =  document.querySelector("#img_delay");
var takeImg = document.querySelector("#take_img");
var imgResultModal = document.querySelector("#img_result_modal");
var imgFinalEdit = document.querySelector("#img_final_edit");
var imgName = document.querySelector("#img_name");
var imgDesc = document.querySelector("#img_desc");
var imgSave = document.querySelector("#img_save");
var cancelImg = document.querySelector("#cancel_img");
var retake = document.querySelector("#retake_img");
var imgClock = document.querySelector("#img_clock");
newPicture.onclick = ()=>{
  imgFeedback.srcObject = stream;
  newImgInput.className = "center";
  gallery.className = "hidden"
}

function takePic(){
  let mediaRecorder = new MediaRecorder(stream);
  imgFinalEdit.width = 500;
  imgFinalEdit.height = 375;
  let context = imgFinalEdit.getContext("2d");
  switch (imgDelay.value) {
    case "zero":
      context.drawImage(imgFeedback, 0, 0, 500, 375);
      imgFeedbackModal.className = "hidden";
      imgResultModal.className = "";
      break;
    case "three":
      let time = 2;
      imgClock.textContent = 3;
      let y = setInterval(()=>{
        imgClock.textContent = time;
        time -= 1;
      }, 1000);
      setTimeout(()=>{
        clearInterval(y);
      }, 3000);
      setTimeout(function(){
      context.drawImage(imgFeedback, 0, 0, 500, 375);
      imgFeedbackModal.className = "hidden";
      imgResultModal.className = "";
      }, 3000);
      break;
  }
}
takeImg.onclick = takePic;

function savePic(){
  let urlEncoded = imgFinalEdit.toDataURL("img/png");
  let name = imgName.value;
  let desc = imgDesc.value;
  let x = getNewId();
  let object = {
    "type":"photo",
    "url":urlEncoded,
    "name":name,
    "desc":desc,
    "id":x
  }
  request = database.transaction(["multimedia"],"readwrite");
  request = request.objectStore("multimedia").add(object);
  request.onsuccess = ()=>{
    console.log("Added");
    cancelImgTaken();
  }
  request.onerror = (e)=>{
    console.log(e);
  }
  addToGallery(object, true);
}

imgSave.onclick = savePic;

function cancelImgTaken(){
  newImgInput.className = "hidden";
  imgFeedbackModal.className = "";
  imgResultModal.className = "hidden";
  imgName.value = "";
  imgDesc.value = "";
  gallery.className = "";
  newImgInput.className = "hidden"
  imgClock.textContent = " ";
}

cancelImg.onclick = cancelImgTaken;
retake.onclick = ()=>{
  imgFeedbackModal.className = "";
  imgResultModal.className = "hidden";
  imgClock.textContent = " ";
}

var stickerSelected;
var ss = document.querySelector("#sticker_selected_size");
function selectSticker(id){
  stickerSelected = document.querySelector("#"+id);
  ss.src = stickerSelected.src;
}

document.querySelector("#bigger").onclick = ()=>{
  let a = ss.height;
  a += 10;
  if(a < 150){ss.style.height = a + "px";}
}
document.querySelector("#smaller").onclick = ()=>{
  let a = ss.height;
  a -= 10;
  if(a > 50){ss.style.height = a + "px";}
}

function addSticker(canvas, event){
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  canvas.getContext("2d").drawImage(ss, x - (ss.width/2) , y -(ss.height/2), ss.width, ss.height);
}

imgFinalEdit.onclick = (e)=>{
  addSticker(imgFinalEdit, e)
}

var stickerCategories = document.querySelector("#sticker_categories");

stickerCategories.onchange = ()=>{
  switch (stickerCategories.value) {
    case "games":
        document.querySelector("#sticker_games").className = "";
        document.querySelector("#sticker_hats").className = "hidden";
        document.querySelector("#sticker_glasses").className = "hidden";
        document.querySelector("#sticker_random").className = "hidden";
        document.querySelector("#sticker_frames").className = "hidden";
      break;
    case "hats":
        document.querySelector("#sticker_games").className = "hidden";
        document.querySelector("#sticker_hats").className = "";
        document.querySelector("#sticker_glasses").className = "hidden";
        document.querySelector("#sticker_random").className = "hidden";
        document.querySelector("#sticker_frames").className = "hidden";
      break;
    case "glasses":
        document.querySelector("#sticker_games").className = "hidden";
        document.querySelector("#sticker_hats").className = "hidden";
        document.querySelector("#sticker_glasses").className = "";
        document.querySelector("#sticker_random").className = "hidden";
        document.querySelector("#sticker_frames").className = "hidden";
      break;
    case "random":
        document.querySelector("#sticker_games").className = "hidden";
        document.querySelector("#sticker_hats").className = "hidden";
        document.querySelector("#sticker_glasses").className = "hidden";
        document.querySelector("#sticker_random").className = "";
        document.querySelector("#sticker_frames").className = "hidden";
      break;
    case "frames":
        document.querySelector("#sticker_games").className = "hidden";
        document.querySelector("#sticker_hats").className = "hidden";
        document.querySelector("#sticker_glasses").className = "hidden";
        document.querySelector("#sticker_random").className = "hidden";
        document.querySelector("#sticker_frames").className = "";
      break;
  }
}

function addFrame(id){
  let frame = document.querySelector("#"+id);
  var rect = imgFinalEdit.getBoundingClientRect();
  console.log(imgFinalEdit);
  imgFinalEdit.getContext("2d").drawImage(frame, 0 , 0, 500, 375);
}
//audio
//Related Variables
var newAudio = document.querySelector("#new_audio");
var newAudioModal = document.querySelector("#new_audio_modal");
var audioStartStop = document.querySelector("#audio_start_stop");
var audioTimeLeft = document.querySelector("#audio_time_left");
var finishedAudioModal = document.querySelector("#finished_audio_modal");
var finishedAudio = document.querySelector("#finished_audio");
var audioName = document.querySelector("#audio_name");
var audioDesc = document.querySelector("#audio_desc");
var audioSave = document.querySelector("#audio_save");
var audioCutStart = document.querySelector("#audio_cut_start");
var audioCutStop = document.querySelector("#audio_cut_stop");
var cutAudio= document.querySelector("#cut_audio");
var cancelAudio = document.querySelector("#cancel_audio");
var audioChunks = new Array();
var retakeAudio = document.querySelector("#retake_audio");
var audioRecordControls = document.querySelector("#audio_record_controls");
var thumbnail = document.querySelector("#thumbnail");
var thumbnail_url = "";
var audioClock = document.querySelector("#audio_clock")
//Methods

newAudio.onclick = ()=>{
  newAudioModal.className = "center";
  gallery.className = "hidden";
}
let audioTimeSize = new Array();
function startRecording(){
  mediaRecorder = new MediaRecorder(stream);
  timer = new Worker("timer.js");
  let time = 31;
  timer.onmessage = (e)=>{
    mili = e.data;
    audioClock.textContent = time;
    if(mili % 1000 === 0){
      time -= 1;
      if(time === 0){
        mediaRecorder.stop();
        timer.terminate();
      }
    }
  }
  audioStartStop.onclick = stopRecording;
  audioStartStop.textContent = "Stop";
  mediaRecorder.start(10);
  mediaRecorder.ondataavailable = (e)=>{
    audioChunks.push(e.data)
    audioTimeSize.push({
      "time":mili,
      "size":e.data.size
    })
  }
  mediaRecorder.onstop = processAudio;
}
var audioBlob;
function processAudio(){
  audioStartStop.onclick = startRecording;
  audioStartStop.textContent = "Grabar"
  audioBlob = new Blob(audioChunks, {"type":"audio/webm; codecs=opus"});
  let fr = new FileReader();
  fr.readAsDataURL(audioBlob);
  fr.onload = (e)=>{
    finishedAudio.src = e.target.result;
  }
  audioChunks = [];
  audioRecordControls.className = "hidden";
  finishedAudioModal.className = "";
}

function stopRecording(){
    timer.terminate();
    mediaRecorder.stop();
    audioStartStop.onclick = startRecording;
    audioStartStop.textContent = "Grabar";
}

audioStartStop.onclick = startRecording;

var th = document.querySelector("#thumb");
thumbnail.onchange = (e)=>{
  let file = e.target.files[0]
  let fr = new FileReader();
  fr.readAsDataURL(file);
  fr.onload = (e)=>{
    th.src = e.target.result;
    thumbnail_url = e.target.result;
    th.className = "thumbnail";
  }
}

function saveAudio(){
  let x = getNewId();
  let object = {
    "type":"audio",
    "url": audioBlob,
    "name":audioName.value,
    "desc":audioDesc.value,
    "id":x,
    "thumb":thumbnail_url
  }
  console.log(object);
  request = database.transaction(["multimedia"],"readwrite");
  request = request.objectStore("multimedia").add(object);
  request.onsuccess = ()=>{
    console.log("Added");
    cancelAudioTaken();
  }
  request.onerror = (e)=>{
    console.log(e);
  }
  addToGallery(object, true);
}

audioSave.onclick = saveAudio;

function cancelAudioTaken() {
  newAudioModal.className = "hidden";
  audioRecordControls.className = "";
  finishedAudioModal.className = "hidden";
  finishedAudio.src = null;
  audioName.value = "";
  audioDesc.value = "";
  audioBlob = null;
  thumbnail_url = "";
  thumbnail.value = "";
  th.src = null;
  th.className = "hidden";
  gallery.className = "";
  audioClock.textContent = "";
}

cancelAudio.onclick = cancelAudioTaken;

retakeAudio.onclick = ()=>{
  audioRecordControls.className = "";
  finishedAudioModal.className = "hidden";
  finishedAudio.src = null;
  thumbnail_url = "";
  thumbnail.value = "";
  th.src = null;
  th.className = "hidden"
  audioClock.textContent = "";
}

function cutAudioTaken(){
  let start = audioCutStart.value;
  let stop = audioCutStop.value;
  if((start>0 && stop>0) && (start<=30 && stop<=30)){
    try{
      let byteStart = returnByteStart(start*1000, audioTimeSize);
      let byteRemove = returnByteStart(stop*1000, audioTimeSize);
      console.log(byteStart);
      console.log(byteRemove);
      let x = audioBlob.slice(0, byteStart);
      let y = audioBlob.slice(byteRemove);
      audioBlob = new Blob([x, y],{ "type":"audio/mp3; codecs=opus"})
      let fr = new FileReader();
      fr.readAsDataURL(audioBlob);
      fr.onload = (e)=>{
        finishedAudio.src = e.target.result;
      }
      }catch(err){
        console.log(err);
      }
  }
}

cutAudio.onclick = cutAudioTaken;
//Gallery
var gallery = document.querySelector("#gallery");
function addToGallery(i, aux){
    let mainDiv = document.createElement("div");
    let div = document.createElement("div");
    let title = document.createElement("h3");
    title.setAttribute("id","title"+i.id);
    let a = document.createElement("a");
    title.textContent = "  "+i.name;
    mainDiv.setAttribute("id","mainDiv"+i.id);
    let x;
    switch (i.type) {
      case "video":{
        let fa = document.createElement("i");
        mainDiv.setAttribute("class","videoGalleryModal");
        x = document.createElement("video");
        let fr = new FileReader();
        fr.readAsDataURL(i.url);
        fr.onload = (e)=>{
          x.src = e.target.result
        }
        if(i.boom){
          x.onended = ()=>{
            boomerangEffect(x)
          }
          x.muted = true;
          x.controls = false;
          x.autoplay = true;
          fa.setAttribute("class","fa fa-backward");
        }else{
          x.controls = true;
          fa.setAttribute("class","fa fa-film");
        }
        title.insertBefore(fa, title.firstChild);
        a.setAttribute("href", window.URL.createObjectURL(i.url));
        a.setAttribute("download",i.name+".webm");
        break;
      }
      case "audio":{
        let fa = document.createElement("i");
        fa.setAttribute("class","fa fa-microphone");
        title.insertBefore(fa, title.firstChild)
        x = document.createElement("audio");
        let fr = new FileReader();
        fr.readAsDataURL(i.url);
        fr.onload = (e)=>{
          x.src = e.target.result;
          x.controls = true;
          a.setAttribute("href", e.target.result);
        }
        a.setAttribute("download",i.name+".mp3");
        mainDiv.setAttribute("class","audioGalleryModal");
        break;
      }
      case "photo":{
        let fa = document.createElement("i");
        fa.setAttribute("class","fa fa-photo");
        title.insertBefore(fa, title.firstChild)
        mainDiv.setAttribute("class","imgGalleryModal");
        x = document.createElement("img");
        x.src = i.url;
        a.setAttribute("href",i.url);
        a.setAttribute("download",i.name+".jpg");
        break;
      }
    }
    let desc = document.createElement("p");
    desc.textContent = i.desc;
    let edit = document.createElement("button");
    edit.textContent = "  Editar";
    edit.setAttribute("onclick","editName('"+i.id+"')");
    edit.setAttribute("class","editButton");
    let editDiv = document.createElement("div");
    editDiv.setAttribute("id","edit"+i.id);
    let nameInput = document.createElement("input");
    nameInput.setAttribute("id","nameId"+i.id);
    let saveEdit = document.createElement("button");
    saveEdit.textContent = "   Guardar cambio";
    saveEdit.onclick = ()=>{
      addNewName(i.id);
    }
    let deleteButton = document.createElement("button");
    deleteButton.textContent = "   Borrar";
    deleteButton.onclick = ()=>{
      deleteItem(i.id);
    }
    editDiv.appendChild(nameInput);
    editDiv.appendChild(document.createElement("br"));
    let safa = document.createElement("i");
    safa.setAttribute("class","fa fa-save");
    saveEdit.insertBefore(safa, saveEdit.firstChild)
    editDiv.appendChild(saveEdit);
    let delfa = document.createElement("i");
    delfa.setAttribute("class","fa fa-trash");
    deleteButton.insertBefore(delfa, deleteButton.firstChild)
    editDiv.appendChild(deleteButton);
    editDiv.setAttribute("class","hidden");
    let fa2 = document.createElement("i");
    fa2.setAttribute("class","fa fa-download");
    a.textContent = "  Descargar";
    a.setAttribute("id","download"+i.id)
    a.insertBefore(fa2, a.firstChild)
    a.setAttribute("class","downloadButton");
    div.appendChild(title);
    if(i.type === "audio"){
      div.appendChild(document.createElement("br"));
      if(i.thumb !== ""){
        let thu = document.createElement("img");
        thu.src = i.thumb;
        thu.setAttribute("class","thumbnail");
        div.appendChild(thu);
      }else{
        let divi = document.createElement("img");
        divi.setAttribute("src","default_image.jpg");
        divi.setAttribute("class","thumbnail")
        div.appendChild(divi);
      }
    }
    div.appendChild(document.createElement("br"));
    div.appendChild(x);
    div.appendChild(desc);
    div.appendChild(a)
    let fa3 = document.createElement("i");
    fa3.setAttribute("class","fa fa-edit");
    div.appendChild(edit)
    edit.insertBefore(fa3, edit.firstChild)
    div.appendChild(editDiv);
    div.setAttribute("class","galleryModal");
    mainDiv.appendChild(div);
    if(aux){
      gallery.insertBefore(mainDiv, gallery.firstChild);
    }else{
      gallery.appendChild(mainDiv);
    }
}
function seeGallery(){
  request = database.transaction(["multimedia"],"readonly");
  request = request.objectStore("multimedia").openCursor();
  request.onsuccess = (e)=>{
    let cursor = e.target.result;
    if(cursor){
      addToGallery(cursor.value, false);
      cursor.continue();
    }else{
    }
  }
  request.onerror = ()=>{
    console.log("Hubo un error");
  }
}
function editName(id){
  let editDiv = document.querySelector("#edit"+id);
  editDiv.className = "";
}
function addNewName(id){
    request = database.transaction(["multimedia"],"readwrite");
    request = request.objectStore("multimedia").get(id);
    let input = document.querySelector("#nameId"+id);
    request.onsuccess = (e)=>{
      let object = e.target.result;
      console.log(object);
      object.name = input.value;
      putItIn(object);
    }
    request.onerror = ()=>{
      console.log("hubo un eror");
    }
}
function putItIn(object){
  request = database.transaction(["multimedia"],"readwrite");
  request = request.objectStore("multimedia").put(object);
  request.onsuccess = ()=>{
    console.log("cambio de nombre exitoso");
    document.querySelector("#title"+object.id).textContent = object.name;
    document.querySelector("#edit"+object.id).className = "hidden";
  }
  request.onerror = ()=>{
    console.log("Cambio de nombre no exitoso");
  }
}

function deleteItem(id){
  request = database.transaction(["multimedia"],"readwrite");
  request = request.objectStore("multimedia").delete(id);
  request.onsuccess = ()=>{
    console.log("Eliminacion exitosa");
    let mainDiv = document.querySelector("#mainDiv"+id);
    gallery.removeChild(mainDiv);
  }
  request.onerror = ()=>{
    console.log("Eliminacion exitosa");
  }
}

var ls = window.localStorage;

function init(){
  if(typeof ls.app === "undefined"){
    ls.app = JSON.stringify({"id":0});
  }
}
window.onload = init;

function getNewId(){
  let app = JSON.parse(ls.app);
  let x = app.id;
  app.id += 1;
  ls.app = JSON.stringify(app);
  return x;
}
