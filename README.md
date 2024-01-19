# Firebot Better Random Video Custom Script

## A custom script that adds an improved `Play Random Video` effect with proper folder randomness and effect output support

### How to install
1. Go to the [releases](https://github.com/Lordmau5/firebot-script-better-random-video/releases/) tab and download the latest `better-random-video.js`
2. Open Firebot and head to Settings -> Scripts -> Manage Startup Scripts
3. Click `Add New Script`
4. Click on the `scripts folder` link in the popup and place the `better-random-video.js` inside
5. Click the blue reload button next to the `Pick one` dropdown to refresh the available scripts
6. Select `better-random-video.js` in the dropdown
7. Click `Save` - You might have to restart Firebot for the script to load.

### How to use
This script works similarly to the integrated `Play Video` effect.

However, it keeps track of which videos in a folder it already played and will make sure that every video plays at least once.  
Once no videos are left, it will clear the list and start over.

Additionally, this effect has effect outputs.  
For now, it only has `$effectOutput[videoLength]` to get the length of the played video and use it in another effect, such as `Show Text`.

An added bonus is that it also supports a single video file so you can use the effect outputs for that, too.