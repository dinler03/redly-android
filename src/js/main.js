import { createApp } from 'vue'
import App from '/components/App.vue'
import router from '/router'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/material-icons.css'
import '/assets/styles.css'

if (!localStorage.getItem("pages")) {
    localStorage.setItem("pages", JSON.stringify([]));
}

if (!localStorage.getItem("subreddits")) {
    localStorage.setItem("subreddits", JSON.stringify([]));
}

if (!localStorage.getItem("hidden_posts")) {
    localStorage.setItem("hidden_posts", JSON.stringify([]));
}

if (!localStorage.getItem("autoplay")) {
    localStorage.setItem("autoplay", JSON.stringify(true));
}

if (!localStorage.getItem("title_size")) {
    localStorage.setItem("title_size", JSON.stringify('title-medium'));
}

if (!localStorage.getItem("check_for_updates")) {
    localStorage.setItem("check_for_updates", JSON.stringify(false));
}

if (!localStorage.getItem("in_app_browser")) {
    localStorage.setItem("in_app_browser", JSON.stringify(true));
}

if (!localStorage.getItem("share_old_reddit")) {
    localStorage.setItem("share_old_reddit", JSON.stringify(false));
}

if (!localStorage.getItem("nsfw_filter")) {
    localStorage.setItem("nsfw_filter", JSON.stringify("hide"));
}

if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", JSON.stringify("dark"));
}

if (localStorage.getItem("load_media") === null) {
    localStorage.setItem("load_media", JSON.stringify(true));
}

if (!localStorage.getItem("saved_posts")) {
    localStorage.setItem("saved_posts", JSON.stringify([]));
}

if (!localStorage.getItem("language")) {
    localStorage.setItem("language", JSON.stringify("en"));
}

// Set options
document.body.setAttribute("autoplay", JSON.parse(localStorage.getItem("autoplay")));

// Apply theme
document.documentElement.setAttribute("data-theme", JSON.parse(localStorage.getItem("theme")));

createApp(App).use(router).mount('#app');
