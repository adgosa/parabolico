<script>
    import Answer from "./Answer.svelte";
    import { slide } from "svelte/transition";
    import { tweened } from "svelte/motion";
    import Results from "./results/Results.svelte";

    export let selectedQuestions; // 10 questions randomly picked from the array of QuizSection
    export let maxQuestions;

    const answeredQuestions = [];
    const progress = tweened(0);

    let stage = 0;
    $: progress.set(stage);

    function handleClick(clickedQuestionIndex) {
        const question = selectedQuestions[stage];
        const validAnswer = question.validAnswerIndex === clickedQuestionIndex;

        answeredQuestions.push({
            question: question,
            questionIndex: stage + 1,
            hasAnsweredCorrectly: validAnswer,
            validAnswerTitle: question.answers[question.validAnswerIndex],
            chosenAnswerTitle: question.answers[clickedQuestionIndex],
        });

        stage++;
    }
</script>

{#if stage !== maxQuestions}
    <div transition:slide>
        <div class="header">
            {#key selectedQuestions[stage].title}
                <h1 transition:slide>{@html selectedQuestions[stage].title}</h1>
            {/key}
        </div>
        <div class="answers flex">
            {#each selectedQuestions[stage].answers as question, i}
                <Answer on:click={() => handleClick(i)} text={question} />
            {/each}
        </div>
        <progress class="status" max={maxQuestions} value={$progress} />
    </div>
{:else}
    <Results qAArray={answeredQuestions} />
{/if}

<style>
    .header {
        margin: 1.5em 0;
    }

    .header h1 {
        font-size: clamp(1.5rem, 1vw, 3rem);
        font-weight: 400;
    }

    .answers {
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
    }

    .status {
        display: block;
        border: 2px solid black;
        margin: 1em auto;
        max-width: 75%;
        border-radius: 40px;
    }

    progress::-moz-progress-bar {
        background: var(--status-clr);
        border-radius: 40px;
    }

    progress::-moz-progress-value {
        background: transparent;
    }

    progress::-webkit-progress-value {
        background: var(--status-clr);
        border-radius: 40px;
    }

    progress::-webkit-progress-bar {
        background: transparent;
    }
</style>
