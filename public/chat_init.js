let socket = io("http://localhost:4000");

let roomInput = document.getElementById("roomName");
let joing = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");

let roomName;
let creator;
let userStream;
let rtcPeerConnection;

// TODO