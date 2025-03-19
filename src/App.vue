<template>
  <ha-card>
    <h1>Hello, you, world!</h1>
    <pre>{{ JSON.stringify(config, null, 2) }}</pre>
    <pre>{{ JSON.stringify(hass, null, 2) }}</pre>
  </ha-card>
</template>

<script setup lang="ts">
import type { HomeAssistant } from 'custom-card-helpers'
defineProps<{
  hass?: HomeAssistant;
  config?: any;
}>()

'abc'
</script>
