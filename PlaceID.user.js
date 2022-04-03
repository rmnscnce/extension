// ==UserScript==
// @name         PlaceID
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the canvas!
// @author       xilla, rmnscnce
// @match        https://hot-potato.reddit.com/embed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

console.log(String.raw`
 ______ __                    _______ _____       _______                    __              
|   __ \  |.---.-.----.-----.|_     _|     \     |       |.--.--.-----.----.|  |.---.-.--.--.
|    __/  ||  _  |  __|  -__| _|   |_|  --  |    |   -   ||  |  |  -__|   _||  ||  _  |  |  |
|___|  |__||___._|____|_____||_______|_____/     |_______| \___/|_____|__|  |__||___._|___  |
                                                                                      |_____|

    r/place 2022
    `);

// Variables
var overlay_id = "indo_stable";
var overlay_filepaths = {
    "indo_stable": "overlay/indonesia/stable.png",
    "indo_testing": "overlay/indonesia/testing.png",
    "indomie_stable": "overlay/indomie/stable.png"
};
var overlay_versions = [] // The 0th index is the latest available revision
GM_xmlhttpRequest({
    url: "https://api.github.com/repos/rmnscnce/extension/commits?path=" + overlay_filepaths[overlay_id],
    method: "GET",
    onreadystatechange: XHR_response => {
        if (XHR_response.readyState == 4) {
            if (XHR_response.status == 200) {
                var responses = JSON.parse(XHR_response.responseText);
                console.log("Got " + responses.length + " responses");
                for (var i = 0; i < responses.length; i++) {
                    console.log("Adding version for " + overlay_id + ": " + responses[i].sha);
                    overlay_versions.push(responses[i].sha);
                }
            } else {
                console.log("Error: " + XHR_response.status);
            }
        }
    }
});

var overlay_versionIndex = 0; // Initialize at the latest revision
var overlay_hasBeenAppended = false;
var overlay_dotsHasBeenAppended = false;

var overlay_image = {};

// Functions
function overlay_getVersions(id) {
    // Get commits through GitHub API
    console.log("Processing versions for " + id);
    GM_xmlhttpRequest({
        url: "https://api.github.com/repos/rmnscnce/extension/commits?path=" + overlay_filepaths[id],
        method: "GET",
        onreadystatechange: XHR_response => {
            if (XHR_response.readyState == 4) {
                if (XHR_response.status == 200) {
                    var responses = JSON.parse(XHR_response.responseText);
                    console.log("Got " + responses.length + " responses");
                    var versions = [];
                    for (var i = 0; i < responses.length; i++) {
                        console.log("Adding version for " + id + ": " + responses[i].sha);
                        versions.push(responses[i].sha);
                    }
                    return versions;
                } else {
                    console.log("Error: " + XHR_response.status);
                }
            }
        }
    });
}

function overlay_blobUrl(id, version) {
    console.log("URL for " + version + "@" + id + "https://raw.githubusercontent.com/rmnscnce/extension/" + version + "/" + overlay_filepaths[id]);
    return "https://raw.githubusercontent.com/rmnscnce/extension/" + version + "/" + overlay_filepaths[id];
}

function overlay_loadImage(img, id, version) {
    img.src = overlay_blobUrl(id, version);
    console.log("Loading " + img.src);
    img.onload = () => {
        img.style = `position: absolute; left: 0; top: 0; width: ${img.width / 3}px; height: ${img.height / 3}px; image-rendering: pixelated; z-index: 1`;
    };

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
            console.log("Showing the dot overlay...");
            const style = document.createElement('style')
            style.id = "overlay-style";
            style.innerHTML = '.pixel { clip-path: polygon(-20% -20%, -20% 120%, 37% 120%, 37% 37%, 62% 37%, 62% 62%, 37% 62%, 37% 120%, 120% 120%, 120% -20%); }'
            preview.shadowRoot.appendChild(style);
        }
    }, 250);
}

// Main sequence
if (window.top !== window.self) {
    window.addEventListener('load', () => {
        // Load the image
        const waitForVersionPopulated = setInterval(() => {
            if (overlay_versions.length > 0) {
                clearInterval(waitForVersionPopulated);
                overlay_image = document.createElement("img");
                overlay_image.id = "overlay-image";
                console.log("Loading image for " + overlay_id + ": " + overlay_versions[overlay_versionIndex]);
                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);

                // Add dropdown and history controls
                const waitForCoordsLayout = setInterval(() => {
                    if (document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-coordinates")) {
                        const coordsLayout = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-coordinates").shadowRoot.querySelector(".layout");
                        if (coordsLayout) {
                            clearInterval(waitForCoordsLayout);
                            console.log("Adding control widgets...");
                            const overlayControls = document.createElement("div");
                            overlayControls.classList.add("overlay-controls");
                            overlayControls.style = `
                            display: flex;
                            flex-direction: row;
                            justify-content: space-between;
                            align-items: center;
                            border: 1px solid #ccc;
                            border-radius: 5px;
                            padding: 5px;
                            background-color: #fff;
                            `;

                            const overlayLabelWidget = document.createElement("span");
                            overlayLabelWidget.style = `
                            margin-left: 10px;
                            margin-right: 5px;
                            `;
                            overlayLabelWidget.textContent = "Overlay:";
                            overlayControls.appendChild(overlayLabelWidget);

                            const overlayDropdownWidget = document.createElement("div");
                            overlayDropdownWidget.classList.add("dropdown");
                            overlayControls.appendChild(overlayDropdownWidget);

                            const overlayDropdownWidgetSelector = document.createElement("select");
                            overlayDropdownWidgetSelector.id = "overlay-select";
                            overlayDropdownWidget.appendChild(overlayDropdownWidgetSelector);

                            var overlayDropdownWidgetEntries = [
                                {
                                    "text": "r/Indonesia",
                                    "disabled": true,
                                    "value": null
                                },
                                {
                                    "text": "Stable",
                                    "disabled": false,
                                    "value": "indo_stable"
                                },
                                {
                                    "text": "Testing",
                                    "disabled": false,
                                    "value": "indo_testing"
                                },
                                {
                                    "text": "Indomie",
                                    "disabled": true,
                                    "value": null
                                },
                                {
                                    "text": "Stable",
                                    "disabled": false,
                                    "value": "indomie_stable"
                                },
                            ];

                            overlayDropdownWidgetEntries.forEach(entry => {
                                const option = document.createElement("option");
                                option.textContent = entry.text;
                                option.disabled = entry.disabled;
                                option.value = entry.value;
                                overlayDropdownWidgetSelector.appendChild(option);
                            });

                            overlayDropdownWidgetSelector.addEventListener("change", () => {
                                overlay_id = overlayDropdownWidgetSelector.value;
                                overlay_versionIndex = 0;
                                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
                            });

                            const overlayUpdateWidget = document.createElement("button");
                            overlayUpdateWidget.id = "overlay-update";
                            overlayUpdateWidget.textContent = "⟳";
                            overlayUpdateWidget.style = `
                            margin-left: 5px;
                            margin-right: 5px;
                            `;
                            overlayUpdateWidget.addEventListener("click", () => {
                                console.log("Updating " + overlay_id);
                                overlay_getVersions(overlay_id);
                                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
                            });
                            overlayControls.appendChild(overlayUpdateWidget);

                            const overlayHistoryWidget = document.createElement("div");
                            overlayHistoryWidget.classList.add("history");
                            overlayControls.appendChild(overlayHistoryWidget);

                            const overlayHistoryBackWidget = document.createElement("button");
                            overlayHistoryBackWidget.id = "overlay-history-back";
                            overlayHistoryBackWidget.textContent = "⏪";
                            overlayHistoryBackWidget.style = `
                            margin-left: 5px;
                            margin-right: 5px;
                            `;
                            overlayHistoryBackWidget.addEventListener("click", () => {
                                console.log("Using an older overlay version");
                                overlay_versionIndex++;

                                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
                            });
                            overlayHistoryWidget.appendChild(overlayHistoryBackWidget);

                            const overlayHistoryForwardWidget = document.createElement("button");
                            overlayHistoryForwardWidget.id = "overlay-history-forward";
                            overlayHistoryForwardWidget.textContent = "⏩";
                            overlayHistoryForwardWidget.style = `
                            margin-left: 5px;
                            margin-right: 5px;
                            `;
                            overlayHistoryForwardWidget.addEventListener("click", () => {
                                console.log("Using a newer overlay version");
                                overlay_versionIndex--;

                                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
                            });
                            overlayHistoryWidget.appendChild(overlayHistoryForwardWidget);

                            const overlayHistoryLatestWidget = document.createElement("button");
                            overlayHistoryLatestWidget.id = "overlay-history-latest";
                            overlayHistoryLatestWidget.textContent = "⏭";
                            overlayHistoryLatestWidget.style = `
                            margin-left: 5px;
                            margin-right: 5px;
                            `;
                            overlayHistoryLatestWidget.addEventListener("click", () => {
                                console.log("Using the latest overlay version");
                                overlay_versionIndex = 0;

                                overlay_loadImage(overlay_image, overlay_id, overlay_versions[overlay_versionIndex]);
                            });
                            overlayHistoryWidget.appendChild(overlayHistoryLatestWidget);
                            coordsLayout.appendChild(overlayControls);
                        }
                    }
                }, 250);
            }
        }, 250);
    }, false);
}
