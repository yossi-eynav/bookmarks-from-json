async function syncBookmarks(json) {
    const rootFolderName = json[0].title;
    const bookmarkStorageKey = `${rootFolderName}_rootBookmarkId`;

    const { rootBookmarkId } = await get({key: bookmarkStorageKey})
    const rootBookmarks =  await getBookmarks({id: rootBookmarkId});
    const rootBookmarkExists = Array.isArray(rootBookmarks);

    if(rootBookmarkExists) {
        const rootChildren = rootBookmarks[0].children || [];
        console.log('rootChildren', rootChildren)
        for (let index = 0; index < rootChildren.length; index++) {
            await removeBookmarkTree({id: rootChildren[index].id});
        }       
    }

    if(!rootBookmarkExists) {
        const {id} = await createBookmark(json[0]);
        await save({key: bookmarkStorageKey, value: id})

        await createNestedBookmarks({bookmarks: json});
    } else {
        await createNestedBookmarks({bookmarks: json[0].children, parentId: rootBookmarkId});
    }
}


async function syncJsonFiles() {
    const { jsonUrls } = await get({key: 'jsonUrls'});
    console.log(jsonUrls)
    if(!Array.isArray(jsonUrls)) { return; }

    console.log('jsonUrl', jsonUrls)
    jsonUrls.forEach(async (jsonUrl) => {

        const json = await fetch(jsonUrl).then(r => r.json()).catch(() => null);
        console.log(json)
        if(json) {
            syncBookmarks(json);
        }
    })

}

syncJsonFiles();

async function createNestedBookmarks({bookmarks, parentId}) {
   bookmarks.forEach(async (bookmark) => {
        const {id} = await createBookmark({parentId, title: bookmark.title, url: bookmark.url});
        if(bookmark.children) {
            createNestedBookmarks({bookmarks: bookmark.children, parentId: id});
        }
   })
}

function save({key, value}){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({[key]: value}, function() {
            resolve(value);
        });
    })
}

function get({key}){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], function(result) {
            resolve(result);
        });
    })
}

function createBookmark({parentId, title, url}) {
    return new Promise((resolve, reject) => {
        const payload = {title, url};
        if(parentId) {
            payload.parentId = parentId;
        }
        chrome.bookmarks.create(payload,
            function(newFolder) {
                console.log(newFolder);
                resolve(newFolder);
            });
    });
}


function getBookmarks({id}) {
    if(!id) { return Promise.resolve(null)}

    return new Promise((resolve, reject) => {
        try {
            chrome.bookmarks.getSubTree(id, (response) => {
                resolve(response);
            })
        } catch(e) {
            console.error(e);
            resolve(null);
        }
    
    });
}


function removeBookmarkTree({id}) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.removeTree(id, (response) =>  resolve(response));
    });
}