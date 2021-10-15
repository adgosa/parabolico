<script>
    import Result from "./Result.svelte";

    export let qAArray;
</script>

<h1 class="results-title">Resultados</h1>
<div class="results flex">
    {#each qAArray as answeredQuestion}
        <Result
            question={answeredQuestion.question.title}
            hasAnsweredCorrectly={answeredQuestion.hasAnsweredCorrectly}
            availableAnswers={answeredQuestion.question.answers}
            questionIndex={answeredQuestion.questionIndex}
            validAnswerTitle={answeredQuestion.validAnswerTitle}
            chosenAnswerTitle={answeredQuestion.chosenAnswerTitle}
        />
    {/each}
</div>

<style>
    .results-title {
        font-family: var(--ff-primary);
        font-size: 4rem;
        font-weight: 400;
        margin-bottom: 0.25em;
    }

    .results {
        max-height: 50vh;
        overflow-y: scroll;
        flex-direction: column;
    }
</style>
