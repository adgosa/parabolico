<script>
    import { slide } from "svelte/transition";
    import cross from "./svg/cross.svg";
    import expand from "./svg/expand.svg";
    import tick from "./svg/tick.svg";

    export let hasAnsweredCorrectly;
    export let question;
    export let questionIndex;
    export let availableAnswers;
    export let validAnswerTitle;
    export let chosenAnswerTitle;

    let expanded;

    function handleExpandClick() {
        expanded = !expanded;
    }
</script>

<div>
    <div
        class="container flex {hasAnsweredCorrectly
            ? 'correct'
            : 'incorrect'} {expanded ? '' : 'margin'}"
        on:click={handleExpandClick}
    >
        {#if hasAnsweredCorrectly}
            <div class="icon flex">
                {@html tick}
            </div>
        {:else}
            <div class="icon flex">
                {@html cross}
            </div>
        {/if}
        <h2 class="index">#{questionIndex}</h2>
        <div class="question-container flex">
            <p class="question">{@html question}</p>
        </div>
        <div class="icon flex expand">
            {@html expand}
        </div>
    </div>
    {#if expanded}
        <div transition:slide class="expansion-container flex">
            {#each availableAnswers as answer}
                {#if answer === validAnswerTitle}
                    <div class="answer valid-answer">{answer}</div>
                {:else if answer === chosenAnswerTitle}
                    <div class="answer chosen-answer">{answer}</div>
                {:else}
                    <div class="answer wrong-answer">{answer}</div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    /* expansion */

    .expansion-container {
        border: 3px solid black;
        border-top: none;
        border-bottom-right-radius: 30px;
        border-bottom-left-radius: 30px;
        margin: 0 auto;
        margin-bottom: 0.5em;
        width: 75%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .answer {
        border: 2px solid black;
        border-radius: 30px;
        font-style: normal;
        font-weight: 600;
        margin: 0.25em 0;
        max-width: 75%;
        padding: 0 10%;
    }

    .valid-answer {
        background-color: var(--status-clr);
    }

    .chosen-answer {
        background-color: var(--lighter-clr);
    }

    .wrong-answer {
        color: var(--darker-incorrect);
    }

    /* rest of the page */

    .container {
        flex-direction: row;
        border: 3px solid black;
        border-radius: 30px;
        align-items: center;
        padding: 0.5em 1em;
        cursor: pointer;
    }

    .margin {
        margin-bottom: 0.5em;
    }

    .index {
        font-weight: 600;
        font-size: 1.1rem;
        margin: 0 0.5em 0 0;
    }

    .question-container {
        justify-content: center;
        width: 100%;
    }

    .question {
        color: var(--lighter-clr);
        font-weight: 600;
        margin: 0;
        font-size: 1rem;
    }

    .correct {
        background-color: var(--status-clr);
        color: var(--darker-correct);
    }

    .incorrect {
        background-color: var(--lighter-incorrect);
        color: var(--darker-incorrect);
    }

    .icon {
        justify-content: center;
        margin-right: 0.5em;
    }

    .expand {
        color: var(--lighter-clr);
        margin: 0 0 0 0.5em;
    }
</style>
