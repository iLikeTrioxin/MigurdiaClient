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

async function addPosts(){

}

async function getPosts(amount=20, wantedTags=[], unwantedTags=[]){
    let tags = {};

    if ( unwantedTags != [] ) tags['unwanted'] = unwantedTags;
    if (   wantedTags != [] ) tags[  'wanted'] =   wantedTags;
    
    let data = JSON.stringify(tags);

    return callAPIAS(`method=getPosts&tags=${data}&amount=${amount}`).then( (res) =>{
        if( res['exitCode'] == 0 ) return res['result'];
        
        return false;
    });
}