var firebaseConfig = {
  apiKey: "AIzaSyAQPAqzqDgY-ySsmEakXlyTo8BjbR7QKwM",
  authDomain: "my-news-network-15401.firebaseapp.com",
  databaseURL: "https://my-news-network-15401.firebaseio.com",
  projectId: "my-news-network-15401",
  storageBucket: "my-news-network-15401.appspot.com",
  messagingSenderId: "100486016337",
  appId: "1:100486016337:web:5a9a185b0a8797e1423770",
  measurementId: "G-SS97Q9PSGK"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore(); //for firestore
// var storage = firebase.storage(); //for storage
var userID;
var emailAd;
var userHis;
var userBook;
var userRec;

function handleSignIn() {
  if (firebase.auth().currentUser) { //if a user is currently logged in
    firebase.auth().signOut();

  } else {
    var email = document.getElementById('loginEmail').value; //get email value
    var password = document.getElementById('loginPwd').value; //get password value
    if (email.length < 4) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 4) {
      alert('Please enter a password.');
      return;
    }
    // Sign in with email and pass.
    // [START authwithemail]
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(function () {

        //Succesful, do whatever you want in your page
        window.location.href = "home.html";
        var user = firebase.auth().currentUser;

      })
      .catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode === 'auth/wrong-password') {
          alert('You have entered a wrong password.');
        } else {
          alert(errorMessage);
        }
        console.log(error); //output error in the console
        document.getElementById('loginBtn').disabled = false;
        // [END_EXCLUDE]
      });
    // [END authwithemail]
    // document.getElementById('loginBtn').disabled = true;
  }
}
//function for signOut Btn

function handleSignOut() {
  firebase.auth().signOut();
  window.location = 'index.html';
}

/**
 * Handles the sign up button press.
 */
function handleSignUp() {
  var email = document.getElementById('signUpEmail').value;
  var password = document.getElementById('signUpPwd').value;
  var uname = document.getElementById("signUpName").value;
  if (email.length < 4) {
    alert('Please enter a valid email address.');
    return;
  }
  if (email.length = 0) {
    alert("Email cannot be blank, please enter an email.")
    return;
  }
  if (password.length < 4) {
    alert('Your password is too weak, enter a strong password.');
    return;
  }
  // Create user with email and pass.
  // [START createwithemail]
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function (data) {
      // get user data from the auth trigger
      const userUid = data.user.uid; // The UID of the user.
      const email = data.user.email; // The email of the user.
      const displayName = uname; // The display name of the user.

      // console.log("User details: " + data.user);
      // console.log("UserID: " + data.user.uid);
      // set account  doc  
      const account = {
        useruid: userUid,
        useremail: email,
        name: displayName
      }
      // firebase.firestore().collection('users').doc(email).set(account);
      // alert("Your account has been created successfully with user email: " + email);
      // // window.open('index.html', '_self');

      firebase.firestore().collection('users').doc(userUid).set(account).then(function () {
        alert("Document successfully written!  Your account has been created successfully with user email: " + email);
        window.open('index.html', '_self');
      }).catch(function () {
        alert("Document on write failed!");
      });

    })
    .catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // [START_EXCLUDE]
      if (errorCode == 'auth/weak-password') {
        alert('The password is too weak.');
      } else {
        alert(errorMessage);
      }
      console.log(error);
      // [END_EXCLUDE]
    });
}

/**
 * Sends an email verification to the user.
 */
// function sendEmailVerification() {
//   // [START sendemailverification]
//   firebase.auth().currentUser.sendEmailVerification().then(function () {
//     // Email Verification sent!
//     // [START_EXCLUDE]
//     alert('Email Verification Sent!');
//     // [END_EXCLUDE]
//   });
//   // [END sendemailverification]
// }

function sendPasswordReset() {
  var email = document.getElementById('resetPwdEmail').value;
  // [START sendpasswordemail]
  firebase.auth().sendPasswordResetEmail(email).then(function () {
    // Password Reset Email Sent!
    // [START_EXCLUDE]
    alert('Password Reset Email Sent!');
    // [END_EXCLUDE]
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/invalid-email') {
      alert(errorMessage);
    } else if (errorCode == 'auth/user-not-found') {
      alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
  });
  // [END sendpasswordemail];
}

function updateProfile() {
  var user = firebase.auth().currentUser;
  var newname = document.getElementById("updateNameField").value;
  var bio = document.getElementById("updateBio").value;
  var docRef = db.collection("users").doc(userID);
  docRef.update({
    name: newname,
    userbio: bio
  }).then(function () {
    alert("Document successfully updated!");
  }).catch(function (error) {
    // The document probably doesn't exist.
    alert("Error updating document: ", error);
  });
}

function updatePassword() {
  var user = firebase.auth().currentUser;
  var newPassword = document.getElementById("newpassword").value;
  user.updatePassword(newPassword).then(function () {
    alert("Password succesfully updated!");
  }).catch(function (error) {
    alert("Unable to update password!");
  });

}

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
  // Listening for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      // User is signed out.
      firebase.auth().signOut();
      console.log(window.location.pathname);
      if (window.location.pathname != '/index.html' && window.location.pathname != '/signup.html'
        && window.location.pathname != '/resetpwd.html') {
        window.location = 'index.html';
      }
    } else {
      // User is signed in.
      emailAd = user.email;
      userID = user.uid;
      console.log(userID);

      var userData = firebase.firestore()
        .collection("users").doc(user.uid).get().then(function (doc) {
          if (doc.exists) {
            userHis = doc.data().History;
            userBook = doc.data().Bookmarks;
			userRec = doc.data().Recommended;
            console.log(userHis);
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        }).catch(function (error) {
          console.log("Error getting document:", error);
        });

      //var userHis = userData.History;

      //console.log(window.location.href);
      // var displayName = firebase.firestore().collection('users').doc(emailAd).get("name");
      document.getElementById('userDropdown').textContent = emailAd;

      function renderProfile(doc) {

        //for disabled name field dyanamically created
        var node = document.createElement("INPUT"); //create input element
        node.setAttribute("type", "text"); //set input type attribute
        node.setAttribute("data-id", doc.id); //set data-id to user id
        node.setAttribute("disabled", "true");
        node.setAttribute("class", "form-control") //set class
        node.setAttribute("placeholder", doc.data().name); //set input value
        document.getElementById("profileFormDiv").appendChild(node);

        //for disabled email field dyanamically created
        var node = document.createElement("INPUT");
        node.setAttribute("type", "email");
        node.setAttribute("data-id", doc.id);
        node.setAttribute("disabled", "true");
        node.setAttribute("class", "form-control")
        node.setAttribute("placeholder", doc.data().useremail);
        document.getElementById("profileFormDiv").appendChild(node);

        //for disabled bio field dyanamically created
        var node = document.createElement("INPUT");
        node.setAttribute("type", "text");
        node.setAttribute("data-id", doc.id);
        node.setAttribute("disabled", "true");
        node.setAttribute("class", "form-control")
        node.setAttribute("placeholder", doc.data().userbio);
        document.getElementById("profileFormDiv").appendChild(node);

        //FOR ACTUAL FORM INPUT

        var node = document.createElement("INPUT"); //insert new name
        node.setAttribute("type", "text"); //set input type attribute
        node.setAttribute("data-id", doc.id); //set data-id to user id
        node.setAttribute("id", "updateNameField");
        node.setAttribute("class", "form-control mt-5") //set class
        node.setAttribute("placeholder", "Enter name here");
        document.getElementById("profileFormDiv").appendChild(node);

        var node = document.createElement("INPUT"); //insert bio here
        node.setAttribute("type", "text");
        node.setAttribute("data-id", doc.id); //set data-id to user id
        node.setAttribute("id", "updateBio");
        node.setAttribute("class", "form-control mt-2") //set class
        node.setAttribute("placeholder", "Enter profile bio here");
        document.getElementById("profileFormDiv").appendChild(node);

      }

      db.collection("users").where("useremail", "==", emailAd)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            // doc.data() is never undefined for query doc snapshots
            var data = doc.data();
            // console.log(data);
            renderProfile(doc);
          });
        })
        .catch(function (error) {
          console.log("Error getting document: ", error);
        });
      // var emailVerified = user.emailVerified;
      // var photoURL = user.photoURL;
      // var isAnonymous = user.isAnonymous;
      // var uid = user.uid;
      // var providerData = user.providerData;
      // console.log(displayName);

      // [START_EXCLUDE]
      // document.getElementById('loginBtn-status').textContent = 'Signed in';
      // document.getElementById('loginBtn').textContent = 'Sign out';
      // document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
      // if (!emailVerified) {
      //   document.getElementById('quickstart-verify-email').disabled = false;
      // }
      // [END_EXCLUDE]
    }
  });
  // [END authstatelistener]
}

window.onload = function () {
  initApp();
};