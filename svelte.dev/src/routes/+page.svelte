<script>
    let { data } = $props();
</script>

<h1>home</h1>
<p>Home page.</p>

<h1>Hello {data.visited ? 'friend' : 'stranger'}!</h1>