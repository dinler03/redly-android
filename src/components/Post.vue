<template>
    <div v-if="!post" class="d-flex justify-content-center align-items-center cover-all position-absolute">
        <div class="d-flex circle md-background p-2">
            <div class="spinner-border text-4" role="status"></div>
        </div>
    </div>
    <div v-else>
        <FullPost :post="post" />
        <div class="d-flex dpx-16">
            <span class="title-small text-4">{{ t('comments') }}</span>
        </div>
        <div class="list-container dpy-16">
            <div v-for="comment in comments">
                <div v-show="comment.kind == 't1'" class="list-item-full list-item-divider dpx-16">
                    <div v-show="comment.depth" class="comment-depth-container">
                        <div class="comment-depth" v-for="_ in comment.depth">
                            <div class="comment-depth-line"></div>
                        </div>
                    </div>
                    <div class="comment-body">
                        <div class="d-flex align-items-center dpb-4">
                            <div class="list-item-leading-icon ps-0 dpe-8">
                                <span class="material-icons">{{ comment.author == 'AutoModerator' ? 'local_police' : 'face'
                                }}</span>
                            </div>
                            <span class="label-small text-10" @click.passive="open_user(comment.author)">{{
                                comment.author }}</span>
                        </div>
                        <span class="body-medium" v-html="markdown(comment.body)" @click="handle_link_click($event)"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount, onActivated, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import FullPost from './FullPost.vue';
import { Redly } from "/js/redly.js";
import { t } from '/js/i18n.js';
import { processCommentMedia } from '/js/media.js';

const router = useRouter();
const redly = new Redly();

const post = ref(null);
const comments = ref([]);
const view = ref(document.querySelector('.content-view'));

async function setup() {
    let response = await redly.getSubmissionComments(router.currentRoute.value.params.id);
    if (!response) return;

    // Get all replies for all comments in the post with Promise all as a single array
    Promise.all(response.comments.map(async (comment) => {
        return await get_all_replies(comment);
    }))
        .then(replies => {
            comments.value = replies.flat();
        })

    post.value = response.submission;
    await nextTick();
}

function decodeHtml(html) {
    let txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function markdown(body) {
    return processCommentMedia(decodeHtml(body));
}

async function open_user(author) {
    router.push(`/u/${author}`);
}

function handle_link_click(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Check for /r/ and /u/ relative links
    if (href.startsWith('/r/') || href.startsWith('/u/') || href.startsWith('/user/')) {
        event.preventDefault();
        event.stopPropagation();
        const path = href.startsWith('/user/') ? href.replace('/user/', '/u/') : href;
        router.push(path);
        return;
    }

    // Check for preview.redd.it links — open as in-app image preview
    const previewMatch = href.match(/^https?:\/\/preview\.redd\.it\/([^?]+)/);
    if (previewMatch) {
        event.preventDefault();
        event.stopPropagation();
        const parts = previewMatch[1].split('.');
        if (parts.length >= 2) {
            router.push(`/preview/${parts[0]}/${parts[1]}`);
        }
        return;
    }

    // Check for i.redd.it links — open as in-app image preview
    const iRedditMatch = href.match(/^https?:\/\/i\.redd\.it\/([^?]+)/);
    if (iRedditMatch) {
        event.preventDefault();
        event.stopPropagation();
        const parts = iRedditMatch[1].split('.');
        if (parts.length >= 2) {
            router.push(`/preview/${parts[0]}/${parts[1]}`);
        }
        return;
    }

    // Check for full Reddit URLs
    const fullUrlMatch = href.match(/^https?:\/\/(www\.|old\.|new\.)?reddit\.com(\/.*)/);
    if (fullUrlMatch) {
        event.preventDefault();
        event.stopPropagation();
        let path = fullUrlMatch[2];
        const commentsMatch = path.match(/\/(?:r\/[^\/]+\/)?comments\/([^\/]+)/);
        if (commentsMatch) {
            router.push(`/post/${commentsMatch[1]}`);
            return;
        }
        path = path.replace(/^\/user\//, '/u/');
        router.push(path);
        return;
    }
}

async function get_all_replies(comment, depth = 0) {
    let replies = [];
    if (comment.kind == "more") {
        replies.push({
            kind: "more",
            children: comment.data.children,
        })
        return replies;
    }

    replies.push({
        kind: "t1",
        author: comment.data.author,
        body: comment.data.body_html,
        depth: depth,
    })

    if (!comment.data.replies) return replies;
    comment.data.replies.data.children.map(async (reply) => {
        replies.push(...await get_all_replies(reply, depth + 1));
    })
    return replies;
}

onBeforeMount(() => {
    if (!router.currentRoute.value.params.id) {
        router.back();
        return;
    }

    setup();

    // Scroll to top
    view.value.scroll({
        top: 0
    })
})

onActivated(() => {
    // Scroll to the last position
    let pages = JSON.parse(localStorage.getItem("pages"));
    let this_page = pages.find(page => page.path == window.location.pathname);
    if (this_page) {
        view.value.scrollTop = parseInt(this_page.scroll);
    }
})
</script>