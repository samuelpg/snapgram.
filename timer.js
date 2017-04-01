var time = 0;

function countdown(){
  postMessage(time);
  time += 4;
}

setInterval(countdown, 1);
