<script>
	export let name;
	let first_name = 'John';
	let last_name = 'Doe';
	let color = 'black';

	$: fullName = `${first_name} ${last_name}`;
	$: {
		console.log('First Name:', first_name);
		console.log('Last Name:', last_name);
		console.log('Full Name:', fullName);
	}

	const handleClick= () => {
		name = 'Another World!';
	}

	const handleInput = (event) => {
		name = event.target.value;
	}

	const handleColor = () => {
		if (color === 'blue') {
			color = 'black';
			return;
		}
		color = 'blue';
	}
</script>

<main>
	<h1>Hello {name}!</h1>
	
	<p style="color :{color}">My name is {fullName}.</p>
	
	<button on:click={handleClick}>Change World!</button>
	<button on:click={handleColor}>Change Color!</button>

	<input type="text" bind:value={first_name}>

	<input type="text" bind:value={last_name}>
	
	<input type="text" on:input={handleInput} value={name}>
	
	<input type="text" bind:value={name}>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>