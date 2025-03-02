<template>
  <BaseLayout v-if="!isBound">
    <template v-slot:additional_breadcrumbs>
      <li class="breadcrumb-item active">Pending reviews</li>
    </template>
  </BaseLayout>
  <ul class="list-group">
    <Placeholder :loading="loading">
      <template v-slot:content>
        <li class="list-group-item" v-for="change in changes" :key="change.id">
          <div class="row text-black p-2" :class="`bg-${CHANGE_STATUS_MAP[change.status]}`">
            <div class="col-md-1 d-flex flex-column align-self-center">
              <h4 class="p-0 m-0" data-bs-toggle="tooltip"
                  :title="`${change.change_type} ${change.object_type}`">
                <i class="eos-icons">{{ actionIcon(change.change_type) }}</i>
              </h4>
            </div>
            <div class="col-md-2 d-flex flex-column align-items-end">
              <small>Created at:</small>
              <span>{{ formatDate(change.created_at) }}</span>
            </div>
            <div class="col-md-2 d-flex flex-column align-items-end">
              <small>Created by:</small>
              <span>{{ change.created_by }}</span>
            </div>
            <template v-if="change.reviewed_at">
              <div class="col-md-2 d-flex flex-column align-items-end border-start border-dark">
                <small>Reviewed at:</small>
                <span>{{ formatDate(change.reviewed_at) }}</span>
              </div>
              <div class="col-md-2 d-flex flex-column align-items-end">
                <small>Reviewed by:</small>
                <span>{{ change.reviewed_by }}</span>
              </div>
              <div class="col-md-3 d-flex flex-column align-items-end">
                <small>Comment:</small>
                <small>{{ change.comment }}</small>
              </div>
            </template>
            <div v-else class="col-md-7 d-flex gap-3 p-0 m-0">
              <ConfirmWithComment :callback="onDecline" btn-class="btn-outline-danger shadow-sm"
                                  class="flex-grow-1" data-bs-toggle="tooltip" :vertical="true"
                                  title="Decline request and do not apply changes."
                                  :value="change.id"
                                  placeholder="Sorry, I have to decline.">
                <template v-slot:label>
                  <i class="eos-icons me-1">thumb_down</i>
                  Decline
                </template>
              </ConfirmWithComment>
              <ConfirmWithComment :callback="onApprove" btn-class="btn-success shadow-sm"
                             class="flex-grow-1" data-bs-toggle="tooltip" :vertical="true"
                             title="Accept request and apply changes to database."
                             :value="change.id" placeholder="Looks good to me.">
                <template v-slot:label>
                  <i class="eos-icons me-1">thumb_up</i>
                  Approve
                </template>
              </ConfirmWithComment>
            </div>
          </div>
          <SchemaChangeDetails v-if="change.object_type === 'SCHEMA'" :changeId="change.id"
                               :schema="schema"/>
          <EntityChangeDetails v-else-if="change.object_type === 'ENTITY'" :changeId="change.id"
                               :schema="schema" :entitySlug="entitySlug" :is-bound="isBound"/>
        </li>
        <li v-if="changes.length < 1" class="list-group-item">
          <div class="alert alert-info m-0">No changes to display.</div>
        </li>
      </template>
    </Placeholder>
  </ul>
</template>

<script>
import {computed} from "vue";
import {formatDate, CHANGE_STATUS_MAP} from "@/utils";
import BaseLayout from "@/components/layout/BaseLayout";
import ConfirmWithComment from "@/components/inputs/ConfirmWithComment";
import Placeholder from "@/components/layout/Placeholder";
import EntityChangeDetails from "@/components/change_review/EntityChangeDetails";
import SchemaChangeDetails from "@/components/change_review/SchemaChangeDetails";

export default {
  name: "Changes",
  components: {SchemaChangeDetails, Placeholder, EntityChangeDetails, ConfirmWithComment,
               BaseLayout},
  inject: ["pendingRequests"],
  emits: ["pending-reviews"],
  props: {
    schema: {
      required: false,
      type: Object,
      default: null
    },
    entitySlug: {
      required: false,
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: true,
      changes: [],
      changeDetails: {},
      CHANGE_STATUS_MAP
    }
  },
  computed: {
    isBound() {
      return !(!this.schema && !this.entitySlug);
    }
  },
  async mounted() {
    await this.load();
  },
  methods: {
    formatDate,
    actionIcon(actionType) {
      return this.CHANGE_STATUS_MAP[actionType.toLowerCase()];
    },
    async load() {
      this.loading = true;
      if (!this.schema) {
        this.changes = computed(() => this.pendingRequests);
      } else {
        const response = await this.$api.getChangeRequests({
          schemaSlug: this.schema.slug,
          entityIdOrSlug: this.entitySlug
        });
        if (Array.isArray(response)) {
          this.changes = response;
        } else {
          this.changes = Array.prototype.concat(
              response?.pending_entity_requests || [],
              response?.schema_changes || []
          );
        }
      }
      this.loading = false;
    },
    fakeReview(changeId, verdict) {
      for (let change of this.changes) {
        if (changeId == change.id) {
          change.reviewed_at = Date.now();
          change.reviewed_by = 'me';
          change.status = `${verdict}D`;
        }
      }
    },
    async review(changeId, verdict, comment) {
      const result = await this.$api.reviewChanges({
        changeId: changeId,
        verdict: verdict,
        comment: comment
      });
      if (result) {
        this.fakeReview(changeId, verdict);
        this.$emit("pending-reviews");
      }
    },
    async onDecline(event, comment) {
      await this.review(event.target.value, 'DECLINE', comment);
    },
    async onApprove(event, comment) {
      await this.review(event.target.value, 'APPROVE', comment);
    }
  },
  watch: {
    async schema() {
      await this.load();
    },
    async entitySlug() {
      await this.load();
    }
  }
}
</script>

<style scoped>

</style>