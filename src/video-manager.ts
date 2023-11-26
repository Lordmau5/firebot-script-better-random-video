import {ScriptModules} from "@crowbartools/firebot-custom-scripts-types";
import {JsonDB} from "node-json-db";
import Video from "./@types/Video";

class VideoManager {
    private _db: JsonDB;
    private _modules: ScriptModules;

    constructor(path: string, modules: ScriptModules) {
        this._modules = modules;
        // @ts-ignore
        // filePath, saveOnPush, humanReadable
        this._db = new modules.JsonDb(path, true, true);

        // Clear played videos for effect ID
        modules.frontendCommunicator.on(
            'play-video-plus-plus:clear-videos-played',
            args => {
                const effect_id = args as any as string;

                this.setAllVideosUnplayed(effect_id);
            }
        );

        // Request played video count
        modules.frontendCommunicator.onAsync(
            'play-video-plus-plus:request-played-video-count',
            async args => {
                const effect_id = args as any as string;

                const videos: Video[] = this.getCopy(this.getVideos(effect_id));
                const playedVideos = videos.filter(video => video.played);

                return {
                    played: playedVideos.length,
                    total: videos.length
                };
            }
        );
    }

    private getCopy(json_data: any): any {
        return JSON.parse(JSON.stringify(json_data));
    }

    private getVideos(effect_id: string): Video[] {
        let videos: Video[] = [];
        try {
            // Try to get the videos from the database
            videos = this._db.getData(`/videos/${effect_id}`);
        }
        catch(err) {
            // If there are no videos in the database, set the videos to an empty array
            this._db.push(`/videos/${effect_id}`, videos, true);
        }

        // Return the videos from the database
        return videos;
    }

    public setAllVideosUnplayed(effect_id: string): void {
        // Get all videos from the database
        const videos: Video[] = this.getCopy(this.getVideos(effect_id));

        // If there are no videos in the database, return
        if (!videos.length) {
            return;
        }

        // Set all videos to unplayed
        videos.forEach(video => video.played = false);

        // Update the videos in the database
        this._db.push(`/videos/${effect_id}`, videos, true);
    }

    public updateVideos(effect_id: string, videos: Video[]): void {
        // Get all videos from the database
        const dbVideos: Video[] = this.getCopy(this.getVideos(effect_id));

        // If there are no videos in the database, set the videos to the database and return
        if (!dbVideos.length) {
            this._modules.logger.debug(`No videos found for ${effect_id}, setting videos to the database.`);
            this._db.push(`/videos/${effect_id}`, videos, true);
            return;
        }

        // If there are videos in the database, check if the length is the same, if not, update the videos and return
        if (dbVideos.length !== videos.length) {
            this._modules.logger.debug(`Videos length mismatch for ${effect_id}, updating videos.`);
            this._db.push(`/videos/${effect_id}`, videos, true);
            return;
        }

        // If the length is the same, check if the videos are the same based on their name using .every
        // If not, update the videos
        if (!dbVideos.every((video, index) => video.path === videos[index].path)) {
            this._modules.logger.debug(`Videos mismatch for ${effect_id}, updating videos.`);
            this._db.push(`/videos/${effect_id}`, videos, true);
        }
    }

    public getUnplayedVideo(effect_id: string): Video {
        const videos: Video[] = this.getCopy(this.getVideos(effect_id));
        if (!videos.length) {
            return null;
        }

        // Get a random video from the videos array that isn't played
        let unplayedVideos = videos.filter(video => !video.played);
        this._modules.logger.debug(`Found ${unplayedVideos.length} unplayed videos for ${effect_id}.`);
        if (!unplayedVideos.length) {
            videos.forEach(video => video.played = false);
            
            unplayedVideos = videos;
        }

        // Get a random video from the unplayed videos
        const randomIndex = Math.floor(Math.random() * unplayedVideos.length);
        const randomVideo = unplayedVideos[randomIndex];

        // Set this video to played and update it in the database
        randomVideo.played = true;
        this._db.push(`/videos/${effect_id}`, videos, true);

        return randomVideo;
    }
}

export let videoManager: VideoManager;

export function createVideoManager(path: string, modules: ScriptModules) {
    if (videoManager != null) {
        return videoManager;
    }
    videoManager = new VideoManager(path, modules);
    return videoManager;
}