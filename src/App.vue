<template>
    <ha-card>
        <h1>Hello, you, world!</h1>
        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
    </ha-card>
</template>

<script setup lang="ts">
defineProps<{
    hass: object | undefined;
    config: object | undefined;
}>();
</script>
