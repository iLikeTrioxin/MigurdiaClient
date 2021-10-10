window.$ = window.jQuery = require('jquery');

const imagesLoaded = require('imagesloaded');
const Masonry      = require('masonry-layout');
const { parseSize } = require('plupload');

function getFiles(wantedTags=[], unwantedTags=[]){
    let tags = {};

    if ( unwantedTags != [] ) tags['unwanted'] = unwantedTags;
    if (   wantedTags != [] ) tags[  'wanted'] =   wantedTags;
    
    let data = JSON.stringify(tags);

    return callAPIAS(`method=getFiles&tags=${data}`).then((res)=>{
        if( res['exitCode'] == 0 ) return res['result'];
        
        return false;
    });
}

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

function processPixivImage(URL){
	return postAsync(URL, "referer=https://www.pixiv.net/");
	//.then(res => {
	//	let dataType = res.headers.get("content-type");
	//	console.log("loaded 1");
	//	res.buffer().then(res => {
	//		console.log("loaded 2");
	//		loadingImages.push(addImage(`data:${dataType};base64,${res.toString("base64")}`));
	//	})
	//});
}

function processFileURL(URL){
	if(RegExp('https://i.pximg.net/*').test(URL)){
		return processPixivImage(URL);
	}else if (RegExp('https://fileblackhole.ddns.net/*').test(URL)){
		return false;
	}else{
		loadingImages.push(addImage(URL));
		return false;
	}
}

let loading = false;
function scrolledToTheBottom(){
	if(loading) return;
	
	loading = true;
	
    let posts = [];

    getFiles().then((res)=>{
        for(let i =0; i < res.length; i++){
            let re = processFileURL("https:"+res[i]['URL']);
            if (re != false) posts.push(re);
        }

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

function signout(moveToSignin){
    localStorage.removeItem('username'      );
    localStorage.removeItem('password'      );
    localStorage.removeItem('preventSignout');

    callAPIAS('method=signout', false).then( () => {
        moveToSignin ? (window.location.href = './signin.html') : null;
    });
}

window.addEventListener('click'       ,   clickCallback);
window.addEventListener('scroll'      ,  scrollCallback);

scrolledToTheBottom();
