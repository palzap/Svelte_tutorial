<script>
// @ts-nocheck

    import { enhance } from '$app/forms';
    import { fly, slide } from 'svelte/transition';

	let { data, form } = $props();

	let creating = $state(false);
	let deleting = $state([]);

	let number = $state();

	async function roll() {
		const response = await fetch('/roll');
		number = await response.json();
	}
</script>

<div class="centered">
	<h1>todos</h1>

    {#if form?.error}
        <p style="color: red">{form.error}</p>
    {/if}

    <form method="POST" action="?/create" use:enhance={() => {
		creating = true;

		return async ({ update }) => {
			await update();
			creating = false;
		}
	}}>
        <label>new task:
            <input
				disabled={creating}    
				name="description"
                autocomplete="off"
                value={form?.description ?? ''}
                required/>
        </label>
    </form>

	<ul class="todos">
		{#each data.todos.filter((todo) => !deleting.includes(todo.id)) as todo (todo.id)}
			<li in:fly={{ y: 20}} out:slide>
                <form method="POST" action="?/delete" 
					use:enhance={() => {
						deleting = [...deleting, todo.id];
						return async ({ update }) => {
							await update();
							deleting = deleting.filter(id => id !== todo.id);
						};
					}}>
                    <input type="hidden" name="id" value={todo.id}/>
                    <span>{todo.description}</span>
                    <button class="button1" aria-label="Mark as complete"></button>
                </form>				
			</li>
		{/each}
	</ul>
</div>

{#if creating}
	<span class="saving">saving...</span>
{/if}

<button onclick={roll}>Roll Dice!</button>

{#if number}
	<p>You rolled {number}!</p>
{/if}

<style>
	.centered {
		max-width: 20em;
		margin: 0 auto;
	}

	label {
		width: 100%;
	}

	input {
		flex: 1;
	}

	span {
		flex: 1;
	}

	.button1 {
		border: none;
		background: url(./remove.svg) no-repeat 50% 50%;
		background-size: 1rem 1rem;
		cursor: pointer;
		height: 100%;
		aspect-ratio: 1;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	button:hover {
		opacity: 1;
	}

	.saving {
		opacity: 0.5;
	}
</style>
