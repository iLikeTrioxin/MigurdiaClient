const fetch  = require("node-fetch");
const apiURL = "https://migurdia.yukiteru.xyz/API.php?";

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
	}).then( res => res.arrayBuffer() ).then( res => Buffer.from(res) );
}

// returns Buffer object, another url or dosn't do anything
async function getRealSource(url) {
	if (url.indexOf('i.pximg.net') != -1)
		return processPixivImage(url);
	else
	    return new Promise( (r) => r(url) );
}

async function postAsync(url, data=null){
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		
		request.open('POST', url, true);
		
		request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		
		// Send SID by post becouse xmlhttprequest refuses to set unsafe header cookie
		if(localStorage['SID'] != undefined)
			data += "&Cookie=PHPSESSID=" + localStorage['SID'];
		
		request.addEventListener('readystatechange', () => {
			if(request.readyState !=   4) return;
			if(request.status     != 200) reject({ ok: 0, txt: ""});
			
			resolve({
				ok     : 1,
				txt    : request.responseText,
				headers: request.getAllResponseHeaders()
			});
		});
		
		request.send(data);
	})
}

async function callAPIAS(data, retry=true){
	return postAsync( apiURL, data ).then(res => {
		// if fetch wasn't ok it in not API fault, so dont continue
		if(!res.ok) return false;
		
		let response = JSON.parse(res.txt); 

		if(response['exitCode'] == 7 && retry) return signin().then(res => {
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
	return postAsync( apiURL, `method=signup&username=${username}&email=${email}&password=${password}` ).then( (res) => {
		if(!res.ok) return false;

		response = JSON.parse(res.txt);

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

	return postAsync( apiURL, `method=signin&username=${username}&password=${password}` ).then( (res) => {
		if(!res.ok) return false;

		response = JSON.parse(res.txt);

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

async function getFiles(amount=20, wantedTags=[], unwantedTags=[]){
    let tags = {};

    if ( unwantedTags != [] ) tags['unwanted'] = unwantedTags;
    if (   wantedTags != [] ) tags[  'wanted'] =   wantedTags;
    
    let data = JSON.stringify(tags);

    return callAPIAS(`method=getFiles&tags=${data}&amount=${amount}`).then( (res) =>{
        if( res['exitCode'] == 0 ) return res['result'];
        
        return false;
    });
}