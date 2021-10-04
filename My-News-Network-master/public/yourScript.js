

$(document).ready(async function () {
	var trigger = $('.hamburger'),
		overlay = $('.overlay'),
		isClosed = false;

	trigger.click(function () {
		hamburger_cross();
	});

	function hamburger_cross() {

		if (isClosed == true) {
			overlay.hide();
			trigger.removeClass('is-open');
			trigger.addClass('is-closed');
			isClosed = false;
		} else {
			overlay.show();
			trigger.removeClass('is-closed');
			trigger.addClass('is-open');
			isClosed = true;
		}
	}
	
	var news = [];
	var newsID = [];
	var newspost = [];
	var loadCount = 0;
	posted = true;
	
	var bookRec = [];
	
	//var userRef = firebase.firestore()
	//.collection("users").doc(userID);
	
	//var userData = await userDB.get();
	//var userHis = userData.History;
	
	
	setTimeout(loadHistory, 1000)
	
	//var snapshot = await query.get();
	//snapshot.forEach(doc => {
	//	news.push(doc.data());
	//	newsID.push(doc.id);
	//	printNews(doc.data(), doc.id);
		//console.log(doc.data());
		//console.log(doc.id);
	//});
	function loadHistory(){
		console.log(userRec);
		bookRec = userRec;
		
		for (i = 0; i < 10; i++){
			if(typeof bookRec[i] === 'undefined'){
				console.log("end of history");
			}
			else{
				//console.log(bookRec[i]);
				firebase.firestore()
				.collection("NewsArticleData").doc(bookRec[i]).get().then(function(doc) {
				if (doc.exists) {
					printNews(doc.data(), doc.id);
					console.log(loadCount++);
				} else {
					// doc.data() will be undefined in this case
					console.log("No such document!");
				}
				}).catch(function(error) {
					console.log("Error getting document:", error);
				});
			}
		}
		console.log(loadCount+=5);
	}
	
	function printNews(value, ID) {
		console.log(ID);
		$("#timeline").append(
			'<div id="mBody' + ID + '"class="card">'
			+ '<div class="card-body">'
			+ '<h5 class="card-title">' + value.Source + '</h5>'
			+ '<h6 class="card-subtitle mb-2 text-muted">' +  new Date(value.publishedDate.seconds*1000) + '</h6>'
			+ '<p class="card-text" id="news1">' + value.title + '</p>'
			+ '<a href="'+value.link+'" target="_blank" id="views' + ID + '" class="card-link" >Open News</a>'
			+ '<a href="#" onclick="event.preventDefault();" id="unsave' + ID + '"class="card-link">Remove</a>'
			+ '<a href="#" onclick="event.preventDefault();" id="save' + ID + '" class="card-link">Save News</a>'
			+ '<a href="#" onclick="event.preventDefault();" id="likes' + ID + '" class="card-link"><img src="/bootstrap-icons/hand-thumbs-up.svg" alt="" width="20" height="20" title="Like">' + value.likes + '</a>'
			+ '<a href="#" onclick="event.preventDefault();" id="dislikes' + ID + '" class="card-link"><img src="/bootstrap-icons/hand-thumbs-down.svg" alt="" width="20" height="20" title="Dislike">' + value.dislikes + '</a>'
			+ '<a href="#" onclick="event.preventDefault();" class="card-link"><img src="/bootstrap-icons/eye.svg" alt="" width="20" height="20" title="Views">' + value.views + '</a>'
			+ '</div>'
			+ '</div>'
		);
		document.getElementById ("views" + ID).addEventListener ("click", function () {addView(ID)}, false);
		document.getElementById ("save" + ID).addEventListener ("click", function () {saveArt(ID)}, false);
		document.getElementById ("unsave" + ID).addEventListener ("click", function () {removeRec(ID)}, false);
		document.getElementById ("likes" + ID).addEventListener ("click", function () {addLike(ID,value.likes)}, false);
		document.getElementById ("dislikes" + ID).addEventListener ("click", function () {addDislike(ID,value.dislikes)}, false);
	}
	
	
	
	async function postnews() {
		
		for (i = loadCount; i < loadCount+5; i++){
			if(typeof bookRec[i] === 'undefined'){
				console.log("end of history");
			}
			else{
				//console.log(bookRec[i]);
				firebase.firestore()
				.collection("NewsArticleData").doc(bookRec[i]).get().then(function(doc) {
				if (doc.exists) {
					printNews(doc.data(), doc.id);
				} else {
					// doc.data() will be undefined in this case
					console.log("No such document!");
				}
				}).catch(function(error) {
					console.log("Error getting document:", error);
				});
			}
		}
		console.log(loadCount+=5);
	}
	
	function saveArt(article){
		firebase.firestore()
		.collection("users")
		.doc(userID).update({
		Bookmarks: firebase.firestore.FieldValue.arrayUnion(article)
		});
		console.log(article);
		alert("Bookmarks saved");
	}
	
	function removeRec(article){
	firebase.firestore()
	.collection("users")
	.doc(userID).update({
	Recommended: firebase.firestore.FieldValue.arrayRemove(article)
	});
	var mbody = document.getElementById("mBody" + article);
	
	//while (mbody.firstChild) {
    //mbody.removeChild(mbody.lastChild);
	//console.log(");
	//}
	
	mbody.innerHTML = '';
	mbody.remove();
	}
	
	function addView(article){
		firebase.firestore()
		.collection("NewsArticleData")
		.doc(article).update({
		views: firebase.firestore.FieldValue.increment(1)
	});
	//remove article if exist
	firebase.firestore()
	.collection("users")
	.doc(userID).update({
	History: firebase.firestore.FieldValue.arrayRemove(article)
	});
	//add to history
	firebase.firestore()
	.collection("users")
	.doc(userID).update({
	History: firebase.firestore.FieldValue.arrayUnion(article)
	});
	}
	
	
	function addLike(article, num){
		firebase.firestore()
		.collection("NewsArticleData")
		.doc(article).update({
		likes: firebase.firestore.FieldValue.increment(1)
		});
		var x = num+1;
		document.getElementById ("likes" + article).innerHTML = '<img src="/bootstrap-icons/hand-thumbs-up.svg" alt="" width="20" height="20" title="Like">' + x ;
	}
	
	function addDislike(article, num){
		console.log("proc");
		firebase.firestore()
		.collection("NewsArticleData")
		.doc(article).update({
		dislikes: firebase.firestore.FieldValue.increment(1)
		});
		var x = num+1;
		document.getElementById ("dislikes" + article).innerHTML = '<img src="/bootstrap-icons/hand-thumbs-down.svg" alt="" width="20" height="20" title="Dislike">' + x ;
	}
	//search code
	document.getElementById('frmSearch').onsubmit = function() {
        window.location = '/results.html?search_query=' +document.getElementById('mySearch').value;
        return false;
    }
	var posting = false;

	$(window).on("scroll", function () {
		var scrollHeight = $(document).height();
		var scrollPosition = $(window).height() + $(window).scrollTop();
		if ((scrollHeight - scrollPosition) / scrollHeight < 0.1) {
			// when scroll to bottom of the page
			if(posting == false){
			posting = true;
			postnews();
			setTimeout(function(){ posting = false; }, 500);
			
		}
		}
	});

	$('[data-toggle="offcanvas"]').click(function () {
		$('#wrapper').toggleClass('toggled');
	});
});