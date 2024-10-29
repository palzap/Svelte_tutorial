<script lang="ts">
	import type { Snippet } from "svelte";
    import { createState } from "./State.svelte";
    
    let { 
        name
    }: {
        name: string;
    } = $props()

    const myState = createState();
</script>

<div>
    <h1>{name ? name : 'User'} registering</h1>
    <button onclick={() => myState.up()}>{myState.value}</button>
</div>

<style>

</style>