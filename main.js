function PicChange(draw) {
    var pic;
    if (draw == 0) {
      pic = "img/Works7.png"
    } else {
      pic = "img/JessIRL.jpg"
    }
    document.getElementById('basePic').src = pic;
  }