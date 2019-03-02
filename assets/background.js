function didRootChanged({rootBookmarks, json}) {
    if(rootBookmarks.title !== json.title) {
        console.warn('Tree is not equal',rootBookmarks.title, json.title)
        return true;
    }

    if(new URL(rootBookmarks.url || 'https://google.com').toString() !== new URL(json.url || 'https://google.com').toString()) {
        console.warn('Tree is not equal',rootBookmarks.url, json.url);
        return true;
    }
    if((rootBookmarks.children && !json.children) || !rootBookmarks.children && json.children) {
        console.warn('Tree is not equal',rootBookmarks.children, json.children)
        return true;
    }

    if (rootBookmarks.children) {
        if(rootBookmarks.children.length !== json.children.length) { return false; }
        return rootBookmarks.children.some((child, index) => didRootChanged({rootBookmarks: child, json: json.children[index] }))
    } else {
        return false;
    }
}

async function syncBookmarks(json) {
    const rootFolderName = json[0].title;
    const bookmarkStorageKey = `${rootFolderName}_rootBookmarkId`;

    const results = await getLocal({key: bookmarkStorageKey});
    const rootBookmarkId = results[bookmarkStorageKey];

    const rootBookmarks =  await getBookmarks({id: rootBookmarkId});
    const rootBookmarkExists = Array.isArray(rootBookmarks);

    if(rootBookmarkExists) {
        if(didRootChanged({rootBookmarks: {children: rootBookmarks[0].children}, json:  {children: json[0].children}})) {
            console.warn('root folder changed!')
            const rootChildren = rootBookmarks[0].children || [];
            console.log('rootChildren', rootChildren)
            for (let index = 0; index < rootChildren.length; index++) {
                await removeBookmarkTree({id: rootChildren[index].id});
            }
            await createNestedBookmarks({bookmarks: json[0].children, parentId: rootBookmarkId});
        }
    }

    if(!rootBookmarkExists) {
        const {id} = await createBookmark(json[0]);
        await saveLocal({key: bookmarkStorageKey, value: id});
        await createNestedBookmarks({bookmarks: json[0].children, parentId: id});
    }
}


async function syncJsonFiles() {
    const { jsonUrls } = await get({key: 'jsonUrls'});
    console.log(jsonUrls)
    if(!Array.isArray(jsonUrls)) { return; }

    console.log('jsonUrl', jsonUrls)
    jsonUrls.forEach(async (jsonUrl) => {

        const json = await fetch(jsonUrl).then(r => r.json()).catch(() => null);
        if(json) {
            syncBookmarks(json);
        }
    })

}

syncJsonFiles();
setInterval(() => {
    syncJsonFiles();
}, 60000)

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "syncJsonUrls") {
            syncJsonFiles();
        }
    });



async function createNestedBookmarks({bookmarks, parentId}) {
    for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i];
        const {id} = await createBookmark({parentId, title: bookmark.title, url: bookmark.url});
        if(bookmark.children) {
            createNestedBookmarks({bookmarks: bookmark.children, parentId: id});
        }
    }
}

function get({key}){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], function(result) {
            resolve(result);
        });
    })
}

function saveLocal({key, value}){
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: value}, function() {
            resolve(value);
        });
    })
}

function getLocal({key}){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function(result) {
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