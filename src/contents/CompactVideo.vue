<template>
    <div class="d-flex cover-50 position-relative md-rounded-12 md-background"
        :style="{ 'aspect-ratio': dimensions.width + '/' + dimensions.height + '!important' }">
        <div ref="wrapper" class="video-wrapper">
            <video ref="video" class="position-relative ct" :poster="get_poster()" muted loop playsinline
                webkit-playsinline preload="metadata" @click.prevent="handle_video_click">
            </video>
            <div v-if="paused" class="video-paused">
                <div class="md-icon-button md-foreground-50 el-3 ct" @click.passive="play">
                    <span class="material-icons ct">play_arrow</span>
                </div>
            </div>
            <div v-show="is_fullscreen">
                <div class="video-controls d-flex flex-column flex-fill" :class="{ 'visually-hidden': !controls_visible }">
                    <div class="d-flex justify-content-between position-relative">
                        <div>
                            <button v-show="has_audio" class="btn btn-touch px-3 ct" @click.passive="mute">
                                <span class="text-shadow fs-5 text-4 bi ct"
                                    :class="{ 'bi-volume-mute-fill': muted, 'bi-volume-up-fill': !muted }"></span>
                            </button>
                        </div>
                        <div>
                            <button class="btn btn-touch px-3 ct" @click.passive="playback">
                                <span class="text-shadow fs-5 text-4 bi ct"
                                    :class="{ 'bi-play-fill': paused, 'bi-pause-fill': !paused }"></span>
                            </button>
                        </div>
                    </div>
                    <div class="d-flex flex-column px-3 pb-5 position-relative" @touchstart.passive="progress_start"
                        @touchmove.passive="progress_move" @touchend.passive="progress_end">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-shadow text-6 fw-bold">{{ currentTime }}</small>
                            <small class="text-shadow text-6 fw-bold">{{ duration }}</small>
                        </div>
                        <div ref="progress" class="video-progress position-relative">
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
        <div v-if="play_promise" class="d-flex justify-content-center align-items-center cover-all position-absolute">
            <div class="d-flex circle md-background p-2">
                <div class="spinner-border text-4" role="status"></div>
            </div>
        </div>
        <div class="md-icon-button md-foreground-50 position-absolute bottom-0 start-0 m-2 ct" v-show="has_audio"
            @click.passive="mute">
            <span class="material-icons ct">{{ muted ? 'volume_off' : 'volume_up' }}</span>
        </div>
        <div class="md-foreground-50 md-rounded-12 position-absolute bottom-0 end-0 m-2 px-2 py-1">
            <span class="label-large text-4">{{ remaining }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onBeforeMount, onMounted, onDeactivated } from 'vue';
import Hls from 'hls.js';
import { useIntersectionObserver } from '@vueuse/core'
import { create_click_debouncer } from '/js/util.js';

let hls = null;
const video = ref(null);
const hammer = ref(null);
const wrapper = ref(null);
const remaining = ref(null);
const play_promise = ref(null);
const duration = ref(null);
const currentTime = ref(null);
const progress = ref(null);
const transition = ref(null);
const progress_left = ref(0);
const progress_width = ref(0);

const paused = ref(true);
const muted = ref(true);
const has_audio = ref(false);
const is_fullscreen = ref(false);
const controls_visible = ref(true);
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

async function request_fullscreen() {
    const el = wrapper.value;
    if (!el) return;
    try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (video.value && video.value.webkitEnterFullscreen) {
            video.value.webkitEnterFullscreen();
        }
        if (video.value) {
            video.value.muted = false;
            await video.value.play().catch(() => {});
        }
    } catch (err) {
        console.warn('fullscreen request failed', err);
    }
}

// Single click → open post detail; double click → enter fullscreen
const handle_video_click = create_click_debouncer(
    () => emit('open_post'),
    () => request_fullscreen()
);

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
}

async function progress_move(event) {
    let x = event.touches[0].clientX - 23;
    if (x < 0) x = 0;
    if (x > progress_width.value) x = progress_width.value;
    progress_left.value = x;
    update_current_time(x)
}

async function progress_end(event) {
    let x = event.changedTouches[0].clientX - 23;
    update_current_time(x).then(async () => {
        await video.value.play();
    })
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

    wrapper.value.onfullscreenchange = () => {
        if (document.fullscreenElement) {
            is_fullscreen.value = true;
            progress_width.value = window.innerWidth - 32;
            // Add event listener for orientation change
            portrait.onchange = () => {
                progress_width.value = window.innerWidth - 32;
            }
            return
        }

        video.value.muted = true;
        is_fullscreen.value = false;
        // Remove event listener for orientation change
        portrait.onchange = null;
    }
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