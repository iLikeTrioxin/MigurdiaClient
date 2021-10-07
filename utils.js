const fetch = require('node-fetch');
const apiURL = "https://migurdia.yukiteru.xyz/API.php?";

let sessionID = null;
// 
// toDo: postAsync does not send post data.
//

function callAPI(data, retry=true){
	let response = post(apiURL, data);
	
	response = JSON.parse(response);
	
	// if response is arbitrary session expired error(1) then repeat connection once
	if(response["errorCode"] == 1 && retry){
		console.log("retrying.");
		
		if(!localStorage['username'] || !localStorage['password']) return response;
		
		console.log("logging...");
		
		let signInData = "method=signin";

		signInData += `&username=${localStorage['username']}`;
		signInData += `&password=${localStorage['password']}`;
		
		post(apiURL, signInData);
		
		response = post(apiURL, data);
		
		console.log(response);
		
		response = JSON.parse(response);
	}
	
	return response;
}

async function postAsync(url, data=null){
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		
		request.open('POST', url, true);
		
		request.withCredentials = true;
		
		request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		request.setRequestHeader('SameSite', 'None');
		
		request.addEventListener('readystatechange', () => {
			if(request.readyState !=   4) return;
			if(request.status     != 200) reject({ "ok": 0, "txt": ""});
			
			resolve({
				ok     : 1,
				txt    : request.responseText,
				headers: request.getAllResponseHeaders()
			});
		});
		
		request.send(data);
	})
}

function callAPIAS(data, retry=true){
	return postAsync( apiURL, data ).then(res => {
		// if fetch wasn't ok it in not API fault, so dont continue
		if(!res.ok) return false;
		
		let response = JSON.parse(res.txt); 

		if(response['errorCode'] == 7 && retry) return login().then(res => {
			if(res == false) return false;

			return callAPIAS(data, false);
		});

		if(response['errorCode'] != 0) return false;

		return response;
	});
}

function login(username=null, password=null){
	if(username == null || password == null){
		if(!localStorage['username'] || !localStorage['password']) return new Promise( (r) => r(false) );
		
		username = localStorage['username'];
		password = localStorage['password'];
	}

	return postAsync( apiURL, `method=signin&username=${username}&password=${password}` ).then(res => {
		if(!res.ok) return false;

		response = JSON.parse(res.txt);

		//if(response['errorCode'] == 0) return response;
		let arr = res.headers.trim().split(/[\r\n]+/);
		
		var headerMap = {};
		arr.forEach(function (line) {
			var parts = line.split(': ');
			var header = parts.shift();
			var value = parts.join(': ');
			headerMap[header] = value;
		});
		
		console.log(headerMap);
		sessionID = headerMap['PHPSESSID'];

		return response;
	})
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

function post(url, data, callback){
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
