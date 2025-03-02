<template>
  <Placeholder :loading="loading" :big="true">
    <template v-slot:content>
      <template v-if="changeId in changeDetails">
        <div class="table-responsive" v-if="changeDetails[changeId].length > 0">
          <table class="table">
            <thead>
            <tr>
              <th v-for="heading in tableHeadings" :key="heading">
                {{ heading }}
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(change, idx) in changeDetails[changeId]" :key="`${changeId}/${idx}`">
              <td v-for="heading in tableHeadings" :key="`${changeId}/${idx}/${heading}`">
                <template v-if="heading === 'action'">
                  <i class="eos-icons" data-bs-toggle="tooltip" :title="change[heading]">
                    {{ CHANGE_STATUS_MAP[change[heading]] }}
                  </i>
                </template>
                <template v-else-if="typeof change[heading] === 'boolean'">
                  <i class="eos-icons" :class="change[heading] ? 'text-success' : 'text-danger'"
                     data-bs-toggle="tooltip" :title="change[heading]">
                    {{ change[heading] ? 'thumb_up' : 'thumb_down' }}
                  </i>
                </template>
                <template v-else>
                  {{ change[heading] }}
                </template>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="alert alert-info">No additional details.</div>
      </template>
      <button v-else type="button" class="btn btn-link" @click="loadDetails()">
        Load details
      </button>
    </template>
  </Placeholder>
</template>

<script>
import {CHANGE_STATUS_MAP} from "@/utils";
import {loadChangeDetails, sortChangeHeaders} from "@/composables/changes";
import Placeholder from "@/components/layout/Placeholder";

export default {
  name: "SchemaChangeDetails",
  components: {Placeholder},
  props: {
    changeId: {
      required: true,
      type: Number
    },
    schema: {
      required: true,
      type: Object
    },
    entitySlug: {
      required: false,
      type: String,
      default: null
    }
  },
  data() {
    return {
      CHANGE_STATUS_MAP,
      changeDetails: {},
      loading: false
    }
  },
  computed: {
    tableHeadings() {
      const keys = [];
      for (const c of this.changeDetails[this.changeId]) {
        for (const k of Object.keys(c)) {
          if (!keys.includes(k)) {
            keys.push(k);
          }
        }
      }
      keys.sort(sortChangeHeaders);
      return keys;
    }
  },
  methods: {
    async transformDetails(details) {
      const transformed = [];
      const actionKeys = ['add', 'delete', 'update'];
      let change;
      for (const action of actionKeys) {
        for (let change of details.changes[action]) {
          change.action = action;
          transformed.push(change);
        }
      }
      for (const name in details.changes) {
        if (actionKeys.includes(name) || details.changes[name] === null) {
          continue;
        }
        change = details.changes[name];
        change.action = 'update';
        change.name = name;
        transformed.push(change);
      }
      return transformed;
    },
    async loadDetails() {
      this.loading = true;
      await loadChangeDetails(this.$api, "schema", this.changeId,
          this.changeDetails, this.transformDetails);
      this.loading = false;
    }
  }
}
</script>

<style scoped>

</style>