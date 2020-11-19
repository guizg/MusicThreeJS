var visualizer;

$(document).ready(function () {
    visualizer = new AudioVisualizer();
    visualizer.initialize();
    visualizer.createBars();
    visualizer.setupAudioProcessing();
    visualizer.getAudio();
    visualizer.handleDrop();  
});


function AudioVisualizer() {


    //Rendering
    this.scene;
    this.camera;
    this.renderer;
    this.controls;

    this.cube;

    //audio
    this.javascriptNode;
    this.audioContext;
    this.sourceBuffer;
    this.analyser;
}

//initialize the visualizer elements
AudioVisualizer.prototype.initialize = function () {
    //generate a ThreeJS Scene
    this.scene = new THREE.Scene();

    //get the width and height
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    //get the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(WIDTH, HEIGHT);

    //append the rederer to the body
    document.body.appendChild(this.renderer.domElement);

    //create and add camera
    this.camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 0.1, 20000);
    this.camera.position.set(0, 45, 0);
    this.scene.add(this.camera);

    var that = this;

    //update renderer size, aspect ratio and projection matrix on resize
    window.addEventListener('resize', function () {

        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;

        that.renderer.setSize(WIDTH, HEIGHT);

        that.camera.aspect = WIDTH / HEIGHT;
        that.camera.updateProjectionMatrix();

    });

    //background color of the scene
    this.renderer.setClearColor(0x333F47, 1);

    // create a light and add it to the scene
    var light = new THREE.PointLight(0xffffff);
    // light.position.set(-100, 200, 100);
    light.position.set(-200, 400, 200);
    this.scene.add(light);

    // const light = new THREE.AmbientLight( 0xffffff ); // soft white light
    // this.scene.add( light );

    //Add interation capability to the scene
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
};

//create the bars required to show the visualization
AudioVisualizer.prototype.createBars = function () {

    // const x = 0, y = 0;

    // const heartShape = new THREE.Shape();

    // heartShape.moveTo( x + 5, y + 5 );
    // heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
    // heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
    // heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
    // heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
    // heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
    // heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

    // const cubeGeometry = new THREE.ShapeGeometry( heartShape );

    var cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    // var cubeGeometry = new THREE.SphereGeometry( 5, 32, 32 );

    var material = new THREE.MeshPhongMaterial({
        color: this.getRandomColor(),
        ambient: 0x808080,
        specular: 0xffffff
    });

    this.cube = new THREE.Mesh(cubeGeometry, material);
    this.cube.position.set(0, 0, 0);

    this.scene.add(this.cube);

};

AudioVisualizer.prototype.setupAudioProcessing = function () {
    //get the audio context
    this.audioContext = new AudioContext();

    //create the javascript node
    this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.javascriptNode.connect(this.audioContext.destination);

    //create the source buffer
    this.sourceBuffer = this.audioContext.createBufferSource();

    //create the analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.3;
    this.analyser.fftSize = 512;

    //connect source to analyser
    this.sourceBuffer.connect(this.analyser);

    //analyser to speakers
    this.analyser.connect(this.javascriptNode);

    //connect source to analyser
    this.sourceBuffer.connect(this.audioContext.destination);

    var that = this;

    //this is where we animates the bars
    this.javascriptNode.onaudioprocess = function () {

        // get the average for the first channel
        var array = new Uint8Array(that.analyser.frequencyBinCount);
        that.analyser.getByteFrequencyData(array);
        // array = Array.from(array)
        // console.log(array)

        
        
        var bass = array.slice(that.analyser.fftSize/4, that.analyser.fftSize/2); 
        var bassMax = Math.max(...bass)/100;
        // console.log(bassMax);
        bassMax = bassMax < 1 ? 1 : bassMax;

        var trebble = array.slice(0, that.analyser.fftSize/4); 

        var s = 0;
        for (const e of trebble) {
            s += e;
        }

        var trebbleAvg = s/trebble.length

        //render the scene and update controls
        visualizer.renderer.render(visualizer.scene, visualizer.camera);
        visualizer.controls.update();

        visualizer.cube.scale.x = bassMax;
        visualizer.cube.scale.y = bassMax;
        visualizer.cube.scale.z = bassMax;

        console.log(trebbleAvg)
        console.log(visualizer.cube)
        visualizer.cube.material.color.setRGB(trebbleAvg/256, 0, 0)

        visualizer.cube.rotation.x = 1;

    }

};

//get the default audio from the server
AudioVisualizer.prototype.getAudio = function () {
    var request = new XMLHttpRequest();
    request.open("GET", "Asset/Aathi-StarMusiQ.Com.mp3", true);
    request.responseType = "arraybuffer";
    request.send();
    var that = this;
    request.onload = function () {
        //that.start(request.response);
    }
};

//start the audio processing
AudioVisualizer.prototype.start = function (buffer) {
    this.audioContext.decodeAudioData(buffer, decodeAudioDataSuccess, decodeAudioDataFailed);
    var that = this;

    function decodeAudioDataSuccess(decodedBuffer) {
        that.sourceBuffer.buffer = decodedBuffer
        that.sourceBuffer.start(0);
    }

    function decodeAudioDataFailed() {
        debugger
    }
};

//util method to get random colors to make stuff interesting
AudioVisualizer.prototype.getRandomColor = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

AudioVisualizer.prototype.handleDrop = function () {
    //drag Enter
    document.body.addEventListener("dragenter", function () {
       
    }, false);

    //drag over
    document.body.addEventListener("dragover", function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, false);

    //drag leave
    document.body.addEventListener("dragleave", function () {
       
    }, false);

    //drop
    document.body.addEventListener("drop", function (e) {
        e.stopPropagation();

        e.preventDefault();

        //get the file
        var file = e.dataTransfer.files[0];
        var fileName = file.name;

        $("#guide").text("Playing " + fileName);

        var fileReader = new FileReader();

        fileReader.onload = function (e) {
            var fileResult = e.target.result;
            visualizer.start(fileResult);
        };

        fileReader.onerror = function (e) {
          debugger
        };
       
        fileReader.readAsArrayBuffer(file);
    }, false);
}

