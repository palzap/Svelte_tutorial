<script lang="ts">
    let { 
        name, 
        last_name
    }: {
        name: string;
        last_name?: string;
    } = $props()
</script>

<h1>Hello {name} {last_name}</h1>
<h2>{name.replaceAll('e', 'x')}</h2>

<style>

</style>