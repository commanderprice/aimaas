class API {
    constructor(baseUrl, alertStorage) {
        this.base = baseUrl;
        this.alerts = alertStorage;
        this.loggedIn = null;
        this.token = null;
    }

    async _error_to_alert(details) {
        const message = details?.message || "Failed to process request";
        if (this.alerts) {
            this.alerts.push("danger", message);
        } else {
            console.error(message);
        }
    }

    async _is_response_ok(response) {
        if (response.ok && response.status < 400) {
            return null;
        }

        const detail = await response.json();
        throw Error(detail);
    }

    async _fetch({url, headers, body, method} = {}) {
        let allheaders = {"Content-Type": "application/json"};
        allheaders = Object.assign(allheaders, headers || {});

        try {
            const response = await fetch(url, {
                method: method || 'GET',
                body: body ? JSON.stringify(body) : null,
                headers: allheaders
            });
            this._is_response_ok(response);
            return await response.json();
        } catch (e) {
            this._error_to_alert(e);
            return null;
        }
    }

    async getAttributes() {
        const response = await fetch(`${this.base}/attributes`);
        try {
            this._is_response_ok(response);
            return await response.json()
        }
        catch (e) {
            // TODO: Do something else
        }
    }

    async getSchemas({ all = false, deletedOnly = false } = {}) {
        const params = new URLSearchParams();
        params.set('all', all);
        params.set('deleted_only', deletedOnly);
        return this._fetch({url: `${this.base}/schemas?${params.toString()}`});
    }

    async getSchema({ slugOrId } = {}) {
        return this._fetch({url: `${this.base}/schemas/${slugOrId}`});
    }

    async createSchema({ body } = {}) {
        const response = await this._fetch({
            url: `${this.base}/schemas`,
            method: 'POST',
            body: body
        });
        this.alerts.push("success", `Schema created: ${body.name}`);
        return response;
    }

    async updateSchema({ schemaSlug, body } = {}) {
        const response = await this._fetch({
            url: `${this.base}/schemas/${schemaSlug}`,
            method: "PUT",
            body: body
        });
        this.alerts.push("success", `Schema updated: ${schemaSlug}`);
        return response;
    }

    async deleteSchema({ slugOrId } = {}) {
        const response = await this._fetch({
            url: `${this.base}/schemas/${slugOrId}`,
            method: 'DELETE'
        });
        this.alerts.push("success", `Schema deleted: ${response.name}`);
        return response;
    }

    async getEntities({
        schemaSlug,
        limit = 10,
        offset = 0,
        all = false,
        deletedOnly = false,
        allFields = false,
        meta = false,
        filters = {},
        orderBy = 'name',
        ascending = true,
    } = {}) {
        const params = new URLSearchParams();
        params.set('limit', limit);
        params.set('offset', offset);
        params.set('all', all);
        params.set('all_fields', allFields);
        params.set('deletedOnly', deletedOnly);
        params.set('meta', meta);
        params.set('order_by', orderBy);
        params.set('ascending', ascending);
        for (const [filter, value] of Object.entries(filters)) {
            params.set(filter, value);
        }
        return this._fetch({
            url: `${this.base}/dynamic/${schemaSlug}?${params.toString()}`
        });
    }

    async getEntity({ schemaSlug, entityIdOrSlug, meta = false } = {}) {
        const params = new URLSearchParams();
        params.set('meta', meta);
        return this._fetch({
            url: `${this.base}/dynamic/${schemaSlug}/${entityIdOrSlug}?${params.toString()}`
        });
    }

    async createEntity({ schemaSlug, body } = {}) {
        const response = this._fetch({
            url: `${this.base}/dynamic/${schemaSlug}`,
            method: 'POST',
            body: body
        });
        this.alerts.push("success", `Entity created: ${body.name}`);
        return response;
    }

    async updateEntity({ schemaSlug, entityIdOrSlug, body } = {}) {
        const response = this._fetch({
            url: `${this.base}/dynamic/${schemaSlug}/${entityIdOrSlug}`,
            method: 'PUT',
            body: body
        });
        this.alerts.push("success", `Entity updated: ${entityIdOrSlug}`)
        return response;
    }

    async getChangeRequests({schemaSlug, entityIdOrSlug}= {}) {
        let url = `${this.base}/changes/schema/${schemaSlug}`;
        if (entityIdOrSlug) {
            url = `${this.base}/changes/entity/${schemaSlug}/${entityIdOrSlug}`;
        }
        return this._fetch({url: url});
    }

    async getChangeRequestDetails({schemaSlug, entityIdOrSlug, changeId} = {}) {
        let url = `${this.base}/changes/schema/${schemaSlug}/${changeId}`;
        if (entityIdOrSlug) {
            url = `${this.base}/changes/entity/${schemaSlug}/${entityIdOrSlug}/${changeId}`;
        }
        return this._fetch({url: url,})
    }

    async reviewChanges({ changeId, verdict, changeObject, changeType, comment } = {}) {
        return fetch(`${this.base}/changes/review/${changeId}`, {
            method: "POST",
            body: JSON.stringify({
                result: verdict,
                change_object: changeObject,
                change_type: changeType,
                comment: comment || null,
            }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async login({username, password} = {}) {
        const url = `${this.base}/login`;
        const response = await this._fetch({
            url: url,
            method: 'POST',
            body: {username: username, password: password}
        });
        console.debug("Logged in", response);
        this.loggedIn = username;
        this.token = response.access_token;
        this.alerts.push("success", `Welcome back, ${username}.`);
        return response;
    }
}


export default {
    install: (app) => {
        app.config.globalProperties.$api =  new API(process.env.VUE_APP_API_BASE,
                                                    app.config.globalProperties.$alerts);
    }
}