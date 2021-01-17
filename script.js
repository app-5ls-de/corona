function f(url, callback) {
    fetch(url)
        .then((response) => {
            if (response.ok) {
                return Promise.resolve(response)
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        })
        .then((response) => {
            return response.json()
        })
        .then(callback)
        .catch((error) => {
            console.error('Request failed', error, url)
        })
}

function mount(parent, childs) {
    if (childs.length) {
        childs.forEach(child => {
            redom.mount(parent, child)
        })
    } else {
        redom.mount(parent, childs)
    }
}

var map = L.map('map', {
    zoomSnap: 0
})

map.setView([51.33061163769853, 10.458984375000002], 6)
