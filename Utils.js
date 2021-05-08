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
	var xhr = new XMLHttpRequest();
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