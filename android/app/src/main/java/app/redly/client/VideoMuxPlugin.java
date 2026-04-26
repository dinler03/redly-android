package app.redly.client;

import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;

/**
 * VideoMuxPlugin — downloads a video-only MP4 and an audio-only MP4 from
 * Reddit's CDN and combines them into a single muxed .mp4 using Android's
 * built-in MediaMuxer. No third-party dependencies required.
 *
 * Called from FullVideo.vue when the user taps the download button.
 */
@CapacitorPlugin(name = "VideoMux")
public class VideoMuxPlugin extends Plugin {

    private static final int CONNECT_TIMEOUT_MS = 15_000;
    private static final int READ_TIMEOUT_MS    = 60_000;
    private static final int BUF_SIZE           = 64 * 1024; // 64 KB

    /**
     * muxAndSave({ videoUrl, audioCandidates[], outputPath })
     *
     * Tries each URL in audioCandidates in order. Uses the first one that
     * returns HTTP 200. If none succeed the video is saved without audio
     * (same behaviour as before this plugin existed).
     */
    @PluginMethod
    public void muxAndSave(PluginCall call) {
        final String videoUrl   = call.getString("videoUrl");
        final String rawOutput  = call.getString("outputPath");

        if (videoUrl == null || rawOutput == null) {
            call.reject("videoUrl and outputPath are required");
            return;
        }

        // Filesystem.getUri() returns a "file:///..." URI; MediaMuxer needs
        // a plain file-system path.  Strip the scheme if present.
        final String outputPath = rawOutput.startsWith("file://")
                ? android.net.Uri.parse(rawOutput).getPath()
                : rawOutput;

        // audioCandidates is a JSON array of strings
        final com.getcapacitor.JSArray rawCandidates = call.getArray("audioCandidates");
        final String[] audioCandidates;
        if (rawCandidates != null && rawCandidates.length() > 0) {
            String[] tmp = new String[rawCandidates.length()];
            for (int i = 0; i < rawCandidates.length(); i++) {
                try { tmp[i] = rawCandidates.getString(i); } catch (Exception e) { tmp[i] = null; }
            }
            audioCandidates = tmp;
        } else {
            audioCandidates = new String[0];
        }

        new Thread(() -> {
            try {
                // Ensure output directory exists
                new File(outputPath).getParentFile().mkdirs();

                // Download video track to a temp file
                File videoTemp = downloadToTemp(videoUrl, "redly_v");
                if (videoTemp == null) {
                    call.reject("Failed to download video");
                    return;
                }

                // Try each audio candidate until one succeeds
                File audioTemp = null;
                for (String candidate : audioCandidates) {
                    if (candidate == null) continue;
                    File f = downloadToTemp(candidate, "redly_a");
                    if (f != null) {
                        audioTemp = f;
                        break;
                    }
                }

                boolean muxed = false;
                if (audioTemp != null) {
                    try {
                        mux(videoTemp.getAbsolutePath(),
                            audioTemp.getAbsolutePath(),
                            outputPath);
                        muxed = true;
                    } catch (Exception e) {
                        // Mux failed (e.g. incompatible codec container) —
                        // fall through to video-only copy.
                    } finally {
                        audioTemp.delete();
                    }
                }

                if (!muxed) {
                    // Fall back: copy video-only file as-is
                    copyFile(videoTemp, new File(outputPath));
                }

                videoTemp.delete();

                JSObject result = new JSObject();
                result.put("path", outputPath);
                result.put("hasAudio", muxed);
                call.resolve(result);

            } catch (Exception e) {
                call.reject("VideoMux error: " + e.getMessage());
            }
        }).start();
    }

    // -------------------------------------------------------------------------

    /** Download url to a temp file in the app cache dir. Returns null on error. */
    private File downloadToTemp(String urlStr, String prefix) {
        try {
            File temp = File.createTempFile(
                prefix + "_" + System.currentTimeMillis(), ".mp4",
                getContext().getCacheDir()
            );
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setRequestProperty("User-Agent", "redly-android/0.1");
            conn.connect();

            if (conn.getResponseCode() / 100 != 2) {
                conn.disconnect();
                temp.delete();
                return null;
            }

            try (InputStream in = conn.getInputStream();
                 FileOutputStream out = new FileOutputStream(temp)) {
                byte[] buf = new byte[BUF_SIZE];
                int n;
                while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            }
            conn.disconnect();
            return temp;
        } catch (Exception e) {
            return null;
        }
    }

    /** Mux a video-only MP4 and an audio-only MP4 into outputPath using MediaMuxer. */
    private void mux(String videoPath, String audioPath, String outputPath) throws Exception {
        MediaExtractor videoEx = new MediaExtractor();
        MediaExtractor audioEx = new MediaExtractor();
        MediaMuxer muxer = null;

        try {
            videoEx.setDataSource(videoPath);
            audioEx.setDataSource(audioPath);

            int srcVideoTrack = findTrack(videoEx, "video/");
            int srcAudioTrack = findTrack(audioEx, "audio/");

            if (srcVideoTrack < 0) throw new Exception("No video track in source");
            if (srcAudioTrack < 0) throw new Exception("No audio track in source");

            muxer = new MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);

            videoEx.selectTrack(srcVideoTrack);
            audioEx.selectTrack(srcAudioTrack);

            int dstVideoTrack = muxer.addTrack(videoEx.getTrackFormat(srcVideoTrack));
            int dstAudioTrack = muxer.addTrack(audioEx.getTrackFormat(srcAudioTrack));
            muxer.start();

            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            ByteBuffer buf = ByteBuffer.allocate(1024 * 1024); // 1 MB

            // Write all video samples
            while (true) {
                buf.clear();
                int size = videoEx.readSampleData(buf, 0);
                if (size < 0) break;
                info.offset = 0;
                info.size   = size;
                info.presentationTimeUs = videoEx.getSampleTime();
                info.flags  = videoEx.getSampleFlags();
                muxer.writeSampleData(dstVideoTrack, buf, info);
                videoEx.advance();
            }

            // Write all audio samples
            while (true) {
                buf.clear();
                int size = audioEx.readSampleData(buf, 0);
                if (size < 0) break;
                info.offset = 0;
                info.size   = size;
                info.presentationTimeUs = audioEx.getSampleTime();
                info.flags  = audioEx.getSampleFlags();
                muxer.writeSampleData(dstAudioTrack, buf, info);
                audioEx.advance();
            }

            muxer.stop();
        } finally {
            try { if (muxer != null) muxer.release(); } catch (Exception ignored) {}
            videoEx.release();
            audioEx.release();
        }
    }

    /** Returns the first track index whose MIME type starts with mimePrefix, or -1. */
    private int findTrack(MediaExtractor ex, String mimePrefix) {
        for (int i = 0; i < ex.getTrackCount(); i++) {
            String mime = ex.getTrackFormat(i).getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith(mimePrefix)) return i;
        }
        return -1;
    }

    /** Copies src to dst byte-by-byte (fallback when mux is unavailable). */
    private void copyFile(File src, File dst) throws Exception {
        try (java.io.FileInputStream in  = new java.io.FileInputStream(src);
             FileOutputStream       out = new FileOutputStream(dst)) {
            byte[] buf = new byte[BUF_SIZE];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        }
    }
}
