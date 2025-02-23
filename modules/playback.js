class SignalController {
  constructor() {
    this.shouldStop = false;
    this.timeoutIds = [];
  }

  stopPlayback() {
    this.shouldStop = true
    this.timeoutIds.forEach(id => {
        console.log('clearing out timeoutId: ', id);
        clearTimeout(id);
    });
    this.timeoutIds = [];
  }
}

class Playback {
  constructor(playbackObject) {
    this.signalController = new SignalController();
  }
}



export default Playback;



//send message to start playback from controls to playback class
//alert user that playback has started
//set playback status to true
//dispatch each playback step to content-script
//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


