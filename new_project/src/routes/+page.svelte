<script lang="ts">
    import Header from "./Header.svelte";
    let formState = $state<{
        answers: { [key: string]: string },
        step: number,
        error: string
    }>({
        answers: {},
        step: 0,
        error: ""
    });

    function nextStep(id: string) {
        if (formState.answers[id]) {
            formState.step++;
            formState.error = "";
        } else {
            if (id === "name") formState.error = "Name is required";
            if (id === "birthday") formState.error = "Birthday is required";
            if (id === "color") formState.error = "Color is required";
        }
        
    }

    const QUESTIONS = [
        { id: "name", question: "What's your name?", type: "text" },
        { id: "birthday", question: "What's your birthday?", type: "date" },
        { id: "color", question: "What's your favorite color?", type: "color" }
    ];
</script>

<Header name={formState.answers.name}/>

<main>
    
    {#if formState.step === QUESTIONS.length}
        <p>Form submitted!</p>
        <pre>{JSON.stringify(formState.answers, null, 2)}</pre>
    {:else}
        <p>Step: {formState.step + 1}</p>
    {/if}
    
    <!-- This example works in this case because we are matching the fields 1 to 1. -->
    <!-- {#each QUESTIONS as question (question.id)}
        {@render formStep(question)}
    {/each} -->


    <!-- This example destructures the QUESTIONS object to ensure that we are matching what is needed on the snippet -->
    {#each QUESTIONS as { id, question, type}, index (id)}
        {#if formState.step === index}
            {@render formStep({ id, question, type })}
        {/if}
    {/each}

    <!-- {@ render formStep({ id: "birthday", question: "What's your birthday?", type: "date" }) } -->


{#if formState.error}
    <p class="error">{formState.error}</p>
{/if}
</main>

{#snippet formStep({ id, question, type }: { id: string; question: string; type: string })}
    <article>
        <div>
            <label for={id}>{question}</label>
            <input {type} {id} bind:value={formState.answers[id]}>
        </div>
        <button onclick={() => nextStep(id)}>Next</button>
    </article>    
{/snippet}

<style>
    .error {
        color: red;
    }
</style>