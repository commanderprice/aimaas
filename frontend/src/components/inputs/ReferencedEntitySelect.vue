<template>
  <BaseInput :label="label" :args="args" :vertical="false" :required="required">
    <template v-slot:helptext>
      Click button to open the selection dialog.
    </template>
    <template v-slot:field>
      <ul class="list-group">
        <li class="list-group-item d-flex justify-content-between align-items-center"
            v-for="e in selected" :key="e.id">
          <span>
            <router-link :to="{name: 'entity-view', params: {schemaSlug: fkSchema.slug, entitySlug: e.slug}}">
              {{ e.name }}
            </router-link>
          </span>
          <button class="btn btn-outline-cta" type="button"
                  data-ts-toggle="tooltip" title="Remove" @click="onClear(e.id)">
            <i class="eos-icons">backspace</i>
          </button>
        </li>
      </ul>
      <button type="button" class="btn btn-outline-primary w-100 mt-1" data-bs-toggle="modal"
              :data-bs-target="`#${modalId}`">
        <i class='eos-icons me-1'>checklist</i>
        Select {{ selectType }}
      </button>
      <div class="modal" :id="modalId">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Select entity {{ selectType }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
            </div>
            <div class="modal-body">
              <EntityList :schema="fkSchema" ref="editor" :select-type="selectType"/>
            </div>
            <div class="modal-footer d-flex">
              <button type="button" class="btn btn-outline-dark flex-grow-1"
                      data-bs-dismiss="modal">
                <i class='eos-icons me-1'>close</i>
                Close
              </button>
              <button type="button" class="btn btn-primary flex-grow-1" data-bs-dismiss="modal"
                      @click="onSelect">
                <i class='eos-icons me-1'>subdirectory_arrow_left</i>
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseInput>
</template>

<script>
import BaseInput from "@/components/layout/BaseInput";
import EntityList from "@/components/EntityList";

export default {
  name: "ReferencedEntitySelect",
  components: {BaseInput, EntityList},
  emits: ["changed", "selected", "update:modelValue"],
  props: ["args", "label", "modelValue", "fkSchemaId", "selectType", "required"],
  inject: ["activeSchema", "availableSchemas"],
  data() {
    return {
      loading: true,
      selected: [],
      modalId: `entitySelectModal-${this.label}`
    }
  },
  created() {
    this.getSelected();
  },
  computed: {
    fkSchema() {
      for (const schema of this.availableSchemas) {
        if (schema.id === this.fkSchemaId) {
          return schema;
        }
      }
      return null;
    }
  },
  methods: {
    getSelected() {
      if (!this.modelValue) {
        return;
      }
      const preselectedIds = this.selected.map(x => x.id);
      let toQuery = this.modelValue;
      if (!Array.isArray(this.modelValue)) {
        toQuery = [this.modelValue];
      }

      toQuery.map(i => {
        if (!preselectedIds.includes(i)) {
          this.$api.getEntity({
            schemaSlug: this.fkSchema.slug,
            entityIdOrSlug: i
          }).then(response => {
            this.selected.push(response);
          });
        }
      });
    },
    onSelect() {
      if (this.selectType === 'single') {
        this.selected.splice(0, this.selected.length);
      }
      const preselectedIds = this.selected.map(x => x.id);
      for (const s of this.$refs.editor.getSelected()) {
        if (!preselectedIds.includes(s.id)) {
          this.selected.push(s);
        }
      }
      if (this.selectType === 'single') {
        this.$emit("update:modelValue", this.selected[0].id);
      } else {
        this.$emit("update:modelValue", this.selected.map(s => s.id));
      }
      this.$emit("changed");
    },
    onClear(eId) {
      if (this.selectType === 'single') {
        this.$emit("update:modelValue", null);
      } else {
        this.selected = this.selected.filter(x => x.id !== eId);
        this.$emit("update:modelValue", this.selected.map(s => s.id));
      }
      this.$emit("changed");
    }
  },
  watch: {
    modelValue() {
      this.getSelected();
    }
  }
};
</script>