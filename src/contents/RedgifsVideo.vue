<template>
    <div class="redgifs-container position-relative md-background md-rounded-12">
        <!-- Loading spinner -->
        <div v-if="loading" class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
            <div class="spinner-border" role="status"></div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="d-flex flex-column justify-content-center align-items-center" style="min-height: 200px; gap: 8px;">
            <span class="material-icons block" style="font-size: 48px;">block</span>
            <span class="body-medium">{{ error }}</span>
            <span class="label-small text-4">Try using a VPN or check your connection.</span>
        </div>

        <!-- Video player -->
        <div v-else class="position-relative">
            <video
                ref="video"
                :src="videoUrl"
                :poster="posterUrl || undefined"
                controls
                loop
                playsinline
                webkit-playsinline
                preload="metadata"
                :style="videoStyle"
                class="md-rounded-12"
                @loadedmetadata="onLoaded"
                @volumechange="onVolumeChange"
            ></video>
            <!-- Manual unmute overlay — Android WebView's native video controls
                 don't always expose a mute button, and some videos start muted. -->
            <button
                v-if="muted && hasAudio"
                type="button"
                class="md-icon-button md-foreground-50 el-3 redgifs-unmute"
                @click.stop="toggleMute"
            >
                <span class="material-icons">volume_off</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { extractRedgifsId, fetchRedgifsUrls } from '/js/media.js';

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
});

const loading = ref(true);
const error = ref(null);
const videoUrl = ref(null);
const posterUrl = ref(null);
const video = ref(null);
const muted = ref(false);
const hasAudio = ref(true);
// Start with no aspect-ratio so the container doesn't reserve incorrect space
// before metadata loads. After loadedmetadata we set the real ratio.
const videoStyle = ref('width:100%;display:block;background:#000;object-fit:contain;');

// Decode HTML entities using a textarea element (browser-native approach)
function decodeHtmlEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

function onLoaded() {
    if (!video.value) return;
    // Force unmuted at full volume — some Android WebView builds default
    // freshly attached <video> elements to muted regardless of attributes.
    video.value.muted = false;
    video.value.volume = 1.0;
    muted.value = video.value.muted;
    // Detect audio track presence (vendor-prefixed APIs).
    hasAudio.value =
        video.value.mozHasAudio ||
        Boolean(video.value.webkitAudioDecodedByteCount) ||
        Boolean(video.value.audioTracks && video.value.audioTracks.length) ||
        true; // fall back to assuming audio exists; user can toggle off

    // Apply the video's real aspect ratio so the player never distorts the
    // image. object-fit:contain ensures fullscreen also letterboxes/pillarboxes
    // correctly without stretching.
    const w = video.value.videoWidth;
    const h = video.value.videoHeight;
    if (w && h) {
        videoStyle.value =
            `width:100%;display:block;background:#000;object-fit:contain;aspect-ratio:${w}/${h};`;
    }
}

function onVolumeChange() {
    if (!video.value) return;
    muted.value = video.value.muted;
}

function toggleMute() {
    if (!video.value) return;
    video.value.muted = !video.value.muted;
    if (!video.value.muted && video.value.paused) {
        video.value.play().catch(() => { /* user gesture required, ignore */ });
    }
}

onMounted(async function load() {
    const url = props.data.url || props.data.url_overridden_by_dest || '';
    const gifId = extractRedgifsId(url);

    if (!gifId) {
        error.value = 'Invalid Redgifs URL';
        loading.value = false;
        return;
    }

    try {
        const urls = await fetchRedgifsUrls(gifId);
        // Prefer HD (carries the audio track). Skip `sd` when it points at the
        // `-mobile.mp4` silent variant; only use sd as a last resort.
        const hd = urls.hd;
        const sd = urls.sd;
        if (hd) {
            videoUrl.value = hd;
        } else if (sd) {
            videoUrl.value = sd;
        } else {
            throw new Error('No playable Redgifs URL');
        }
        posterUrl.value = urls.poster || urls.thumbnail || null;
    } catch (e) {
        // Try Reddit-provided fallback video URLs before showing an error.
        // These come from Reddit's own CDN and are reachable when Redgifs's
        // primary domain is filtered.
        const fallbackUrl = props.data.preview?.reddit_video_preview?.fallback_url;
        if (fallbackUrl) {
            videoUrl.value = decodeHtmlEntities(fallbackUrl);
        } else {
            const mp4Url = props.data.preview?.images?.[0]?.variants?.mp4?.source?.url;
            if (mp4Url) {
                videoUrl.value = decodeHtmlEntities(mp4Url);
            } else {
                error.value = 'Redgifs is unavailable in your region.';
            }
        }
        // Use Reddit preview as poster too, if available
        const previewUrl = props.data.preview?.images?.[0]?.source?.url;
        if (previewUrl && !posterUrl.value) {
            posterUrl.value = decodeHtmlEntities(previewUrl);
        }
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.redgifs-unmute {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
}

/* When the <video> goes into native HTML5 fullscreen the inline
   `aspect-ratio: w/h` constraint we set after metadata-load fights with
   the fullscreen viewport, distorting the picture.  Reset the constraint
   in fullscreen and let object-fit:contain letterbox / pillarbox the
   content to the screen at its true ratio. */
video:fullscreen,
video:-webkit-full-screen {
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    aspect-ratio: auto !important;
    object-fit: contain !important;
    background: #000;
}
</style>
