# yt-frame-timer

A browser-based tool for calculating the duration between two points in a video.

## Usage
- Open `index.html` in a modern browser.
- Under **Local Video**, select a video file from your device. The file is played locally using the HTML5 video player, without being uploaded to a server.
- Enter the video's FPS, then use **Previous Frame** / **Next Frame** to move one frame at a time.
- Click **Set Start Here** and **Set End Here** at the desired positions, then click **Calculate Duration**.
- You can also enter the timestamps directly in seconds, including decimal values.

Note: Depending on the codec and browser, the browser may not always allow perfectly accurate seeking to individual frames. The frame step depends on the entered FPS. An `iframe` is not suitable for directly playing a local video file; the HTML5 video player handles playback of files selected from the device.

The original project was designed to retime YouTube videos for speedrun verification.

# yt-frame-timer-local-video
