<script lang="ts">
	import type { Snippet } from "svelte";
    import { createState, NameState } from "./State.svelte";
    
    let { 
        name
    }: {
        name: string;
    } = $props()

    const myState = createState();
    const nameState = new NameState();
</script>

<div>
    <h1>{name ? name : 'User'} registering</h1>
    <button onclick={() => myState.up()}>{myState.value}</button>
    <button onclick={() => nameState.up()}>{nameState.value}</button>
</div>

<style>

</style>