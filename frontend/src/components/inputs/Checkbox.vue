<template>
  <BaseInput label="" :args="args" :without-offset="withoutOffset" :vertical="vertical"
             :required="required">
    <template v-slot:field>
      <div class="d-grid gap-2">
      <input class="btn-check" type="checkbox" :checked="this.checked" @input="onInput"
             autocomplete="off"
             v-bind="args"/>
      <label class="btn" :class="this.checked? 'btn-primary' : 'btn-light'"
             :for="args.id">
        {{ label || '&nbsp;'}}
      </label>
        </div>
    </template>
    <template v-slot:helptext>
      <slot name="helptext"/>
    </template>
  </BaseInput>
</template>

<script>
import BaseInput from "@/components/layout/BaseInput";

export default {
  name: "Checkbox",
  components: {BaseInput},
  props: ["label", "modelValue", "args", "withoutOffset", "vertical", "required"],
  data() {
    return {
      checked: null,
    };
  },
  created() {
    this.checked = this.modelValue;
  },
  methods: {
    onInput() {
      this.checked = !this.checked;
      this.$emit("update:modelValue", this.checked);
    },
  },
};
</script>