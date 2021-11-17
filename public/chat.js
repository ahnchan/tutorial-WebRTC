// var socket = io.connect("http;//localhost:4000");
let socket = io("http://localhost:4000");

let roomInput = document.getElementById("roomName");
let join = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");

let roomName;
let creator;
let userStream;
let rtcPeerConnection;

join.addEventListener("click", function () {

    roomName = roomInput.value;
    socket.emit("join", roomName);
});

socket.on("created", function (data) {
    console.log("created");
    creator = true;

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1024, height: 640 }
    }).then(function (stream) {
        userStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function (e) {
            userVideo.play();
        }
    }).catch(function (err) {
        alert("Couldn't access user media");
    });
});

socket.on("joined", function () {
    console.log("joined");
    creator = false;

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1024, height: 640 }
    }).then(function (stream) {
        userStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function (e) {
            userVideo.play();
        }
        socket.emit("ready", roomName);
    }).catch(function (err) {
        alert("Couldn't access user media");
    });
});

socket.on("full", function () {
    alert("Room is full");
});


let iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
    ]
};

socket.on("ready", function () {
    console.log("ready");
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);  // audio
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);  // video
        rtcPeerConnection.createOffer()
            .then((offer) => {
                console.log("createOffer");
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

function onIceCandidateFunction(event) {
    console.log("onIceCandidate");
    if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
    }
}

function onTrackFunction(event) {
    console.log("onTrack");

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 512, height: 320 }
    }).then(function (stream) {
        peerVideo.srcObject = stream;
        peerVideo.onloadedmetadata = function (e) {
            peerVideo.play();
        }
    }).catch(function (err) {
        alert("Couldn't access user media");
    });

    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    }
}

socket.on("candidate", function (candidate) {
    console.log("candidate");
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("offer", function (offer) {
    console.log("offer");
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);  // audio
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);  // video
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer()
            .then((answer) => {
                console.log("createAnswer");
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

socket.on("answer", function (answer) {
    console.log("answer");
    if (creator) {
        rtcPeerConnection.setRemoteDescription(answer);
    }
});