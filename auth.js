function signup(){
  auth.createUserWithEmailAndPassword(
    email.value,password.value
  ).then(()=>{
    msg.innerText="Signup success!";
    location="dashboard.html";
  }).catch(e=>msg.innerText=e.message);
}

function login(){
  auth.signInWithEmailAndPassword(
    email.value,password.value
  ).then(()=>{
    location="dashboard.html";
  }).catch(e=>msg.innerText=e.message);
}

function googleLogin(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
  .then(()=>location="dashboard.html");
}

function logout(){
  auth.signOut().then(()=>location="index.html");
}
