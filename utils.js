const fetch  = require("node-fetch");
const apiURL = "https://migurdia.yukiteru.xyz/API.php?";

'use strict';

//-------------------
//  Pixiv handling 
//-------------------

// A lot of posts are sourced from pixiv, and so it happens
// pixiv do not allow you to freely embed their images on your site
// so here is code that can download those images by adding some unsafe headers

// returns nodejs Buffer object
async function getPixivImage(url){
	return fetch(url, {
		method : "GET",
		headers: {
			"referer": "https://www.pixiv.net/"
		}
	});
}

// returns Buffer object, another url or dosn't do anything
async function getRealSource(url) {
	if (url.indexOf('i.pximg.net') != -1)
		return processPixivImage(url).then( res => res.arrayBuffer() ).then( res => Buffer.from(res) );
	else
	    return new Promise( (r) => r(url) );
}

async function getBlob(url){
    if (url.indexOf('i.pximg.net') != -1)
		return processPixivImage(url).then( res => res.blob() );
	else
	    return fetch(url, {}).then( res => res.blob() );
}

// return json
async function postAsync(url, data=""){
    return fetch(url, {
        'method' : 'POST',
        'body'   : data,
        'headers': {
            'accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'cookie': `PHPSESSID=${localStorage['SID']}`
        }
    });
}

async function callAPIAS(data, retry=true){
	return postAsync( apiURL, data ).then( res => res.json() ).then( (response) => {
		if((response['exitCode'] == 7) && (retry == true)) return signin().then( (res) => {
			if(res === false) return false;

			return callAPIAS(data, false);
		});

		return response;
	});
}

function error(msg, ms){
	let errorMsg = document.getElementById("errorMessage");
	
	if (errorMsg == null){
		errorMsg = document.createElement("div");
		
		errorMsg.id = "errorMessage";
		
		errorMsg.classList.add("error");
		errorMsg.classList.add("hide" );
		
		document.body.appendChild(errorMsg);
	}

	errorMsg.innerHTML = msg;
	errorMsg.classList.remove("hide");

	setTimeout(function(a, b){a.classList.add(b)}, ms, errorMsg, "hide");
}

function post(url, data){
	let xhr = new window.XMLHttpRequest;
	xhr.open("POST", url, false);
	
	//Send the proper header information along with the request
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//xhr.onreadystatechange = callback;
	//xhr.onreadystatechange = function() {
	//	//Call a function when the state changes.
	//	if(xhr.readyState == 4 && xhr.status == 200) {
	//		alert(xhr.responseText);
	//	}
	//}
	
	xhr.send(data);
	
	if(xhr.readyState != 4 && xhr.status != 200)
		return xhr.status;
	
	return xhr.responseText;
}

// TODO: make signin and signup use callApi function instead of just post

async function signup(username, email, password){
	return callAPIAS(`method=signup&username=${username}&email=${email}&password=${password}`, false).then( (response) => {
		if(response['exitCode'] == 0){
			localStorage.setItem("username", username);
			localStorage.setItem("password", password);
			localStorage.setItem("email"   , email   );

			localStorage.setItem('SID', response['result']['SID']);
		}

		return response;
	})
}

async function signin(username=null, password=null){
	if(username == null || password == null){
		if(!localStorage['username'] || !localStorage['password']) return new Promise( (r) => r(false) );
		
		username = localStorage['username'];
		password = localStorage['password'];
	}

	return callAPIAS(`method=signin&username=${username}&password=${password}`, false).then( (response) => {
		if(response['exitCode'] == 0){
			localStorage.setItem("username", username);
			localStorage.setItem("password", password);

			localStorage.setItem('SID', response['result']['SID']);
		}

		return response;
	})
}

async function signout(moveToSignin=true){
    localStorage.removeItem('username'      );
    localStorage.removeItem('password'      );
    localStorage.removeItem('preventSignout');

    return callAPIAS('method=signout', false).then( () => {
        moveToSignin ? (window.location.href = './signin.html') : null;
    });
}


var __lastScrollX__ = 0;
var __lastScrollY__ = 0;

var __noScroll__ = () => { window.scrollTo(__lastScrollX__, __lastScrollY__); };

function lockScroll(){
    __lastScrollX__ = window.scrollX;
    __lastScrollY__ = window.scrollY;
    window.addEventListener('scroll', __noScroll__);
}

function unlockScroll(){
    window.removeEventListener('scroll', __noScroll__);
}

function lockScreen(){
    let div = document.createElement("div");
    div.id = "__lockScreen__";
    div.style = "z-index:5;position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:black;opacity:75%;";
    document.querySelector('html').appendChild(div);
}

function unlockScreen(){
    let lock = document.getElementById('__lockScreen__');
    
    if(lock != undefined) lock.remove();
}

function removeProgressWindow(){
    document.getElementById('__currentProgressWindow__').remove();
}

function setProgressWindowProgress(perc = 0, stage = ''){
    let progressBar = document.getElementById('__currentProgressBar__');

    progressBar.style.width = perc + '%';

    if(stage != '') document.getElementById('__currentStage__').innerHTML = stage;

    if(perc == 0)
        document.getElementById('__currentProgress__').style.display = "none";
    else
        document.getElementById('__currentProgress__').style.display = "block";
}

function addProgressWindow(title, stage) {
    lockScreen();
    lockScroll();

    let progressWindow = document.createElement("div");
    progressWindow.id    = "__currentProgressWindow__";
    progressWindow.style = "z-index:10;position:fixed;text-align:center;width:65vw;height:50vh;top:50%;left:50%;transform:translate(-50%,-50%);background-color:#222;";

    let windowTitle = document.createElement("h1");
    windowTitle.style     = "margin-top:5%;font-size:2rem;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    windowTitle.innerHTML = title;

    let windowStage = document.createElement("h2");
    windowStage.style     = "margin-top:10%;font-size:1rem;margin-bottom:10%;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    windowStage.id        = "__currentStage__";
    windowStage.innerHTML = stage;
    
    let progress = document.createElement("div");
    progress.style = "width:80%;margin:0 auto;background-color:grey;";
    progress.id    = "__currentProgress__";

    let progressBar = document.createElement("div");
    progressBar.style = "width:0%;height:30px;background-color:green;";
    progressBar.id    = "__currentProgressBar__";

    progress.appendChild(progressBar);

    progressWindow.append(windowTitle, windowStage, progress);

    document.querySelector('html').appendChild(progressWindow);

}

function askUser(title, question, yesCallback, noCallback){
    lockScreen();
    lockScroll();

    let questionWindow = document.createElement("div");
    questionWindow.id = "__currentQuestion__";
    questionWindow.style = "z-index:10;position:fixed;text-align:center;width:65vw;height:50vh;top:50%;left:50%;transform:translate(-50%,-50%);background-color:#222;";

    let windowTitle = document.createElement("h1");
    windowTitle.style = "margin-top:5%;font-size:2rem;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    windowTitle.innerHTML = title;

    let windowQuestion = document.createElement("h2");
    windowQuestion.style = "margin-top:10%;font-size:1rem;margin-bottom:10%;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    windowQuestion.innerHTML = question;


    let yesButton = document.createElement("a");
    yesButton.style     = "cursor:pointer;margin:5%;padding:2% 5%;border:2px solid white;border-radius:5px;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    yesButton.innerHTML = "Yes";

    yesButton.addEventListener('click', ()  => { unlockScreen(); unlockScroll(); document.getElementById('__currentQuestion__').remove(); });
    yesButton.addEventListener('click', yesCallback);

    let noButton = document.createElement("a");
    noButton.style     = "cursor:pointer;margin:5%;padding:2% 5%;border:2px solid white;border-radius:5px;position:relative;color:rgb(255,255,255);font-weight:bold;text-transform:uppercase;";
    noButton.innerHTML = "No";
    
    noButton.addEventListener('click', ()  => { unlockScreen(); unlockScroll(); document.getElementById('__currentQuestion__').remove(); });
    noButton.addEventListener('click', noCallback);

    questionWindow.append(windowTitle, windowQuestion, yesButton, noButton);

    document.querySelector('html').appendChild(questionWindow);
}

/*

<div id="installer" class="hide">
    <h1>Updating</h1>
    <a id="installationStage"></a>
    <div id="progress">
        <div id="progressBar"></div>
    </div>
</div>

*/

async function addPosts(){

}

async function getPosts(amount=20, wantedTags=[], unwantedTags=[], offset=0){
    let tags = {};

    if ( unwantedTags != [] ) tags['unwanted'] = unwantedTags;
    if (   wantedTags != [] ) tags[  'wanted'] =   wantedTags;
    
    let data = JSON.stringify(tags);
console.log(`method=getPosts&tags=${data}&amount=${amount}&offset=${offset}`);
    return callAPIAS(`method=getPosts&tags=${data}&amount=${amount}&offset=${offset}`).then( (res) =>{
        if( res['exitCode'] == 0 ) return res['result'];
        
        return false;
    });
}