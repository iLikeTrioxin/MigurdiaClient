const plupload        = require('plupload'      );
const fs              = require('fs'            );
const sharp           = require('sharp'         );
const VideoSnapshoter = require('video-snapshot').default;
const Tagify          = require('@yaireo/tagify');
const { tmpdir } = require('os');

const preferedThumbnailPixelArea = 512 * 512;
const fileBlackHoleAPI = 'https://fileblackhole.000webhostapp.com/API.php';

class FileBlackHole{
    uploader = new plupload.Uploader({
      url          : fileBlackHoleAPI,
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
      let resp = postt(`${fileBlackHoleAPI}?method=createsession`, "");
          resp = JSON.parse(resp);
    
      SID = resp['Result']['SID'];
      
      this.uploader.setOption('url', `${fileBlackHoleAPI}?method=uploadfilechunk&PHPSESSID=${SID}`)
      
      for(let i=0; i < files.length; i++){
          let file = files[i];
  
        this.uploader.addFile(file);
        postt(`${fileBlackHoleAPI}?method=startupload&fileSize=${file.size}&fileName=${file.name}`, "");
      }
      
      this.uploader.bind('ChunkUploaded', chunkUploaded);
      this.uploader.bind( 'FileUploaded',  FileUploaded);
      this.uploader.bind('Error', (up, err) => { console.log(`uploader has thrown error ${err.code} - ${err.message}`); });

      this.uploader.start();
    }
}

FileBlackHole.init();

function addFile(event) {
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

// this function returns File instance
async function getImageThumbnail(file){
    let image    = sharp(file).jpeg();
    let metadata = await image.metadata();
    let name     = file.name.split('.')[0]
        name     = `${name}.thumbnail.jpg`;

    
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
        snapshot   = Buffer.from(snapshot, 'base64');
    
    return getImageThumbnail(snapshot);
}

async function getThumbnail(file){
    if(file.type.indexOf("image") != -1) return await getImageThumbnail(file.path);
    if(file.type.indexOf("video") != -1) return await getVideoThumbnail(file     );

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

let filesToUpload = [];
async function postFile(){
    let file = document.getElementById('file').files[0];

    filesToUpload.push(file);

    document.getElementById('chooseFile' ).classList.add   ("hide");
    document.getElementById('postDetails').classList.remove("hide");
}

let urlsToUpload = [];
function postURL() {
    let fileURL = document.getElementById('fileURL').value;

    urlsToUpload.push(fileUrl);
    
    document.getElementById('chooseFile' ).classList.add   ("hide");
      document.getElementById('postDetails').classList.remove("hide");
}

function submitURL(){
    urlsToSubmit = [];

    if(urlsToUpload.length != 0) {
        urlsToUpload.forEach( (url) => {
            let thumbnail = await getThumbnail(getRealSource(url));
            urlsToSubmit .push(url);
            filesToUpload.push(thumbnail);
        });
    }
    
    if(filesToUpload.length != 0) {
        filesToUpload.forEach(file => {
            let thumbnail = await getThumbnail(file);
            
            addTerminalLine(`${file     .name}UploadProgress`, `${file     .name} - upload started.`);
            addTerminalLine(`${thumbnail.name}UploadProgress`, `${thumbnail.name} - upload started.`);
            
            FileBlackHole.get().uploadFiles(
                Array(file, thumbnail),
                function(up, file, result){ changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - ${result.offset / result.total}%`); },
                function(up, file, result){ changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - completed (${result.response})`  ); urlsToSubmit.push({'url':`https://fileblackhole.000webhostapp.com/files/${result.response}`,'name':file.name}); }
            );
        })

        filesToUpload = [];
    }

    files = {};
    urlsToSubmit.forEach( (url) => {
        filename = url['name'].split('.')[0];
        
        files[filename] = {};
    
        let isThumbnail = url['name'].indexOf("thumbnail") != -1;
        
        files[filename][isThumbnail ? "thumbnail" : "file"] = url["url"];
    });

    filesToSubmit = [];
    files.forEach( (file) => {
        filesToSubmit.push({
            "thumbnailUrl": files["thumbnailUrl"],
            "fileUrl"     : files["file"],
            "tags"        : [],
            "authors"     : [],
            "description" : document.getElementById('postDescription').value,
            "name"        : document.getElementById('postName'       ).value,
        });
    });

    filesToSubmit = JSON.stringify(filesToSubmit);
    callAPIAS(`method=uploadFiles&files=${filesToSubmit}`);
}


document.getElementById('file'        ).addEventListener('change', postFile);
document.getElementById('fileURL'     ).addEventListener('change', postURL);
document.getElementById('submitButton').addEventListener('click' , submitURL);

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
function postt(url, data = null){
    var request = new XMLHttpRequest();
    
    request.open('POST', url, false);

    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // Send SID by post becouse xmlhttprequest refuses to set unsafe header cookie
    if(SID != null) data += "&PHPSESSID=" + SID;

    request.send(data);

    if(request.readyState !=   4) return;
    if(request.status     != 200) return;

    return request.responseText;
}

let postTags    = document.querySelector('#postTags'   );
let postAuthors = document.querySelector('#postAuthors');

// init Tagify script on the above inputs
tagsSelector = new Tagify(postTags, {
    enforeWhitelist : true,
    delimiters      : ",| ;"
});

authorsSelector = new Tagify(postAuthors, {
    enforeWhitelist : true,
    delimiters      : ",| ;"
});

// listen to any keystrokes which modify selector's input
tagsSelector   .on('input', onTagsSelectorInput   );
authorsSelector.on('input', onAuthorsSelectorInput);

function onTagsSelectorInput( event ){
    var value = event.detail.value;
    tagsSelector.whitelist = null; // reset the whitelist
    
    // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
    controller && controller.abort();
    controller = new AbortController();
    
    // show loading animation and hide the suggestions dropdown
    tagsSelector.loading(true).dropdown.hide();
    
    callAPIAS(`method=getTagProposals&hint=${value}`, {signal:controller.signal})
      .then(response => response.json())
      .then( (res) => {
        if(res["errorCode"] == 0) tagsSelector.whitelist = res["result"];
        tagsSelector.loading(false).dropdown.show(value);
    });
}

function onAuthorsSelectorInput( event ) {
    var value = event.detail.value;
    tagsSelector.whitelist = null; // reset the whitelist

    // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
    controller && controller.abort();
    controller = new AbortController();
  
    // show loading animation and hide the suggestions dropdown
    tagsSelector.loading(true).dropdown.hide();

    callAPIAS(`method=getAuthorProposals&hint=${value}`, {signal:controller.signal})
        .then(response => response.json())
        .then(function(res){
            if(res["errorCode"] == 0) tagsSelector.whitelist = res["result"];
            tagsSelector.loading(false).dropdown.show(value);
    });
}