<script>
    let { children } = $props();
</script>

<nav>
    <a href="/">home</a>
    <a href="/about">about</a>
    <a href="/blog">blog</a>
    <a href="/f1/f2/f3/f4/f5">mega nested route</a>
</nav>

{@render children()}