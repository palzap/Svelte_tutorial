<script>
    import { message } from '$lib/message';
    let { data } = $props();
</script>

<h1>home</h1>
<p>Home page.</p>
<p>{message}</p>

<h1>Hello {data.visited ? 'friend' : 'stranger'}!</h1>