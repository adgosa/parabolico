<script>
    export let text;
</script>

<div on:click class="answer flex">
    <p class="answer-text">
        {text}
    </p>
</div>

<style>
    .answer {
        font-size: 1rem;
        border: 3px solid black;
        border-radius: 30px;
        margin-bottom: 0.5em;
        padding: 0.25em 1em;
        min-width: 45%;
        background-color: var(--lighter-clr);
        cursor: pointer;
        align-items: center;
        justify-content: center;
    }

    .answer-text {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        margin: 0;
        font-size: 1rem;
        background-color: var(--lighter-clr);
    }
</style>
