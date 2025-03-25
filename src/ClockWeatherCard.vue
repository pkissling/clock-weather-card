<template>
  <ha-card>
    <div class="clock-weather-card">
      <h1 v-if="config?.title">{{ config.title }}</h1>
      <div class="clock-weather-card-content">
        <div class="clock-weather-card-today">
          <div class="clock-weather-card-today-icon">
          </div>
          <div class="clock-weather-card-today-time">
          </div>
        </div>
        <div class="clock-weather-card-forecasts">
        </div>
      </div>
    </div>
  </ha-card>
</template>

<script setup lang="ts">
import type { HomeAssistant } from 'custom-card-helpers'
import { onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import style from './styles.scss?inline'

const props = defineProps<{
  hass?: HomeAssistant
  config?: ClockWeatherCardConfig
}>()

defineOptions({
  styles: [style]
})
const weather = ref<string>('')
const forecastUnsubscriber = ref<(() => Promise<void>) | null>(null)

watchEffect(async () => {
  if (!props.hass || forecastUnsubscriber.value) {
    return
  }
  console.log('subscribing to weather')
  forecastUnsubscriber.value = await props.hass.connection.subscribeMessage<string>(
    (msg: string) => {
      console.log('weather changed')
      weather.value = msg
    },
    {
      type: 'weather/subscribe_forecast',
      forecast_type: 'daily',
      entity_id: props.config?.entity
    },
    { resubscribe: false },
  )
})

onBeforeUnmount(async () => {
  console.log('unsubscribing from weather')
  try {
    await forecastUnsubscriber.value?.()
  } catch (e) {
    console.error('Error unsubscribing from weather', e)
  } finally {
    forecastUnsubscriber.value = null
  }
})
</script>
