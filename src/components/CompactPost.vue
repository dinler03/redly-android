<template>
    <div v-if="post.over_18 && store.nsfw_filter === 'hide'" class="d-none"></div>
    <div v-else class="card-container space-between-16 position-relative" @click.passive="handle_touch">
        <div class="card-header position-relative" :class="{ 'sticky': post.stickied }">
            <div class="d-flex flex-wrap align-items-center text-4">
                <span class="label-medium text-11 ct" @click.passive="open_subreddit">r/{{ post.subreddit
                }}</span>
                <span class="label-medium dmx-4">-</span>
                <span class="label-medium">{{ post.domain }}</span>
                <span class="label-medium dmx-4">-</span>
                <span class="label-medium">{{ format_date() }}</span>
            </div>
            <span class="text-6 dpy-4" :class="store.title_size, { 'text-truncate': store.hidden.includes(post.id) }">{{
                post.title }}</span>
            <div class="d-flex align-items-center">
                <span class="label-medium text-10 ct" @click.passive="open_user">u/{{ post.author }}</span>
            </div>
        </div>
        <div v-if="store.load_media" class="card-content position-relative">
            <div :hidden="store.hidden.includes(post.id)">
                <div v-if="post.over_18 && store.nsfw_filter === 'blur'" class="nsfw-blur-container position-relative">
                    <div class="nsfw-blur-overlay" @click.passive="toggle_nsfw_reveal">
                        <span class="material-icons">18_up_rating</span>
                        <span class="label-large">{{ t('nsfw_tap') }}</span>
                    </div>
                    <div :class="{ 'nsfw-blurred': !nsfw_revealed }">
                        <component :is="types[type]" :data="post" @open_post="open_post" />
                    </div>
                </div>
                <component v-else :is="types[type]" :data="post" @open_post="open_post" />
            </div>
        </div>
        <div class="card-details position-relative">
            <div v-if="post.over_18" class="d-flex dpb-16">
                <div class="chips-container bg-11 border-0">
                    <span class=" material-icons">18_up_rating</span>
                    <span class="label-large">{{ t('nsfw') }}</span>
                </div>
            </div>
            <div class="d-flex align-items-center">
                <div class="md-icon-container-with-label">
                    <span class="material-icons">arrow_upward</span>
                    <span class="label-large">{{ format_num(post.score) }}</span>
                </div>
                <div class="md-icon-container-with-label">
                    <span class="material-icons">chat</span>
                    <span class="label-large">{{ format_num(post.num_comments) }}</span>
                </div>
                <div class="md-icon-container-with-label ct" @click.passive="share">
                    <span class="material-icons ct">share</span>
                    <span class="label-large ct">{{ t('share') }}</span>
                </div>
                <div class="md-icon-container-with-label ct" @click.passive="save_toggle">
                    <span class="material-icons ct">{{ is_saved(post.id) ? 'bookmark' : 'bookmark_border' }}</span>
                    <span class="label-large ct">{{ is_saved(post.id) ? t('saved') : t('save') }}</span>
                </div>
                <div class="md-icon-container-with-label ct" @click.passive="hide_post">
                    <span class="material-icons ct">hide_source</span>
                    <span class="label-large ct">{{ t('hide') }}</span>
                </div>
                <div class="md-icon-container-with-label ct" @click.passive="open_post">
                    <span class="material-icons ct">open_in_new</span>
                    <span class="label-large ct">{{ t('open') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { store, hide, unhide, save_post, unsave_post, is_saved } from '/js/store.js';
import { t } from '/js/i18n.js';
import { useRouter } from 'vue-router';
import { Share } from '@capacitor/share';
import { format_relative_time } from '/js/util.js';
import Placeholder from '/contents/Placeholder.vue';
import CompactText from '/contents/CompactText.vue';
import CompactImage from '/contents/CompactImage.vue';
import CompactVideo from '/contents/CompactVideo.vue';
import CompactEmbed from '/contents/CompactEmbed.vue';
import CompactLink from '/contents/CompactLink.vue';
import CompactGallery from '/contents/CompactGallery.vue';
import CompactFallback from '../contents/CompactFallback.vue';
import YouTubeEmbed from '/contents/YouTubeEmbed.vue';
import RedgifsVideo from '/contents/RedgifsVideo.vue';

const router = useRouter();

const type = ref(null);
const nsfw_revealed = ref(false);
const types = {
    Placeholder,
    CompactText,
    CompactImage,
    CompactVideo,
    CompactEmbed,
    CompactLink,
    CompactGallery,
    CompactFallback,
    YouTubeEmbed,
    RedgifsVideo
}

const props = defineProps({
    post: {
        type: Object,
        required: true
    }
})

async function handle_touch(event) {
    if (event.target.classList.contains('ct')) return
    open_post()
}

async function toggle_nsfw_reveal() {
    nsfw_revealed.value = !nsfw_revealed.value;
}

async function share() {
    let redditDomain = JSON.parse(localStorage.getItem("share_old_reddit")) ? "https://old.reddit.com" : "https://www.reddit.com";
    await Share.share({
        url: redditDomain + props.post.permalink,
    });
}

async function save_toggle() {
    if (is_saved(props.post.id)) {
        unsave_post(props.post.id);
    } else {
        save_post(props.post);
    }
}

async function hide_post() {
    if (!store.hidden.includes(props.post.id)) {
        hide(props.post.id)
        return
    }
    unhide(props.post.id)
}

async function open_post() {
    router.push(`/post/${props.post.id}`);
}

async function open_user() {
    router.push(`/u/${props.post.author}`);
}

async function open_subreddit() {
    router.push(`/r/${props.post.subreddit}`);
}

// Return when the post was created (localised via i18n)
function format_date() {
    return format_relative_time(props.post.created);
}

function format_num(points) {
    if (points > 1000000) return (points / 1000000).toFixed(1) + "M";
    if (points > 1000) return (points / 1000).toFixed(1) + "K";
    return points;
}

async function get_type() {
    // video
    if (props.post.domain == "v.redd.it") {
        type.value = "CompactVideo";
        return
    }

    // image
    if (props.post.domain == "i.redd.it") {
        type.value = "CompactImage";
        return
    }

    // YouTube embed
    const postUrl = props.post.url || props.post.url_overridden_by_dest || '';
    if (
        props.post.domain === 'youtube.com' ||
        props.post.domain === 'youtu.be' ||
        props.post.domain === 'm.youtube.com' ||
        props.post.domain === 'www.youtube.com' ||
        postUrl.includes('youtube.com/watch') ||
        postUrl.includes('youtu.be/')
    ) {
        type.value = 'YouTubeEmbed';
        return;
    }

    // Redgifs embed
    if (
        props.post.domain === 'redgifs.com' ||
        props.post.domain === 'www.redgifs.com' ||
        postUrl.includes('redgifs.com/watch')
    ) {
        type.value = 'RedgifsVideo';
        return;
    }

    // embed
    if (props.post.media) {
        type.value = "CompactEmbed";
        return
    }

    // text
    if (props.post.is_self) {
        type.value = "CompactText";
        return
    }

    // Consider post hint
    if (props.post.post_hint == 'image') {
        type.value = "CompactImage";
        return
    }

    if (props.post.post_hint == 'link') {
        type.value = "CompactLink";
        return
    }

    if (props.post.url_overridden_by_dest?.startsWith('https://www.reddit.com/gallery/')) {
        type.value = "CompactGallery";
        return
    }
    type.value = "CompactFallback";
}

// onBeforeMount replacement
get_type();
</script>
