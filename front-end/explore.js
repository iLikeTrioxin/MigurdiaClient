const {ipcRenderer} = require('electron');
const imagesLoaded  = require('imagesloaded');
const Masonry       = require('masonry-layout');

//'use strict';

var masonryGallery = new Masonry(
    '.gallery',
    {
        itemSelector: '.gallery-item',
        fitWidth    : true,
        gutter      : 10
    }
);

var elem = document.getElementById('gallery');

function addImage(src){
    let image = document.createElement("img");
    image.setAttribute("src", src);
    image.setAttribute("alt", "Image");
    
    let item = document.createElement("div");
    item.classList.add("gallery-item");
    item.appendChild(image);

    elem.appendChild(item);
    masonryGallery.appended(item);
    //item.addEventListener('click', function(){
    //    
    //});
    return image;
}

function scrolledUp(){
    document.getElementById('menuBar').style.top = "0px";
}

function scrolledDown(){
    document.getElementById('menuBar').style.top = "-50px";
    document.getElementById('userMenu').classList.add('hide');
}

let seenPosts = [];
let loading = false;
async function scrolledToTheBottom(first=false) {
	if(loading) return;
	
	loading = true;
	let promises = [];

    getPosts(first ? 15 : 30).then( (files) => {
        files.forEach( (file ) => {
            if(seenPosts.includes(file['id'])) return;
            
            seenPosts.push(file['id']);
            
            promises.push(
                getRealSource( (file['thumbnailHosting'] ?? "") + file['thumbnailPath'] )
                .then( src => {
                    return new Promise( (r) => {
                        addImage(src).addEventListener('load', () => { masonryGallery.layout(); r(); })
                    });
                })
            );
        });
    });

    Promise.all(promises).then(() => { loading = false; });
}

var previousYPos = (window.innerHeight + window.scrollY);
function scrollCallback(event){
    let yPos = (window.innerHeight + window.scrollY);
    
    // check if
    if (previousYPos < yPos)
        scrolledDown();
    else
        scrolledUp();
    
    previousYPos = yPos;
    
    //
    if (yPos > document.body.scrollHeight * 0.85) scrolledToTheBottom();
}


var callbacks = [];
function clickCallback(event){
    callbacks.forEach(function(element){
        if(element.target != event.target && element.exception != event.target) (element.callback)();
    });
}

//document.querySelector('.topArrow').addEventListener('click', function(){window.scrollTo(0, 0);});

document.getElementById('signout'       ).addEventListener('click', function(event) { signout(true); } );
document.getElementById('uploadIcon'    ).addEventListener('click', function(event) { window.location.href = './upload.html'; } );
document.getElementById('userIcon'      ).addEventListener('click', function(event) {
    document.getElementById('userMenu').classList.toggle('hide');
});

callbacks.push(
    {
        target   : document.getElementById('userMenu'),
        exception: document.getElementById('userIcon'),
        callback : () => {
            document.getElementById('userMenu').classList.add('hide');
        }
    }
);

window.addEventListener('click' ,  clickCallback);
window.addEventListener('scroll', scrollCallback);

function cancelUpdate(){
    unlockScreen();
    unlockScroll();
    
    window.addEventListener('scroll', scrollCallback);
    
    document.getElementById('updateWindow'  ).classList.add   ('hide');
    document.getElementById('updateAvaiable').classList.remove('hide');
}

function confirmUpdate(){
    document.getElementById('askForUpdate').classList.add   ('hide');
    document.getElementById('installer'   ).classList.remove('hide');
    move();
}

function updatePopup(){
    lockScreen();
    lockScroll();

    window.removeEventListener('scroll', scrollCallback);

    document.getElementById('updateWindow'  ).classList.remove('hide');
    document.getElementById('updateAvaiable').classList.add   ('hide');
}

function move() {
    var progressBar = document.getElementById("progressBar");
    var width = 1;
    var id = setInterval( () => {
        if (width >= 100) {
            clearInterval(id);
            width = 0;
        } else {
            width++;
            progressBar.style.width = width + "%";
        }
    }, 10);
}

document.getElementById('updateAvaiable').addEventListener('click', () =>{
    window.removeEventListener('scroll', scrollCallback);
    
    function yes() {
        window.addEventListener('scroll', scrollCallback);
        autoUpdater.fire('download-update');
        addProgressWindow('updating', 'downloading', 0);
    }

    function no() {
        window.addEventListener('scroll', scrollCallback);
    }

    askUser("Update", "Do you want to update?", yes, no);
});

scrolledToTheBottom(true);

ipcRenderer.on('update-downloaded', (event, info) => {
    removeProgressWindow();
    askUser("Update downloaded", "restart is required<br/>Do you want to restart now?", ()=>{
        ipcRenderer.sendSync('update-quitAndInstall');
    }, ()=>{ ipcRenderer.sendSync('update-install'); document.getElementById('updateAvaiable').classList.add('hide'); });
});

ipcRenderer.on('download-progress', (progressObject) => {
    setProgressWindowProgress(progressObject.percent);
});

ipcRenderer.on('update-error', function(err) {
    removeProgressWindow();
    error("An error occurred during update. Try later.", 3000);
});

ipcRenderer.on('update-available', () => {
    document.getElementById('updateAvaiable').classList.remove('hide');
});

ipcRenderer.sendSync('check');