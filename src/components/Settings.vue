<template>
    <div class="profile-container">
        <div class="profile-headline">
            <span class="title-large">{{ t('profile') }}</span>
        </div>
    </div>
    <div class="d-flex flex-column px-3">
        <div class="d-flex md-background dpb-16">
            <div class="chips-container" @click.passive="open_gallery">
                <span class=" material-icons">collections</span>
                <span class="label-large">{{ t('gallery') }}</span>
            </div>
            <div class="chips-container" @click.passive="open_saved">
                <span class="material-icons">bookmark</span>
                <span class="label-large">{{ t('saved') }}</span>
            </div>
        </div>
        <div class="divider"></div>
        <div class="list-container py-8">
            <div class="list-item dps-16">
                <span class="body-large">{{ t('autoplay') }}</span>
                <span class="list-item-trailing-icon">
                    <div class="switch" :state="autoplay ? 'on' : 'off'" @click.passive="change_autoplay">
                        <div class="switch-container">
                            <span class="material-icons"></span>
                        </div>
                    </div>
                </span>
            </div>
            <div class="list-item dps-16">
                <span class="body-large">{{ t('check_for_updates') }}</span>
                <span class="list-item-trailing-icon">
                    <div class="switch" :state="check_for_updates ? 'on' : 'off'" @click.passive="change_updates">
                        <div class="switch-container">
                            <span class="material-icons"></span>
                        </div>
                    </div>
                </span>
            </div>
            <div class="list-item dps-16">
                <span class="body-large">{{ t('in_app_browser') }}</span>
                <span class="list-item-trailing-icon">
                    <div class="switch" :state="in_app_browser ? 'on' : 'off'" @click.passive="change_browser">
                        <div class="switch-container">
                            <span class="material-icons"></span>
                        </div>
                    </div>
                </span>
            </div>
            <div class="list-item dps-16">
                <span class="body-large">{{ t('load_media') }}</span>
                <span class="list-item-trailing-icon">
                    <div class="switch" :state="load_media ? 'on' : 'off'" @click.passive="change_load_media">
                        <div class="switch-container">
                            <span class="material-icons"></span>
                        </div>
                    </div>
                </span>
            </div>
            <div class="list-item dps-16">
                <span class="body-large">{{ t('share_old_reddit') }}</span>
                <span class="list-item-trailing-icon">
                    <div class="switch" :state="share_old_reddit ? 'on' : 'off'" @click.passive="change_old_reddit">
                        <div class="switch-container">
                            <span class="material-icons"></span>
                        </div>
                    </div>
                </span>
            </div>
        </div>
        <div class="divider"></div>
        <div class="d-flex flex-column text-4 dpy-16">
            <span class="body-large">{{ t('language') }}</span>
            <div class="d-flex dpt-8">
                <div class="chips-container" :checked="language == 'tr'"
                    @click.passive="change_language('tr')">
                    <span class="material-icons"></span>
                    <span class="label-large">Türkçe</span>
                </div>
                <div class="chips-container" :checked="language == 'en'"
                    @click.passive="change_language('en')">
                    <span class="material-icons"></span>
                    <span class="label-large">English</span>
                </div>
            </div>
        </div>
        <div class="divider"></div>
        <div class="d-flex flex-column text-4 dpy-16">
            <span class="body-large">{{ t('theme') }}</span>
            <div class="d-flex dpt-8">
                <div class="chips-container" :checked="theme == 'dark'"
                    @click.passive="change_theme('dark')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('dark') }}</span>
                </div>
                <div class="chips-container" :checked="theme == 'light'"
                    @click.passive="change_theme('light')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('light') }}</span>
                </div>
            </div>
        </div>
        <div class="divider"></div>
        <div class="d-flex flex-column text-4 dpy-16">
            <span class="body-large">{{ t('nsfw_content') }}</span>
            <div class="d-flex dpt-8">
                <div class="chips-container" :checked="nsfw_filter == 'hide'"
                    @click.passive="change_nsfw_filter('hide')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('hide') }}</span>
                </div>
                <div class="chips-container" :checked="nsfw_filter == 'blur'"
                    @click.passive="change_nsfw_filter('blur')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('blur') }}</span>
                </div>
                <div class="chips-container" :checked="nsfw_filter == 'show'"
                    @click.passive="change_nsfw_filter('show')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('show') }}</span>
                </div>
            </div>
        </div>
        <div class="divider"></div>
        <div class="d-flex flex-column text-4 dpy-16">
            <span class="body-large">{{ t('title_size') }}</span>
            <div class="d-flex dpt-8">
                <div class="chips-container" :checked="title_size == 'title-large'"
                    @click.passive="change_title_size('title-large')">
                    <span class="material-icons"></span>
                    <span class="label-large">{{ t('large') }}</span>
                </div>
                <div class="chips-container" :checked="title_size == 'title-medium'"
                    @click.passive="change_title_size('title-medium')">
                    <span class=" material-icons"></span>
                    <span class="label-large">{{ t('medium') }}</span>
                </div>
                <div class="chips-container" :checked="title_size == 'title-small'"
                    @click.passive="change_title_size('title-small')">
                    <span class=" material-icons"></span>
                    <span class="label-large">{{ t('small') }}</span>
                </div>
            </div>
        </div>
        <div class="d-flex flex-column">
            <div class="redly-banner">
                <div class="d-flex flex-column align-items-center">
                    <img src="/images/icon.svg" class="snoovatar">
                    <span class="body-large text-6 text-shadow">Redly</span>
                    <span class="label-small text-4 fst-italic dpt-4">Reddit, quietly.</span>
                </div>
            </div>
            <div class="d-flex flex-column text-4 dpt-4">
                <div class="d-flex flex-column align-items-center justify-content-center">
                    <span class="label-medium fst-italic">{{ t('made_by') }}</span>
                    <div class="d-flex align-items-center dpt-4">
                        <span class="material-icons dpe-4">favorite</span>
                        <span class="label-medium">Redly Contributors</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-center dpy-16">
            <div class="md-filled-button-with-icon bg-3 text-4">
                <span class="material-icons">bug_report</span>
                <span class="label-large" @click.passive="open_github">{{ t('report_bug') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeMount, ref } from "vue";
import { useRouter } from "vue-router";
import { store } from "../js/store";
import { t, setLanguage } from '/js/i18n.js';

const router = useRouter();

const autoplay = ref(null);
const title_size = ref(null);
const nsfw_filter = ref(null);
const theme = ref(null);
const load_media = ref(null);
const check_for_updates = ref(null);
const in_app_browser = ref(null);
const share_old_reddit = ref(null);
const language = ref(null);

async function open_github() {
    window.open("https://github.com/dinler03/redly", "_blank");
}

async function open_gallery() {
    router.push("/gallery");
}

async function open_saved() {
    router.push("/saved");
}

async function change_title_size(value) {
    title_size.value = value;
    store.title_size = value;
    localStorage.setItem("title_size", JSON.stringify(value));
}

async function change_load_media() {
    load_media.value = !load_media.value;
    store.load_media = load_media.value;
    localStorage.setItem("load_media", JSON.stringify(load_media.value));
}

async function change_autoplay() {
    autoplay.value = !autoplay.value;
    document.body.setAttribute("autoplay", autoplay.value);
    localStorage.setItem("autoplay", JSON.stringify(autoplay.value));
}

async function change_updates() {
    const newValue = !check_for_updates.value;
    if (newValue) {
        const ok = window.confirm(t('update_check_warning'));
        if (!ok) return;
    }
    check_for_updates.value = newValue;
    localStorage.setItem("check_for_updates", JSON.stringify(newValue));
}

async function change_browser() {
    in_app_browser.value = !in_app_browser.value;
    localStorage.setItem("in_app_browser", JSON.stringify(in_app_browser.value));
}

async function change_old_reddit() {
    share_old_reddit.value = !share_old_reddit.value;
    localStorage.setItem("share_old_reddit", JSON.stringify(share_old_reddit.value));
}

async function change_nsfw_filter(value) {
    nsfw_filter.value = value;
    store.nsfw_filter = value;
    localStorage.setItem("nsfw_filter", JSON.stringify(value));
}

async function change_theme(value) {
    theme.value = value;
    store.theme = value;
    document.documentElement.setAttribute("data-theme", value);
    localStorage.setItem("theme", JSON.stringify(value));
}

async function change_language(value) {
    language.value = value;
    setLanguage(value);
}

onBeforeMount(() => {
    autoplay.value = JSON.parse(localStorage.getItem("autoplay"));
    check_for_updates.value = JSON.parse(localStorage.getItem("check_for_updates"));
    in_app_browser.value = JSON.parse(localStorage.getItem("in_app_browser"));
    share_old_reddit.value = JSON.parse(localStorage.getItem("share_old_reddit"));
    title_size.value = JSON.parse(localStorage.getItem("title_size"));
    nsfw_filter.value = JSON.parse(localStorage.getItem("nsfw_filter")) || 'hide';
    theme.value = JSON.parse(localStorage.getItem("theme")) || 'dark';
    load_media.value = JSON.parse(localStorage.getItem("load_media")) ?? true;
    language.value = JSON.parse(localStorage.getItem("language")) || 'en';
})
</script>
