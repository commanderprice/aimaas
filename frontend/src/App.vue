<template>
  <nav class="navbar bg-navbar navbar-dark navbar-expand-sm">
    <div class="container-fluid">
      <RouterLink class="navbar-brand" :to="{name: 'schema-list'}">
        <img src="./assets/logo.svg" style="height: 2.5rem;" class="me-1" alt="SUSE">
        <i>aimaas</i>
      </RouterLink>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
              aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <SchemaList v-model="activeSchema" :as-dropdown="true" ref="schemalist"/>
          <ReviewNav ref="pendingrequests"/>
          <AuthNav/>
        </ul>
      </div>
    </div>
  </nav>
  <AlertDisplay/>
  <div class="container mt-2">
    <keep-alive>
      <router-view @pending-reviews="onPendingReviews"></router-view>
    </keep-alive>
  </div>

</template>
<style>
.eos-icons {
  font-size: 120%;
  line-height: 120%;
  vertical-align: text-top;
}
</style>
<script>
import {computed} from "vue";
import 'bootstrap/dist/js/bootstrap.min.js';
import "eos-icons/dist/css/eos-icons.css";
import "suse-bootstrap5-theme/dist/css/suse.css";

import AuthNav from "@/components/auth/AuthNav";
import AlertDisplay from "@/components/alerts/AlertDisplay";
import SchemaList from "@/components/SchemaList";
import ReviewNav from "@/components/change_review/ReviewNav";

export default {
  name: 'App',
  components: {SchemaList, AlertDisplay, AuthNav, ReviewNav},
  data: function () {
    return {
      activeSchema: null
    }
  },
  provide() {
    return {
      activeSchema: computed(() => this.activeSchema),
      availableSchemas: computed(() => this.$refs.schemalist.schemas),
      pendingRequests: computed(() => this.$refs.pendingrequests.changes)
    }
  },
  computed: {
    availableSchemas() {
      let _avail_schemas = {};
      if (this.$refs.schemalist.schemas) {
        for (let schema of this.$refs.schemalist.schemas) {
          _avail_schemas[schema.slug] = schema;
        }
      }
      return _avail_schemas
    }
  },
  methods: {
    onPendingReviews() {
        this.$refs.pendingrequests.load();
    },
    getSchemaFromApi(schemaSlug) {
      this.$api.getSchema({slugOrId: schemaSlug}).then(schema => {
        this.activeSchema = schema;
      });
    },
    getSchemaFromRoute() {
      let schemaSlug = this.$route.params.schemaSlug || null;
      if (!schemaSlug) {
        return null;
      }
      try {
        // First, try to reuse data in storage
        this.activeSchema = this.availableSchemas[schemaSlug];
      } catch (e) {
        true;
      }
      if (!this.activeSchema) {
        this.getSchemaFromApi(schemaSlug);
      }
    }
  },
  watch: {
    $route: {
      handler: "getSchemaFromRoute",
      immediate: true, // runs immediately with mount() instead of calling method on mount hook
    },
  }
}
</script>