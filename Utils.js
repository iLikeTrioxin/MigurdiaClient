
function callAPI(data, retry=true){
	const apiURL = "https://incognitoo.pl/temp/API.php?";
	let response;
	
	response = post(apiURL, data);
	
	console.log(data);
	console.log(response);
	
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