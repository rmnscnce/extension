// ==UserScript==
// @name         PlaceID
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the canvas!
// @author       xilla, rmnscnce
// @match        https://hot-potato.reddit.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// ==/UserScript==

// Variables
var overlay_id = "indo_stable";
var overlay_filepaths = {
    "indo_stable": "overlay/indonesia/stable.png",
    "indo_testing": "overlay/indonesia/testing.png"
};
var overlay_versions = [] // The 0th index is the latest available revision
var overlay_XHR = new XMLHttpRequest();
console.log("Contacting GitHub...:" + "https://api.github.com/repos/rmnscnce/extension/commits?path=" + overlay_filepaths[overlay_id]);
overlay_XHR.open("GET", "https://api.github.com/repos/rmnscnce/extension/commits?path=" + overlay_filepaths[overlay_id], true);
overlay_XHR.onreadystatechange = function () {
    if (overlay_XHR.readyState == 4) {
        if (overlay_XHR.status == 200) {
            var responses = JSON.parse(xhr.responseText);
            for (var i in responses) {
                console.log("Adding version for " + overlay_id + ": " + i.sha);
                overlay_versions.push(i.sha);
            }
        }
    }
}
var overlay_versionIndex = 0; // Initialize at the latest revision

var overlay_image = {};

// Functions
function overlay_getVersions(id) {
    // get commits from github
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.github.com/repos/rmnscnce/extension/commits?path=" + overlay_filepaths[id], true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var response = JSON.parse(xhr.responseText);
            var versions = [];
            for (var i in response) {
                versions.push(i.sha);
            }
            return versions;
        }
    }
}

function overlay_blobUrl(id, version) {
    console.log("https://raw.githubusercontent.com/placeID/extension/" + version + "/" + overlay_filepaths[id]);
    return "https://raw.githubusercontent.com/placeID/extension/" + version + "/" + overlay_filepaths[id];
}

function overlay_loadImage(img, id, version) {
    img.src = overlay_blobUrl(id, version);
    console.log("Loading " + img.src);
    img.onload = () => {
        image.style = `position: absolute; left: 0; top: 0; width: ${image.width / 3}px; height: ${image.height / 3}px; image-rendering: pixelated; z-index: 1`;
    };
}

function overlay_back() {
    overlay_versionIndex++;

    overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
}

function overlay_forward() {
    overlay_versionIndex--;

    overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
}

function overlay_latest() {
    overlay_loadImage(overlay_image, overlay_id, overlay_versions[0]);

    overlay_versionIndex = 0;
}

function overlay_update() {
    overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
}

function overlay_changeOverlay(ev) {
    overlay_id = ev.target.value;
    overlay_update();
}

if (window.top !== window.self) {
    window.addEventListener('load', () => {
        // Load the image
        overlay_image = document.createElement("img");
        overlay_loadImage(overlay_image, overlay_id, overlay_versions[0]);

        // Add the image as overlay
        const camera = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-camera");
        const canvas = camera.querySelector("mona-lisa-canvas");
        if (canvas.shadowRoot) {
            canvas.shadowRoot.querySelector('.container').appendChild(overlay_image);
        }

        // Add a style to put a hole in the pixel preview (to see the current or desired color)
        const waitForPreview = setInterval(() => {
            const preview = camera.querySelector("mona-lisa-pixel-preview");
            if (preview) {
                clearInterval(waitForPreview);
                const style = document.createElement('style')
                style.innerHTML = '.pixel { clip-path: polygon(-20% -20%, -20% 120%, 37% 120%, 37% 37%, 62% 37%, 62% 62%, 37% 62%, 37% 120%, 120% 120%, 120% -20%); }'
                preview.shadowRoot.appendChild(style);
            }
        }, 100);

        // Add dropdown and history controls
        const waitForCoordsLayout = setInterval(() => {
            if (document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-coordinates").shadowRoot) {
                const coordsLayout = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-coordinates").shadowRoot.querySelector(".layout");
                if (coordsLayout) {
                    clearInterval(waitForCoordsLayout);
                    const overlayControls = document.createElement("div");
                    overlayControls.classList.add("overlay-controls");
                    overlayControls.innerHTML = `
                    <div class="overlay-box" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; border: 1px solid #ccc; border-radius: 5px; padding: 5px; background-color: #fff;">
                        <span style="margin-left: 10px; margin-right: 5px;">Overlay:</span>
                        <div class="dropdown">
                                <select id="overlay-select">
                                    <option disabled>r/Indonesia</option>
                                    <option value="indo_stable">Stable</option>
                                    <option value="indo_testing">Testing</option>
                                </select>
                                <button id="overlay-update">&#10227;</button>
                        </div>
                        <div class="history">
                            <button id="overlay-history-back" onclick="overlay_back()">&#9194;</button>
                            <button id="overlay-history-forward" onclick="overlay_forward()">&#9193;</button>
                            <button id="overlay-history-latest" onclick="overlay_latest()">&#9197;</button>
                        </div>
                    </div>
                    `;
                    coordsLayout.appendChild(overlayControls);
                    // Event listeners!
                    elem_overlaySelect = document.getElementById("overlay-select");
                    if (elem_overlaySelect) {
                        elem_overlaySelect.addEventListener("selectionchange", overlay_changeOverlay);
                    }
                    elem_overlayUpdate = document.getElementById("overlay-update");
                    if (elem_overlayUpdate) {
                        elem_overlayUpdate.addEventListener("click", overlay_update);
                    }
                    elem_overlayHistoryBack = document.getElementById("overlay-history-back");
                    if (elem_overlayHistoryBack) {
                        elem_overlayHistoryBack.addEventListener("click", overlay_back);
                    }
                    elem_overlayHistoryForward = document.getElementById("overlay-history-forward");
                    if (elem_overlayHistoryForward) {
                        elem_overlayHistoryForward.addEventListener("click", overlay_forward);
                    }
                    elem_overlayHistoryLatest = document.getElementById("overlay-history-latest");
                    if (elem_overlayHistoryLatest) {
                        elem_overlayHistoryLatest.addEventListener("click", overlay_latest);
                    }
                }
            }
        }, 250);
    }, false);
}
