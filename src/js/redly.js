import { CapacitorHttp } from '@capacitor/core';

class Redly {
    constructor() {
        const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
        this.isNative = isNative;
        this.host = isNative ? "https://www.reddit.com" : "/reddit-api";
        this.headers = {
            "User-Agent": "redly/0.1",
        };
        this.parameters = {
            limit: 25,
            include_over_18: true,
        }
        this.search_params = {
            limit: 25,
            include_over_18: true,
            type: "sr,link,user",
        }
    }

    async _fetch(url) {
        // On native, route Reddit API calls through CapacitorHttp so we can set
        // a custom User-Agent (forbidden in WebView fetch). Global fetch/XHR
        // patching is disabled in capacitor.config.json so that hls.js can
        // stream HLS segments via native XHR without binary→base64 corruption.
        //
        // A 10-second timeout is enforced so that the UI never hangs forever
        // when the device is offline. The caller's `.catch(err => null)` will
        // turn the timeout into a clean "no data" result that surfaces the
        // offline error screen.
        const TIMEOUT_MS = 10000;

        if (this.isNative) {
            const request = CapacitorHttp.request({
                url,
                method: 'GET',
                headers: this.headers,
                connectTimeout: TIMEOUT_MS,
                readTimeout: TIMEOUT_MS,
            });
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
            );
            const response = await Promise.race([request, timeout]);
            return {
                json: async () => typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data,
            };
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await fetch(url, {
                headers: this.headers,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timer);
        }
    }

    async getSubmissions(sort = null, subreddit = null, options = {}) {
        let params = {
            limit: 25,
            include_over_18: true,
        }

        sort = sort ? sort : "hot";
        subreddit = subreddit ? "/r/" + subreddit : "";

        return await this._fetch(this.host + subreddit + `/${sort}.json?` + new URLSearchParams(Object.assign(params, options)))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);

    }

    async getDomainHot(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/hot.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getDomainBest(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/best.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getDomainTop(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/top.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getDomainNew(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/new.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getDomainRising(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/rising.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getDomainControversial(domain, options = this.parameters) {
        return await this._fetch(this.host + "/domain/" + domain + "/controversial.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                posts: data.children
            }))
            .catch(err => null);
    }

    async getSubreddit(subreddit) {
        return await this._fetch(this.host + "/r/" + subreddit + "/about.json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getSubredditRules(subreddit) {
        return await this._fetch(this.host + "/r/" + subreddit + "/about/rules.json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getSubredditModerators(subreddit) {
        return await this._fetch(this.host + "/r/" + subreddit + "/about/moderators.json")
            .then(res => res.json())
            .then(json => json.data)
            .then(data = ({
                users: data.children
            }))
            .catch(err => null);
    }

    async getSubredditWikiPages(subreddit) {
        return await this._fetch(this.host + "/r/" + subreddit + "/wiki/pages.json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getSubredditWikiPage(subreddit, page) {
        return await this._fetch(this.host + "/r/" + subreddit + "/wiki/" + page + ".json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getSubredditWikiPageRevisions(subreddit, page) {
        return await this._fetch(this.host + "/r/" + subreddit + "/wiki/revisions" + page + ".json")
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }

    async getPopularSubreddits(options = this.parameters) {
        return await this._fetch(this.host + "/subreddits/popular.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                subreddits: data.children
            }))
            .catch(err => null);
    }

    async getNewSubreddits(options = this.parameters) {
        return await this._fetch(this.host + "/subreddits/new.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                subreddits: data.children
            }))
            .catch(err => null);
    }

    async getPremiumSubreddits(options = this.parameters) {
        return await this._fetch(this.host + "/subreddits/premium.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                subreddits: data.children
            }))
            .catch(err => null);
    }

    async getDefaultSubreddits(options = this.parameters) {
        return await this._fetch(this.host + "/subreddits/default.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                subreddits: data.children
            }))
            .catch(err => null);
    }

    async getPopularUsers(options = this.parameters) {
        return await this._fetch(this.host + "/users/popular.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                users: data.children
            }))
            .catch(err => null);
    }

    async getNewUsers(options = this.parameters) {
        return await this._fetch(this.host + "/users/new.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                users: data.children
            }))
            .catch(err => null);
    }

    async searchSubmissions(query, options = {}) {
        options.q = query;
        options.type = "link";

        let params = {
            limit: 25,
            include_over_18: true
        }

        return await this._fetch(this.host + "/search.json?" + new URLSearchParams(Object.assign(params, options)))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async searchSubreddits(query, options = {}) {
        options.q = query;

        let params = {
            limit: 25,
            include_over_18: true
        }

        return await this._fetch(this.host + "/subreddits/search.json?" + new URLSearchParams(Object.assign(params, options)))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async searchUsers(query, options = {}) {
        options.q = query;

        let params = {
            limit: 25,
            include_over_18: true
        }

        return await this._fetch(this.host + "/users/search.json?" + new URLSearchParams(Object.assign(params, options)))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async searchAll(query, subreddit = null, options = {}) {
        options.q = query;
        subreddit = subreddit ? "/r/" + subreddit : "";

        let params = {
            limit: 25,
            include_over_18: true,
            type: "sr,link,user",
        }

        return await this._fetch(this.host + subreddit + "/search.json?" + new URLSearchParams(Object.assign(params, options)))
            .then(res => res.json())
            .then(json => Array.isArray(json) ? ({
                after: json[1].data.after,
                items: json[0].data.children.concat(json[1].data.children)
            }) : ({
                after: json.data.after,
                items: json.data.children
            }))
            .catch(err => null);
    }

    async getSubmission(id) {
        return await this._fetch(this.host + "/by_id/" + id + ".json")
            .then(res => res.json())
            .then(json => json.data.children[0].data)
            .catch(err => null);
    }

    async getSubmissionComments(id, options = this.parameters) {
        return await this._fetch(this.host + "/comments/" + id + ".json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => ({
                submission: json[0].data.children[0],
                comments: json[1].data.children
            }))
            .catch(err => null);
    }

    async getSubredditComments(subreddit, options = this.parameters) {
        return await this._fetch(this.host + "/r/" + subreddit + "/comments.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }

    async getUser(username) {
        return await this._fetch(this.host + "/user/" + username + "/about.json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getUserOverview(username, options = this.parameters) {
        return await this._fetch(this.host + "/user/" + username + "/overview.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async getUserComments(username, options = this.parameters) {
        return await this._fetch(this.host + "/user/" + username + "/comments.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async getUserSubmissions(username, options = this.parameters) {
        return await this._fetch(this.host + "/user/" + username + "/submitted.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data)
            .then(data => ({
                after: data.after,
                items: data.children
            }))
            .catch(err => null);
    }

    async getLiveThread(id) {
        return await this._fetch(this.host + "/live/" + id + "/about.json")
            .then(res => res.json())
            .then(json => json.data)
            .catch(err => null);
    }

    async getLiveThreadUpdates(id, options = this.parameters) {
        return await this._fetch(this.host + "/live/" + id + ".json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }


    async getLiveThreadContributors(id, options = this.parameters) {
        return await this._fetch(this.host + "/live/" + id + "/contributors.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }

    async getLiveThreadDiscussions(id, options = this.parameters) {
        return await this._fetch(this.host + "/live/" + id + "/discussions.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }

    async getLiveThreadsNow(options = this.parameters) {
        return await this._fetch(this.host + "/live/happening_now.json?" + new URLSearchParams(options))
            .then(res => res.json())
            .then(json => json.data.children)
            .catch(err => null);
    }
}

export { Redly }
