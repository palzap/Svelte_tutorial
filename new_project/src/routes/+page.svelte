<script lang="ts">
    import Header from "./Header.svelte";
    let name = $state("Pedro");
    let last_name = $state("Leal");
    let status: 'OPEN' | 'CLOSED' = $state('OPEN');

    let full_name =$derived(name + " " + last_name);

    function toggle() {
        status = status === 'OPEN' ? 'CLOSED' : 'OPEN';
    }
</script>

<Header {name} {last_name}/>

<h2>{full_name}</h2>

<input type="test" bind:value={name}/>

<p>Website {status}</p>
<button onclick={toggle}>function status</button>
<button onclick={() => {
    status = status === 'OPEN' ? 'CLOSED' : 'OPEN';
    }}>inline status
</button>