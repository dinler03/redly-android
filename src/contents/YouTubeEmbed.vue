<template>
    <div class="youtube-embed-container position-relative">
        <iframe
            v-if="videoId !== null"
            :src="`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`"
            style="width: 100%; aspect-ratio: 16/9; border: none; display: block;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
        ></iframe>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { extractYouTubeId } from '/js/media.js';

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
});

// Compute the YouTube video ID from the post URL fields
const videoId = computed(() => {
    return extractYouTubeId(props.data.url || props.data.url_overridden_by_dest || '');
});
</script>
