const Masonry = require('masonry-layout');

'use strict';

var gallery = document.getElementById('gallery');
var masonryGallery = new Masonry( gallery, {
    itemSelector: '.gallery-item',
    fitWidth    : true,
    gutter      : 10
});

function addImage(src){
    let image = document.createElement('img');
    image.setAttribute('src', src);
    image.setAttribute('alt', 'Image');
    
    let item = document.createElement('div');
    item.classList.add('gallery-item');
    item.appendChild(image);

    gallery.appendChild(item);
    masonryGallery.appended(item);
    //item.addEventListener('click', function(){
    //    
    //});
    return image;
}

var __postsLoading__ = false;
var __seenPosts__    = [];
async function scrolledToTheBottom(first=false) {
	if(__postsLoading__) return;
	
	__postsLoading__ = true;
	let promises = [];

    getPosts(first ? 15 : 30).then( (files) => {
        files.forEach( (file ) => {
            if(__seenPosts__.includes(file['id'])) return;
            
            __seenPosts__.push(file['id']);
            
            promises.push(
                getRealSource( (file['thumbnailHosting'] ?? '') + file['thumbnailPath'] )
                .then( src => {
                    return new Promise( (r) => {
                        addImage(src).addEventListener('load', () => { masonryGallery.layout(); r(); });
                    });
                })
            );
        });
    });

    Promise.all(promises).then(() => { __postsLoading__ = false; });
}

scrolledToTheBottom(true);

function scrolledUp(){
    document.getElementById('menuBar').style.top = '25px';
}

function scrolledDown(){
    document.getElementById('menuBar').style.top = '-50px';
    document.getElementById('userMenu').classList.add('hide');
}

var previousYPos;
function scrollCallback(event){
    let yPos = (window.innerHeight + window.scrollY);
    
    // reason for using else if is that first run of this function won't run any of those
    // with previousYPos being undefined while if else will run else in this case
    if      (previousYPos < yPos) scrolledDown();
    else if (previousYPos > yPos) scrolledUp  ();
    
    previousYPos = yPos;
    
    if (yPos > document.body.scrollHeight * 0.85) scrolledToTheBottom();
}

var callbacks = [];
function clickCallback(event){
    callbacks.forEach( (element) => {
        if(element.target != event.target && element.exception != event.target) (element.callback)();
    });
}

document.getElementById('signout'       ).addEventListener('click', function(event) { signout(true); } );
document.getElementById('uploadIcon'    ).addEventListener('click', function(event) { window.location.href = './upload.html'; } );
document.getElementById('userIcon'      ).addEventListener('click', function(event) {
    document.getElementById('userMenu').classList.toggle('hide');
});

callbacks.push({
    target   :         document.getElementById('userMenu'),
    exception:         document.getElementById('userIcon'),
    callback : () => { document.getElementById('userMenu').classList.add('hide'); }
});

window.addEventListener('click' ,  clickCallback);
window.addEventListener('scroll', scrollCallback);

// Update checking is loaded last to not slow down initial post loading

const {ipcRenderer} = require('electron');

document.getElementById('updateAvaiable').addEventListener('click', () => {
    window.removeEventListener('scroll', scrollCallback);
    
    function yes() {
        window.addEventListener('scroll', scrollCallback);
        ipcRenderer.sendSync('update-download');
        addProgressWindow('updating', 'downloading', 0);
    }

    function no() {
        window.addEventListener('scroll', scrollCallback);
    }

    askUser('Update', 'Do you want to update?', yes, no);
});

ipcRenderer.on('update-downloaded', (event, info) => {
    removeProgressWindow();
    
    askUser(
        'Update downloaded', 'restart is required<br/>Do you want to restart now?',
        () => { ipcRenderer.sendSync('update-quitAndInstall');                   },
        () => { document.getElementById('updateAvaiable').classList.add('hide'); }
    );
});

ipcRenderer.on('download-progress', (progressObject) => {
    setProgressWindowProgress(progressObject.percent);
});

ipcRenderer.on('update-error', function(err) {
    removeProgressWindow();
    error('An error occurred during update. Try later.', 3000);
});

ipcRenderer.on('update-available', () => {
    document.getElementById('updateAvaiable').classList.remove('hide');
});

ipcRenderer.sendSync('check');
