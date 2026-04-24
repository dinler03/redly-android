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
        <video
            v-else
            :src="videoUrl"
            :poster="posterUrl || undefined"
            controls
            loop
            playsinline
            style="width: 100%; display: block; aspect-ratio: 16/9; background: #000;"
            class="md-rounded-12"
        ></video>
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

// Decode HTML entities using a textarea element (browser-native approach)
function decodeHtmlEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

onMounted(async function load() {
    const gifId = extractRedgifsId(props.data.url || props.data.url_overridden_by_dest || '');

    if (!gifId) {
        error.value = 'Invalid Redgifs URL';
        loading.value = false;
        return;
    }

    try {
        const urls = await fetchRedgifsUrls(gifId);
        videoUrl.value = urls.hd || urls.sd;
        posterUrl.value = urls.poster || urls.thumbnail || null;
    } catch (e) {
        // Try Reddit-provided fallback video URLs before showing an error
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
    } finally {
        loading.value = false;
    }
});
</script>
