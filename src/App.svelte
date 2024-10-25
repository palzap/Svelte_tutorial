<script>
	import Modal from './Modal.svelte';
	export let name;
	let first_name = 'John';
	let last_name = 'Doe';
	let color = 'black';
	let items = [
		{ id: 1, name: 'Item 1', color: 'red' },
		{ id: 2, name: 'Item 2', color: 'green' },
		{ id: 3, name: 'Item 3', color: 'blue' },
		{ id: 4, name: 'Item 4', color: 'yellow' },
		{ id: 5, name: 'Item 5', color: 'purple' },
		{ id: 6, name: 'Item 6', color: 'orange' },
		{ id: 7, name: 'Item 7', color: 'pink' },
		{ id: 8, name: 'Item 8', color: 'brown' },
		{ id: 9, name: 'Item 9', color: 'gray' },
		{ id: 10, name: 'Item 10', color: 'black' }
	]
	let itemname = "";
	let showModal = false;

	$: fullName = `${first_name} ${last_name}`;
	$: {
		console.log('First Name:', first_name);
		console.log('Last Name:', last_name);
		console.log('Full Name:', fullName);
	}

	const handleClick= () => {
		name = 'Another World';
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

	const deleteItem = (id) => {
		itemname = items.find(item => item.id == id).name;
		items = items.filter(item => item.id != id);
		toggleModal();
	}

	const toggleModal = () => {
		showModal = !showModal;
	}
</script>


<main>
	<Modal message="{itemname} deleted!" {showModal} on:click={toggleModal}/>
	<h1>Hello {name}!</h1>
	
	<div>
		<h4>
			<p style="color :{color}">My name is {fullName}.</p>
			
			<label for="first_name">First Name</label>
			<input type="text" id="first_name" bind:value={first_name}>
			<label for="last_name">Last Name</label>
			<input type="text" id="last_name" bind:value={last_name}>

			<label for="world">World name (with input handler)</label>
			<input type="text" on:input={handleInput} value={name}>	
			<label for="world">World name (with binding)</label>
			<input type="text" bind:value={name}>
		</h4>
		<h5>
			<button on:click={handleClick}>Change World!</button>
			<button on:click={handleColor}>Change Color!</button>
		</h5>

		{#each items as item (item.id)}
			{#if item.id % 2 == 0}
				<p>Even</p>
			{:else}
				<p>Odd</p>
			{/if}
			<div>
				<p style="color: {item.color}">{item.name}</p>
				<button on:click={() => deleteItem(item.id)}>delete</button>
			</div>				
		{:else}
			<p>No items found!</p>
		{/each}
	</div>
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