// ==UserScript==
// @name         PlaceID
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the canvas!
// @author       xilla
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
var overlay_versions = overlay_getVersions(overlay_id); // The 0th index is the latest available revision
var overlay_versionIndex = 0;

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
    return "https://raw.githubusercontent.com/placeID/extension/"+ version + "/" + overlay_filepaths[id];
}

function overlay_update(id) {
    overlay_getVersions(id);
    overlay_latest();
}

function overlay_loadImage(img, id, version) {
    img.src = overlay_blobUrl(id, version);
    img.onload = () => {
        image.style = `position: absolute; left: 0; top: 0; width: ${image.width/3}px; height: ${image.height/3}px; image-rendering: pixelated; z-index: 1`;
    };
}

if (window.top !== window.self) {
    window.addEventListener('load', () => {
        // Load the image
        const image = document.createElement("img");

        function overlay_changeOverlay(id) {
            overlay_latest(image, id);
        }

        function overlay_back() {
            overlay_versionIndex++;

            overlay_loadImage(image, overlay_id, overlay_versions[overlay_versionIndex]);
        }

        function overlay_forward() {
            overlay_versionIndex--;

            overlay_loadImage(image, overlay_id, overlay_versions[overlay_versionIndex]);
        }

        function overlay_latest() {
            overlay_loadImage(image, overlay_id, overlay_versions[0]);

            overlay_versionIndex = 0;
        }

        overlay_loadImage(image, overlay_id, overlay_versions[0]);

        // Add the image as overlay
        const camera = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-camera");
        const canvas = camera.querySelector("mona-lisa-canvas");
        canvas.shadowRoot.querySelector('.container').appendChild(image);
      
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
            const coordsLayout = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-coordinates").shadowRoot.querySelector(".layout");
            if(coordsLayout) {
                clearInterval(waitForCoordsLayout);
                const overlayControls = document.createElement("div");
                overlayControls.classList.add("overlay-controls");
                overlayControls.innerHTML = `
                    <div class="overlay-box" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; border: 1px solid #ccc; border-radius: 5px; padding: 5px; background-color: #fff;">
                        <span style="margin-left: 10px; margin-right: 5px;">Overlay:</span>
                        <div class="dropdown">
                                <select id="overlay-select" onchange="overlay_changeOverlay(this.options[this.selectedIndex].value)">
                                    <option disabled>r/Indonesia</option>
                                    <option value="indo_stable">Stable</option>
                                    <option value="indo_testing">Testing</option>
                                </select>
                                <button id="overlay-update" onclick="overlay_update()">&#10227;</button>
                        </div>
                        <div class="history">
                            <button id="overlay-history-back" onclick="overlay_back()">&#9194;</button>
                            <button id="overlay-history-forward" onclick="overlay_forward()">&#9193;</button>
                            <button id="overlay-history-latest" onclick="overlay_latest()">&#9197;</button>
                        </div>
                    </div>
                    `;
                coordsLayout.appendChild(overlayControls);
            }
        }, 250);

    }, false);
}
