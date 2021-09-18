function onSubmit(){
	let usernameField = document.getElementById("login__username");
	let passwordField = document.getElementById("login__password");
	
	// remove "field_error" tag making fields borders red if wrong
	usernameField.classList.remove("field_error");
	passwordField.classList.remove("field_error");

	let username = usernameField.value;
	let password = passwordField.value;
	
	// Hash password for seciurity
	password = sjcl.hash.sha256.hash(password);

	// append "data" with data nececery to be sent to web api
	let data = "method=signin";

	data += "&username=" + username;
	data += "&password=" + password;
	
	let response = callAPI(data);

	if(response['success']){
		localStorage.setItem("username", username);
		localStorage.setItem("password", password);
		
		if (document.getElementById('keepSignedin').checked)
			localStorage.setItem('preventSignout', true);

		window.location.href = "./explore.html";
	}else{
		switch(response['errorCode']){
			case 8:
				usernameField.classList.add("field_error");
				error("User with such email/username does not exists.", 3000);
				break;
			case 5:
				passwordField.classList.add("field_error");
				error("Unable to sign in. Please check your password and try again.", 3000);
				break;
			default:
				error("Something went wrong :/ try again later.", 3000);
				break;
		}
		
	}

	return false;
}

document.getElementById("signin_form").onsubmit = onSubmit;

//fetch(
//"https://migurdia.000webhostapp.com/test.php",
//{
//	method : "POST",
//	body : JSON.stringify({
//        connectionpurpose : "signin",
//        username: "test",
//		password: "test"
//    })
//});