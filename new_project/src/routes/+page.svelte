<script lang="ts">
    import Header from "./Header.svelte";
    let formState = $state({
        name: "",
        birthday: "",
        step: 0,
        error: ""
    });

    function nextStep() {
        if ((formState.name !== "" && formState.step === 0) || (formState.birthday !== "" && formState.step === 1)) {
            formState.step++;
            formState.error = "";
        } else {
            if (formState.step === 0) formState.error = "Name is required";
            if (formState.step === 1) formState.error = "Birthday is required";
        }
        
    }
</script>


<main>
    <Header name={formState.name} />
    <p>Step: {formState.step + 1}</p>


    {#if formState.step === 0}
        <div>
            <label for='name'>Name</label>
            <input type="text" id="name" bind:value={formState.name}/>
        </div>
        <button onclick={nextStep}>Next</button>
    {:else if formState.step === 1}
        <div>
            <label for='bday'>Birthday</label>
            <input type="date" id="bday" bind:value={formState.birthday}/>
        </div>
        <button onclick={nextStep}>Next</button>
    {/if}

    {#if formState.error}
    <p class="error">{formState.error}</p>
{/if}
</main>

<!-- {#snippet formStep({ id, question, type }; { id: string, question: string, type: string })}
    <article>
        <div>
            <label for={id}>{question}</label>
            <input {type} {id} bind:value={formState[id]}>
        </div>
    </article>    
{/snippet} -->

<style>
    .error {
        color: red;
    }
</style>