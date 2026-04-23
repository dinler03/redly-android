<template>
    <div ref="wrapper" class="video-wrapper" :class="{ 'video-fullscreen': is_fullscreen }">
        <video ref="video" class="position-relative" :poster="get_poster()" muted loop playsinline webkit-playsinline
            preload="metadata" @touchend.prevent="controls_visible = !controls_visible" @scroll.stop="">
        </video>
        <div v-if="paused" class="video-paused">
            <div class="md-icon-button md-foreground-50 el-3" @click.passive="play">
                <span class="material-icons">play_arrow</span>
            </div>
        </div>
        <div>
            <div class="video-controls d-flex flex-column flex-fill" :class="{ 'visually-hidden': !controls_visible }">
                <div class="video-play">
                    <div class="md-icon-button md-foreground-50 el-3" @click.passive="playback">
                        <span class="material-icons">{{ paused ? 'play_arrow' : 'pause' }}</span>
                    </div>
                </div>
                <div class="video-mute">
                    <div class="md-icon-button md-foreground-50 el-3" v-show="has_audio" @click.passive="mute">
                        <span class="material-icons">{{ muted ? 'volume_off' : 'volume_up' }}</span>
                    </div>
                </div>
                <div class="video-download">
                    <div class="md-icon-button md-foreground-50 el-3" @click.passive="download">
                        <span v-if="downloading" class="material-icons">hourglass_top</span>
                        <span v-else class="material-icons">download</span>
                    </div>
                </div>
                <div class="d-flex flex-column px-3 pb-5 position-relative" @touchstart.passive="progress_start"
                    @touchmove.passive="progress_move" @touchend.passive="progress_end">
                    <div ref="progress" class="video-progress position-relative">
                        <span class="label-large video-currentime">{{ currentTime }}</span>
                        <span class="label-large video-duration">{{ duration }}</span>
                        <div class="d-flex h-100 position-absolute bg-11" :style="{ 'width': `${progress_left}px` }">
                        </div>
                        <div class="video-progress-now position-relative theme-shadow"
                            :style="{ 'transform': `translateX(${progress_left}px)`, 'transition': transition }">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onBeforeMount, onMounted, onDeactivated } from 'vue';
import Hls from 'hls.js';
import { useIntersectionObserver } from '@vueuse/core'
import { CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { t } from '/js/i18n.js';
import { ensure_storage_permission } from '/js/util.js';

let hls = null;
const video = ref(null);
const wrapper = ref(null);
const remaining = ref(null);
const play_promise = ref(null);
const duration = ref(null);
const currentTime = ref('0:00');
const progress = ref(null);
const transition = ref(null);
const progress_left = ref(0);
const progress_width = ref(0);

const paused = ref(true);
const muted = ref(true);
const has_audio = ref(false);
const is_fullscreen = ref(false);
const controls_visible = ref(true);
const downloading = ref(false);
const portrait = window.matchMedia("(orientation: portrait)")

const dimensions = ref({
    width: 0,
    height: 0
});

const emit = defineEmits('open_post');
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})

async function mute() {
    video.value.muted = !video.value.muted;
}

async function download() {
    if (downloading.value) return;
    const fallback_url = props.data.secure_media?.reddit_video?.fallback_url;
    if (!fallback_url) {
        Toast.show({ text: t('video_url_missing'), duration: 'short' });
        return;
    }
    if (!(await ensure_storage_permission(Filesystem, Toast))) return;
    downloading.value = true;
    Toast.show({ text: t('downloading'), duration: 'short' });
    const fname = `${Date.now()}_${props.data.id}.mp4`;
    const response = await CapacitorHttp.request({
        url: fallback_url,
        method: 'GET',
        responseType: 'blob'
    }).catch(() => null);
    if (!response || response.status >= 400 || !response.data) {
        Toast.show({ text: t('download_failed'), duration: 'short' });
        downloading.value = false;
        return;
    }
    try {
        await Filesystem.writeFile({
            path: `Movies/Redly/${fname}`,
            data: response.data,
            directory: Directory.ExternalStorage,
            recursive: true
        });
        Toast.show({ text: t('video_saved').replace('{name}', fname), duration: 'short' });
    } catch (e) {
        Toast.show({ text: t('save_failed'), duration: 'short' });
        console.error(e);
    }
    downloading.value = false;
}

async function play() {
    if (!video.value || play_promise.value) return

    try {
        play_promise.value = video.value.play();
        await play_promise.value;
    } catch (err) {
        console.warn('video play failed', err);
    } finally {
        play_promise.value = null;
    }
}

async function playback() {
    if (video.value.paused) {
        await play();
    } else {
        video.value.pause();
    }
}

async function reset() {
    // Ignore if video has
    if (!video.value || video.value.paused || play_promise.value) {
        return
    }

    video.value.pause();
    video.value.muted = true;
    video.value.currentTime = 0;
}

function get_poster() {
    if (props.data.preview) {
        return props.data.preview.images[0].source.url.replaceAll("&amp;", "&")
    }
    return null;
}

async function progress_start() {
    video.value.pause();
    // disable scrolling
    document.querySelector('.content-view').style.overflowY = 'hidden';
}

async function progress_move(event) {
    let x = event.touches[0].clientX - 23;
    if (x < 0) x = 0;
    if (x >= progress_width.value) x = progress_width.value;
    progress_left.value = x;
    update_current_time(x)
}

async function progress_end(event) {
    let x = event.changedTouches[0].clientX - 23;
    update_current_time(x).then(async () => {
        await video.value.play();
    })
    // enable scrolling
    document.querySelector('.content-view').style.overflowY = 'scroll';
}

async function update_current_time(x) {
    video.value.currentTime = x / progress_width.value * video.value.duration;
}

async function setup() {
    // Set video data
    if (!props.data.secure_media) {
        return
    }

    dimensions.value = {
        width: props.data.secure_media.reddit_video.width,
        height: props.data.secure_media.reddit_video.height
    }

    const reddit_video = props.data.secure_media.reddit_video;
    const hls_url = reddit_video.hls_url;
    const fallback_url = reddit_video.fallback_url;

    // Load video — prefer HLS via hls.js, fall back to native HLS, then to MP4
    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(hls_url);
        hls.attachMedia(video.value);
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            console.warn('HLS fatal error, falling back to mp4', data);
            try { hls.destroy(); } catch (e) { /* noop */ }
            hls = null;
            if (fallback_url) {
                video.value.src = fallback_url;
                video.value.load();
            }
        });
    } else if (video.value.canPlayType('application/vnd.apple.mpegurl')) {
        video.value.src = hls_url;
    } else if (fallback_url) {
        video.value.src = fallback_url;
    }

    // Event for loaded
    video.value.onloadeddata = () => {
        duration.value = format_time(video.value.duration);
        has_audio.value = video.value.mozHasAudio ||
            Boolean(video.value.webkitAudioDecodedByteCount) ||
            Boolean(video.value.audioTracks && video.value.audioTracks.length);
    }

    // Events for mute
    video.value.onvolumechange = () => {
        muted.value = video.value.muted;
    }

    // Events for progress
    video.value.ontimeupdate = () => {
        remaining.value = format_time(video.value.duration - video.value.currentTime);
        currentTime.value = format_time(video.value.currentTime);
        progress_left.value = video.value.currentTime / video.value.duration * progress_width.value;
    }

    video.value.onpause = () => {
        paused.value = true;
        transition.value = null;
    }

    video.value.onplay = () => {
        paused.value = false;
        transition.value = 'transform 250ms linear';
    }

    portrait.onchange = () => {
        progress_width.value = window.innerWidth - 32;
        // landscape mode
        if (window.innerWidth > window.innerHeight) {
            is_fullscreen.value = true;
            return
        }
        is_fullscreen.value = false
    }

    progress_width.value = window.innerWidth - 32;
}

function format_time(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// setup
onMounted(() => {
    setup();
})

onBeforeMount(() => {
    useIntersectionObserver(video, ([{ isIntersecting }]) => {
        if (isIntersecting && document.body.getAttribute('autoplay') == 'true') {
            play();
            return
        }

        reset();
    }, {
        threshold: 0.5
    })
})

onBeforeUnmount(() => {
    if (hls) hls.destroy()
})

onDeactivated(() => {
    reset();
})
</script>