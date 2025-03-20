<template>
  <ha-card>
    <h1>Hello, world!</h1>
    <pre>{{ JSON.stringify(config) }}</pre>
    <pre>{{ JSON.stringify(hass) }}</pre>
  </ha-card>
</template>

<script setup lang="ts">
import type { HomeAssistant } from 'custom-card-helpers'
defineProps<{
  hass?: HomeAssistant;
  config?: ClockWeatherCardConfig
}>()
</script>
