import * as fs from 'fs-extra';

import { Effects } from '@crowbartools/firebot-custom-scripts-types/types/effects';
import template from './play-video.html'
import { modules, settings } from './main';
import EffectType = Effects.EffectType;
import { videoManager } from './video-manager';
import Video from './@types/Video';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface EffectModel {
    id: string;

    videoType: 'Local Video' | 'Random From Folder';
    file: string;

    wait: boolean;
    loop: boolean;

    position: string;
    height: string;
    width: string;

    folder: string;
    length: number;
    starttime: number;
    enterAnimation: string;
    enterDuration: number;
    exitAnimation: string;
    exitDuration: number;
    inbetweenAnimation: string;
    inbetweenDelay: number;
    inbetweenDuration: number;
    inbetweenRepeat: number;
    customCoords: string;
}

interface OverlayData {
    overlayInstance: string;
    volume: number;
}

/* https://github.com/crowbartools/Firebot/blob/master/src/backend/common/handlers/mediaProcessor.js#L40-L44 */
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* https://github.com/crowbartools/Firebot/blob/master/src/backend/common/handlers/mediaProcessor.js#L46-L61 */
function getRandomPresetLocation(): string {
    const presetPositions = [
        "Top Left",
        "Top Middle",
        "Top Right",
        "Middle Left",
        "Middle",
        "Middle Right",
        "Bottom Left",
        "Bottom Middle",
        "Bottom Right"
    ];

    const randomIndex = getRandomInt(0, presetPositions.length - 1);
    return presetPositions[randomIndex];
}

const effect: EffectType<EffectModel & OverlayData> = {
    definition: {
        id: 'lordmau5:playvideo:play-video-plus-plus',
        name: 'Play Video++',
        description: 'Enhanced version of the Play Video effect with folder support and effect outputs',
        icon: 'fad fa-video',
        // @ts-ignore
        categories: ['common', 'overlay'],
        // @ts-ignore
        dependencies: ['overlay'],
        // @ts-ignore
        outputs: [
            {
                label: 'Video Length',
                description: 'The played video length in seconds.',
                defaultName: 'videoLength'
            }
        ]
    },
    optionsTemplate: template,
    optionsController: ($scope, utilityService: any, backendCommunicator: any, $q: any, $timeout: any) => {
        $scope.waitChange = () => {
            if ($scope.effect.wait) {
                $scope.effect.loop = false;
            }
        };
        $scope.showOverlayInfoModal = function (overlayInstance: any) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };

        $scope.videoPositions = [
            "Top Left",
            "Top Middle",
            "Top Right",
            "Middle Left",
            "Middle",
            "Middle Right",
            "Bottom Left",
            "Bottom Middle",
            "Bottom Right"
        ];

        // Clear videos played state
        $scope.clearVideosPlayed = function () {
            backendCommunicator.fireEvent('play-video-plus-plus:clear-videos-played', $scope.effect.id);
            $scope.playedVideosCleared = true;
        };

        // Set Video Type
        $scope.setVideoType = function (type: 'Local Video' | 'Random From Folder') {
            $scope.effect.videoType = type;
            $scope.effect.file = '';

            $timeout(function () {
                // $rootScope.$broadcast("rzSliderForceRender");
            }, 100);
        };

        if ($scope.effect.volume == null) {
            $scope.effect.volume = 5;
        }

        // Force ratio toggle
        $scope.forceRatio = true;
        $scope.forceRatioToggle = function () {
            if ($scope.forceRatio === true) {
                $scope.forceRatio = false;
            } else {
                $scope.forceRatio = true;
            }
        };

        // Calculate 16:9
        // This checks to see which field the user is filling out, and then adjust the other field so it's always 16:9.
        $scope.calculateSize = function (widthOrHeight: 'Width' | 'Height', size: any) {
            if (size !== "") {
                if (widthOrHeight === "Width" && $scope.forceRatio === true) {
                    $scope.effect.height = String(Math.round((size / 16) * 9));
                } else if (widthOrHeight === "Height" && $scope.forceRatio === true) {
                    $scope.effect.width = String(Math.round((size * 16) / 9));
                }
            } else {
                $scope.effect.height = "";
                $scope.effect.width = "";
            }
        };
    },
    optionsValidator: (effect) => {
        const errors = [];

        if (effect.videoType == null) {
            errors.push('Please select a video type.');
        }

        return errors;
    },
    onTriggerEvent: async (scope) => {
        const effect = scope.effect;

        // What should this do when triggered.
        let position = effect.position;
        if (position === 'Random') {
            position = getRandomPresetLocation();
        }

        // Send data back to media.js in the gui.
        const data = {
            filepath: effect.file,
            videoPosition: position,
            videoHeight: effect.height,
            videoWidth: effect.width,
            videoDuration: effect.length,
            videoVolume: effect.volume,
            videoStarttime: effect.starttime,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat,
            customCoords: effect.customCoords,
            loop: effect.loop === true,
            // @ts-ignore
            overlayInstance: null,
        };

        if (effect.videoType === 'Random From Folder') {
            // Get random sound
            let files: string[] = [];
            try {
                files = await fs.readdir(effect.folder);
            } catch (err) {
                modules.logger.error('Unable to read video folder', err);
                return false;
            }

            const videos: Video[] = [];
            files.forEach(file => {
                videos.push({
                    path: file,
                    played: false
                });
            });

            videoManager.updateVideos(effect.id, videos);

            const video = videoManager.getUnplayedVideo(effect.id);

            if (video != null) {
                data.filepath = modules.path.join(effect.folder, video.path);
            } else {
                modules.logger.error('No video were found in the selected video folder.');
                return false;
            }
        }

        if (settings.useOverlayInstances()) {
            if (effect.overlayInstance != null) {
                if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        let duration;
        const result: any = await modules.frontendCommunicator.fireEventAsync('getVideoDuration', data.filepath);
        if (!isNaN(result)) {
            duration = result;
        }

        data.videoDuration = duration;

        // Generate token if going to overlay, otherwise send to gui.
        // @ts-ignore
        data.resourceToken = modules.resourceTokenManager.storeResourcePath(
            data.filepath,
            duration
        );
        // send event to the overlay
        modules.httpServer.sendToOverlay('play-video-plus-plus', data);

        if (effect.wait) {
            let internalDuration: any = data.videoDuration;
            if (internalDuration == null || internalDuration === 0 || internalDuration === '') {
                internalDuration = duration;
            }
            await wait(internalDuration * 1000);
        }

        return {
            success: true,
            outputs: {
                videoLength: duration
            }
        };
    },
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: 'play-video-plus-plus',
            onOverlayEvent: (event: any) => {
                // @ts-ignore
                if (!startedVidCache) {
                    // @ts-ignore
                    startedVidCache = {};
                }

                function animateVideoExit(idString: any, animation: any, duration: any, inbetweenAnimation: any) {
                    if (inbetweenAnimation) {
                        // @ts-ignore
                        $(idString).find(".inner-position").css("animation-duration", "");
                        // @ts-ignore
                        $(idString).find(".inner-position").css("animation-delay", "");
                        // @ts-ignore
                        $(idString).find(".inner-position").css("animation-iteration-count", "");
                        // @ts-ignore
                        $(idString)
                            .find(".inner-position")
                            .removeClass("animated " + inbetweenAnimation);
                    }

                    // @ts-ignore
                    $(idString)
                        .find(".inner-position")
                        .animateCss(animation, duration, null, null, () => {
                            // @ts-ignore
                            $(idString).remove();
                        });
                }
                function millisecondsFromString(time: any) {
                    if (time === undefined) { // Default delay seems to be a second
                        return 1000;
                    }
                    else if (time.includes('ms')) {
                        return parseFloat(time.match(/[\d.]+/));
                    }
                    else { // Time is in seconds
                        return parseFloat(time.match(/[\d.]+/)) * 1000;
                    }
                }

                const data = event;

                const filepath = data.filepath ?? "";
                let fileExt = filepath.split(".").pop();
                if (fileExt === "ogv") {
                    fileExt = "ogg";
                }

                const videoDuration =
                    data.videoDuration != null && data.videoDuration !== ""
                        ? parseFloat(data.videoDuration) * 1000
                        : null;
                let videoVolume = data.videoVolume;
                let videoStarttime = data.videoStarttime || 0;
                const loop = data.loop;

                const token = encodeURIComponent(data.resourceToken);
                const filepathNew = `http://${window.location.hostname}:7472/resource/${token}`;

                // Generate UUID to use as id
                // @ts-ignore
                const uuid = uuidv4();
                const videoPlayerId = `${uuid}-video`;

                const enterAnimation = data.enterAnimation ? data.enterAnimation : "fadeIn";
                const exitAnimation = data.exitAnimation ? data.exitAnimation : "fadeIn";
                const enterDuration = data.enterDuration;
                const exitDuration = data.exitDuration;

                const inbetweenAnimation = data.inbetweenAnimation ? data.inbetweenAnimation : "none";
                const inbetweenDuration = data.inbetweenDuration;
                const inbetweenDelay = data.inbetweenDelay;
                const inbetweenRepeat = data.inbetweenRepeat;

                const positionData = {
                    position: data.videoPosition,
                    customCoords: data.customCoords
                };

                const sizeStyles =
                    (data.videoWidth ? `width: ${data.videoWidth}px;` : "") +
                    (data.videoHeight ? `height: ${data.videoHeight}px;` : "");

                const loopAttribute = loop ? "loop" : "";

                const videoElement = `
                    <video id="${videoPlayerId}" class="player" ${loopAttribute} style="display:none;${sizeStyles}">
                        <source src="${filepathNew}" type="video/${fileExt}">
                    </video>
                `;

                // @ts-ignore
                const wrapperId = uuidv4();
                // @ts-ignore
                const wrappedHtml = getPositionWrappedHTML(wrapperId, positionData, videoElement);

                // @ts-ignore
                $(".wrapper").append(wrappedHtml);

                // Adjust volume
                if (isNaN(videoVolume)) {
                    videoVolume = 5;
                }

                videoVolume = parseInt(videoVolume) / 10;
                // @ts-ignore
                $(`#${videoPlayerId}`).prop("volume", videoVolume);

                const video = document.getElementById(videoPlayerId);
                video.oncanplay = function () {
                    // @ts-ignore
                    if (startedVidCache[this.id]) {
                        return;
                    }

                    // @ts-ignore
                    startedVidCache[this.id] = true;

                    try {
                        // @ts-ignore
                        video.play();
                    } catch (err) {
                        console.log(err);
                    }
                    // @ts-ignore
                    const videoEl = $(`#${videoPlayerId}`);
                    videoEl.show();

                    // @ts-ignore
                    $(`#${wrapperId}`)
                        .find(".inner-position")
                        .animateCss(enterAnimation, enterDuration, null, null, () => {
                            // @ts-ignore
                            $(`#${wrapperId}`)
                                .find(".inner-position")
                                .animateCss(inbetweenAnimation, inbetweenDuration, inbetweenDelay, inbetweenRepeat);
                        });

                    const exitVideo = () => {
                        // @ts-ignore
                        delete startedVidCache[this.id];
                        animateVideoExit(`#${wrapperId}`, exitAnimation, exitDuration, inbetweenAnimation);
                    };

                    // Remove div after X time.
                    if (videoDuration) {
                        setTimeout(function () {
                            exitVideo();
                        }, videoDuration);
                    } else {
                        video.onended = function () {
                            exitVideo();
                        };

                        // @ts-ignore
                        $(`#${videoPlayerId}`).on("error", function () {
                            exitVideo();
                        });
                    }
                };
            }
        }
    }
}

export default effect;
