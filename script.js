
const firebaseConfig = {
    apiKey: "AIzaSyAuSTIaa9E141bWcsdnyqjp4JFOUU0uTMM",
    authDomain: "hex-music-app.firebaseapp.com",
    projectId: "hex-music-app",
    storageBucket: "hex-music-app.firebasestorage.app",
    messagingSenderId: "520002009186",
    appId: "1:520002009186:web:d7e1b69a41546674d5793b",
    measurementId: "G-8RDGET4BJ5"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.getAuth();
const db = firebase.getFirestore();
const storage = firebase.getStorage();

/* SIGNUP */
async function signup() {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const userCred = await firebase.createUserWithEmailAndPassword(auth, email, password);
    await firebase.setDoc(firebase.doc(db, "users", userCred.user.uid), {
        name: name,
        email: email,
        playlist: []
    });
    window.location = "index.html";
}

/* LOGIN */
async function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    await firebase.signInWithEmailAndPassword(auth, email, password);
    window.location = "index.html";
}

auth.onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    document.getElementById("user-info").innerHTML = "Logged in as: " + user.email;

    loadTrending();
    loadPlaylist();
});

/* FETCH DEEZER TRENDING */
async function loadTrending() {
    let res = await fetch("https://api.deezer.com/chart");
    res = await res.json();

    const container = document.getElementById("trending");
    container.innerHTML = "";

    res.tracks.data.forEach(song => {
        const div = document.createElement("div");
        div.innerHTML = `
            <strong>${song.title}</strong><br>
            ${song.artist.name}<br>
            <button onclick="play('${song.preview}')">Play</button>
            <button onclick="saveSong('${song.title}', '${song.artist.name}', '${song.preview}')">Add to Playlist</button>
        `;
        container.appendChild(div);
    });
}

/* PLAY AUDIO */
function play(url) {
    document.getElementById("player").src = url;
    document.getElementById("player").play();
}

/* SAVE SONG TO PLAYLIST */
async function saveSong(title, artist, url) {
    const user = auth.currentUser;
    const userRef = firebase.doc(db, "users", user.uid);
    const userData = await firebase.getDoc(userRef);

    const playlist = userData.data().playlist || [];
    playlist.push({ title, artist, url });

    await firebase.updateDoc(userRef, { playlist });

    loadPlaylist();
}

/* LOAD PLAYLIST */
async function loadPlaylist() {
    const user = auth.currentUser;
    const userRef = firebase.doc(db, "users", user.uid);
    const userData = await firebase.getDoc(userRef);

    const list = userData.data().playlist || [];
    const container = document.getElementById("playlist");
    container.innerHTML = "";

    list.forEach(song => {
        const div = document.createElement("div");
        div.innerHTML = `
            <strong>${song.title}</strong><br>
            ${song.artist}<br>
            <button onclick="play('${song.url}')">Play</button>
        `;
        container.appendChild(div);
    });
}

/* UPLOAD SONG TO FIREBASE STORAGE */
async function uploadSong() {
    const file = document.getElementById("uploadFile").files[0];
    const user = auth.currentUser;

    const fileRef = firebase.ref(storage, "audio/" + user.uid + "/" + file.name);
    await firebase.uploadBytes(fileRef, file);
    const url = await firebase.getDownloadURL(fileRef);

    saveSong(file.name, "Uploaded", url);
}
