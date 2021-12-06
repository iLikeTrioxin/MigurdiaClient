const plupload        = require('plupload'      );
const sharp           = require('sharp'         );
const VideoSnapshoter = require('video-snapshot').default;
const Tagify          = require('@yaireo/tagify');

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
  
    uploadFiles(files, chunkUploaded, fileUploaded, uploadComplete){
      let resp = postt(`${fileBlackHoleAPI}?method=createsession`, "");
          resp = JSON.parse(resp);
    
      SID = resp['result']['SID'];
      
      this.uploader.setOption('url', `${fileBlackHoleAPI}?method=uploadfilechunk&PHPSESSID=${SID}`)
      
      for(let i=0; i < files.length; i++){
          let file = files[i];
  
        this.uploader.addFile(file);
        postt(`${fileBlackHoleAPI}?method=startupload&fileSize=${file.size}&fileName=${file.name}`, "");
      }
      
      this.uploader.bind(  'FileUploaded',   fileUploaded);
      this.uploader.bind( 'ChunkUploaded',  chunkUploaded);
      this.uploader.bind('UploadComplete', uploadComplete);
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
async function getImageThumbnail(file, name){
    let image    = sharp(file).jpeg();
    let metadata = await image.metadata();
    
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

function randomInt(){
    return parseInt(Math.random() * Number.MAX_SAFE_INTEGER);
}

async function getVideoThumbnail(file){
    let snapshoter = new VideoSnapshoter(file);
    let snapshot   = await snapshoter.takeSnapshot();
        snapshot   = snapshot.substring(22);
        snapshot   = Buffer.from(snapshot, 'base64');
    
    return getImageThumbnail(snapshot);
}

async function getFileThumbnail(file){
    if(file.type.indexOf("image") != -1) return getImageThumbnail(file.path, `${getName(file.name)}.thumbnail.jpg`);
    if(file.type.indexOf("video") != -1) return getVideoThumbnail(file.path, `${getName(file.name)}.thumbnail.jpg`);

    return null;
}

async function getBlobThumbnail(blob, url){
    if(blob.type.indexOf("image") != -1) return blob.arrayBuffer().then( b => Buffer.from(b) ).then( b => getImageThumbnail(b, `${getName(url)}.thumbnail.jpg`) );
    if(blob.type.indexOf("video") != -1) return blob.arrayBuffer().then( b => Buffer.from(b) ).then( b => getVideoThumbnail(b, `${getName(url)}.thumbnail.jpg`) );
    
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
function postFile(){
    let file = document.getElementById('file').files[0];

    filesToUpload.push(file);

    document.getElementById('chooseFile' ).classList.add   ("hide");
    document.getElementById('postDetails').classList.remove("hide");
}

function getName(input){
    let name = input.split(/[ \\/]/);
        name = name[name.length-1];
        name = name.split('.')[0];
    
    return name;
}

let urlsToUpload = [];
function postURL() {
    let fileUrl = document.getElementById('fileURL').value;

    urlsToUpload.push(fileUrl);
    
    document.getElementById('chooseFile' ).classList.add   ("hide");
    document.getElementById('postDetails').classList.remove("hide");
}

urlsToSubmit = [];
let submitProcessing = false;
async function submit() {
    if( submitProcessing ) return;
    
    submitProcessing = true;
    
    let thumbnails = [];
    if(urlsToUpload.length != 0) {
        let promises = [];

        urlsToUpload.forEach( (url) => {
            promises.push(getBlob(url).then( (blob) => {
                return getBlobThumbnail(blob, url).then( (thumbnail) => {
                    urlsToSubmit.push({'url': url, 'name':getName(url)});
                    thumbnails  .push(thumbnail);
                });
            }));
        });

        await Promise.all(promises);
    }
    
    if(filesToUpload.length != 0) {
        let promises = [];

        filesToUpload.forEach(file => {
            promises.push(getFileThumbnail(file).then( (thumbnail) => {
                thumbnails.push(thumbnail);
            }));
        });
        
        await Promise.all(promises);
    }

    filesToUpload = filesToUpload.concat(thumbnails);

    filesToUpload.forEach( (file) => addTerminalLine(`${file.name}UploadProgress`, `${file.name} - upload started.`) );

    FileBlackHole.get().uploadFiles(
        filesToUpload,
        function(up, file, result){ changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - ${floatToPercentage(result.offset / result.total)}%`); },
        function(up, file, result) {
            resp = JSON.parse(result.response);
            if(resp['exitCode'] != 0 || result.status != 200)
                changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - failed`);
            
            changeTerminalLine(`${file.name}UploadProgress`, `${file.name} - completed (${resp['result']})`  );
            urlsToSubmit.push({'url': `https://fileblackhole.000webhostapp.com/files/${resp['result']}`, 'name':file.name});
        },
        function(up, files       ){ submitPosts(); }
    );
    filesToUpload = [];
}

function floatToPercentage(x){
    return parseInt(100 * x);
}

async function submitPosts(){
    files = {};
    urlsToSubmit.forEach( (url) => {
        filename = getName(url['name']);
        
        if(files[filename] == undefined) files[filename] = {};
    
        let isThumbnail = url['name'].indexOf("thumbnail") != -1;
        
        files[filename][isThumbnail ? "thumbnail" : "file"] = url['url'];
    });

    tags = [];
    tagsSelector.getCleanValue().forEach( (tag) =>  tags.push(tag['value']))
    
    filesToSubmit = [];
    for(file in files){
        if(files[file]['file'     ] == undefined) return;
        if(files[file]['thumbnail'] == undefined) return;

        let postName = document.getElementById('postName').value;
        if(postName == "") postName = "Untitled";

        filesToSubmit.push({
            "thumbnailUrl": files[file]["thumbnail"],
            "fileUrl"     : files[file]["file"],
            "tags"        : tags,
            "description" : document.getElementById('postDescription').value,
            "name"        : postName,
        });
    }
    
    
    filesToSubmit = JSON.stringify(filesToSubmit);
    console.log(`method=addPosts&posts=${filesToSubmit}`);
    callAPIAS(`method=addPosts&posts=${filesToSubmit}`);
    submitProcessing = false;
}

document.getElementById('file'        ).addEventListener('change', postFile);
document.getElementById('fileURL'     ).addEventListener('change', postURL);
document.getElementById('submitButton').addEventListener('click' , submit);

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
    let request = new XMLHttpRequest();
    
    request.open('POST', url, false);

    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // Send SID by post becouse xmlhttprequest refuses to set unsafe header cookie
    if(SID != null) data += "&PHPSESSID=" + SID;

    request.send(data);

    if(request.readyState !=   4) return;
    if(request.status     != 200) return;

    return request.responseText;
}

// init Tagify script on the queried input
tagsSelector = new Tagify(document.querySelector('#postTags'), {
    enforeWhitelist : true,
    delimiters      : ",|;"
});

// listen to any keystrokes which modify selector's input
tagsSelector.on('input', onTagsSelectorInput);

function onTagsSelectorInput( event ){
    let value = event.detail.value;
    tagsSelector.whitelist = null; // reset the whitelist
    
    // show loading animation and hide the suggestions dropdown
    tagsSelector.loading(true).dropdown.hide();
    
    callAPIAS(`method=getTagProposals&hint=${value}`)
      .then( (res) => {
        if(res["exitCode"] == 0) tagsSelector.whitelist = res['result'].map( e => e[1] );
        tagsSelector.loading(false).dropdown.show(value);
    });
}

var callbacks = [];
function clickCallback(event){
    callbacks.forEach( (element) => {
        if(element.target != event.target && element.exception != event.target) (element.callback)();
    });
}

callbacks.push(
    {
        target   : document.getElementById('userMenu'),
        exception: document.getElementById('userIcon'),
        callback : () => {
            document.getElementById('userMenu').classList.add('hide');
        }
    }
);

window.addEventListener('click', clickCallback);

document.getElementById('homeIcon'   ).addEventListener('click', (event) => { window.location.href = './explore.html' });
document.getElementById('signout'    ).addEventListener('click', (event) => { signout(true); } );
document.getElementById('userIcon'   ).addEventListener('click', (event) => {
    document.getElementById('userMenu').classList.toggle('hide');
});