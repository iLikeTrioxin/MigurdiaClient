window.$ = window.jQuery = require('jquery');

const imagesLoaded  = require('imagesloaded');
const Masonry       = require('masonry-layout');
const { parseSize } = require('plupload');

var masonryGallery = new Masonry(
    '.gallery',
    {
        itemSelector: '.gallery-item',
        fitWidth    : true,
        gutter      : 10
    }
);

var elem = document.getElementById('gallery');

let loadingImages = [];
function addImage(src){
    var image = document.createElement("img");
    image.setAttribute("src", src);
    image.setAttribute("alt", "Image");
    
    var item = document.createElement("div");
    item.classList.add("gallery-item");
    item.appendChild(image);

    elem.appendChild(item);
    masonryGallery.appended(item);
    //item.addEventListener('click', function(){
    //    
    //});
	loadingImages.push(item);
    return item;
}

function scrolledUp(){
    document.getElementById('menuBar').style.top = "0px";
}

function scrolledDown(){
    document.getElementById('menuBar').style.top = "-50px";
    document.getElementById('userMenu').classList.add('hide');
}

let loading = false;
function scrolledToTheBottom(first=false) {
	if(loading) return;
	
	loading = true;
	
    getPosts(first ? 15 : 30).then( (files) => {
        let posts = [];

        files.forEach( (file ) => {
            posts.push(addImage(getRealSource(file['thumbnailUrl'])));
        });

        Promise.all(posts).then(() =>{
            $(loadingImages).imagesLoaded().done(() => {
                masonryGallery.layout();
                loadingImages = [];
                loading = false;
            });
        });
    });
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

document.getElementById('signout'    ).addEventListener('click', function(event) { signout(true); } );
document.getElementById('uploadIcon' ).addEventListener('click', function(event) { console.log("here"); window.location.href = './upload.html'; } );
document.getElementById('userIcon'   ).addEventListener('click', function(event) {
    document.getElementById('userMenu').classList.toggle('hide');
});

callbacks.push(
    {
        target   : document.getElementById('userMenu'),
        exception: document.getElementById('userIcon'),
        callback : function(){
            document.getElementById('userMenu').classList.add('hide');
        }
    }
);

window.addEventListener('click'       ,   clickCallback);
window.addEventListener('scroll'      ,  scrollCallback);

scrolledToTheBottom(true);