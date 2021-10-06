plupload = require('plupload');
const fs       = require('fs'      );

class FileBlackHole{
	fileBlackHoleAPI = 'https://fileblackhole.000webhostapp.com/API.php';
	uploader = new plupload.Uploader({
	  url          : `${this.fileBlackHoleAPI}?method=uploadfilechunk`,
	  runtimes     : 'html5,html4',
	  browse_button: 'fileUploadDummy',
	  container    : 'fileUploadDummy',
	  chunk_size   : '1mb'
	});
  
	constructor() {
	  // if class was created previusly then just reference it
	  if(FileBlackHole._instance) return FileBlackHole._instance;
	  
	  // initalize created class
	  this.uploader.init();
  
	  // store created instance for later use
	  FileBlackHole._instance = this;
	}
  
	static get (){ return this._instance; }
	static init(){ new   FileBlackHole(); }
  
	uploadFiles(files, chunkUploaded, FileUploaded){
	  let resp = post(`${this.fileBlackHoleAPI}?method=createsession`);
	  
	  for(let i=0; i < files.length; i++){
	  	let file = files[i];
  
		this.uploader.addFile(file);
		post(`${this.fileBlackHoleAPI}?method=startupload&fileSize=${file.size}&fileName=${file.name}`);
	  }
	  
	  this.uploader.bind('ChunkUploaded', chunkUploaded);
	  this.uploader.bind( 'FileUploaded',  FileUploaded);
	  this.uploader.bind('Error', (up, err) => { console.log(`uploader has thrown error ${err.code} - ${err.message}`); });

	  this.uploader.start();
	}
}

FileBlackHole.init();

function addFile(event){
  if(event.inputType == 'deleteContentBackward') return;
  let URLs = document.getElementById('URLs');

  let newFile = document.createElement('file');
  let fileURL = document.createElement('input');
  fileURL.type = 'text';
  fileURL.style = 'position:relative;margin-top:20vh;';
  
  newFile.appendChild(fileURL);
  URLs.appendChild(newFile);
  fileURL.focus();
}

// video/image processing libs
const sharp           = require('sharp');
const VideoSnapshoter = require('video-snapshot').default;
const preferedThumbnailPixelArea = 512 * 512;

// this function returns File instance
async function getImageThumbnail(file){
	let image    = sharp(file).jpeg();
	let metadata = await image.metadata();
	let name     = `${parseInt(Math.random() * 0xFFFFFFFF)}.thumbnail.jpg`;

	
	let pixelArea   = metadata.width * metadata.height;
	let aspectRatio = metadata.width / metadata.height;
	
	if(pixelArea <= preferedThumbnailPixelArea) return new File([Buffer.from(await image.toBuffer())], name);

	let newWidth  = Math.sqrt(preferedThumbnailPixelArea * aspectRatio);
	let newHeight = preferedThumbnailPixelArea / newWidth;
	
	image = image.resize(
		parseInt(newWidth ),
		parseInt(newHeight)
	);
	
	return new File([Buffer.from(await image.toBuffer())], name);
}

async function getVideoThumbnail(file){
	let snapshoter = new VideoSnapshoter(file);
	let snapshot   = await snapshoter.takeSnapshot();
	    snapshot   = snapshot.substring(22);
		snapshot   = Buffer.from(snapshot);
	
	return getImageThumbnail(snapshot);
}

async function getThumbnail(file){
	if(file.type.indexOf("image") == 0) return await getImageThumbnail(file.path);
	if(file.type.indexOf("video") == 0) return await getVideoThumbnail(file     );

	return null;
}

function addTerminalLine(ID, content){
	let line = document.createElement('p');
	
	line.classList.add('line');

	line.id        = ID     ;
	line.innerHTML = content;

	document.getElementById('terminalContent').appendChild(line);
}

function changeTerminalLine(ID, newContent){
	document.getElementById(ID).innerHTML = newContent;
}

async function postFile(){
  let file = document.getElementById('file').files[0];
  document.getElementById('chooseFile').classList.add('hide');
  
  let thumbnail = await getThumbnail(file);

  addTerminalLine(`${file     .name}UploadProgress`, `${file     .name} - upload started.`);
  addTerminalLine(`${thumbnail.name}UploadProgress`, `${thumbnail.name} - upload started.`);
  
  FileBlackHole.get().uploadFiles(
	Array(file,thumbnail),
	function(up, file, result){ changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - ${result.offset / result.total}%`); },
	function(up, file, result){ changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - completed (${result.response})`  ); }
  );
}

function postURL(){
  let fileURL = document.getElementById('fileURL');
  document.getElementById('chooseFile').classList.add('hide');

}



document.getElementById('file'     ).addEventListener('change', postFile);
document.getElementById('fileURL'  ).addEventListener('change', postURL);
//document.getElementById('submit').addEventListener('click', addURLs);

/*

https://i.pximg.net/img-original/img/2021/04/07/00/01/30/88984186_p0.jpg
https://i.pximg.net/img-original/img/2020/11/27/00/44/23/85925985_p0.jpg
https://i.pximg.net/img-original/img/2020/11/27/00/44/23/85925985_p1.jpg
https://i.pximg.net/img-original/img/2020/10/11/10/42/59/84932621_p0.jpg
https://i.pximg.net/img-original/img/2020/03/20/14/33/55/80238379_p0.jpg
https://i.pximg.net/img-original/img/2020/04/07/00/05/41/80616102_p0.jpg
https://i.pximg.net/img-original/img/2019/11/10/00/09/06/77734346_p0.jpg

*/

let SID = null;
function post(url, data = null){
	var xhr = new window.XMLHttpRequest;
	xhr.open("POST", url, false);
	
	//Send the proper header information along with the request
	//xhr.onreadystatechange = function() {
	//	//Call a function when the state changes.
	//	if(xhr.readyState == 4 && xhr.status == 200) {
	//		alert(xhr.responseText);
	//	}
	//}
	//if ( SID != null ) xhr.setRequestHeader('PHPSESSID', SID);

	xhr.send();
	
	if(xhr.readyState != 4 && xhr.status != 200)
		return xhr.status;
	
	return xhr.responseText;
}

/*
// Custom example logic
var uploader = new plupload.Uploader({
	runtimes : 'html5,html4',
	browse_button : 'pickfiles', // you can pass an id...
	container: document.getElementById('container'), // ... or DOM Element itself
	url : 'API.php?method=uploadfilechunk',
	chunk_size: '1mb',

	init: {
		FilesAdded: function(up, files) {
			plupload.each(files, function(file) {
				document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';
				
			});
		},

		UploadProgress: function(up, file) {
			document.getElementById(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
		},

		Error: function(up, err) {
			document.getElementById('console').appendChild(document.createTextNode("\nError #" + err.code + ": " + err.message));
		},

		//https://www.plupload.com/docs/v2/Uploader#FileUploaded-event
		//
		//uploader plupload.Uploader - Uploader instance sending the event.
		//file plupload.File - File that was uploaded.
		//result:
		//    -response - The response body sent by the server.
		//    -status   - The HTTP status code sent by the server.
		//    -responseHeaders - All the response headers as a single string.
		FileUploaded: function(uploader, file, result){
			console.log(result.response);
		}

	}
});
*/