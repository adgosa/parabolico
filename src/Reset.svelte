<style>
    :global(*::before, *::after, *) {
        box-sizing: border-box;
    }

    :global(h1, body) {
        margin: 0;
        padding: 0;
    }

    /* general properties */

    :global(:root) {
        --lighter-clr: #fffdd9;
        --light-clr: #f4f2af;
        --status-clr: #6fce84;
        --main-clr: #dad447;
        --darker-correct: #178c31;
        --lighter-incorrect: #ce6f6f;
        --darker-incorrect: #8c1717;

        --ff-primary: "Signika Negative", Arial;
        --ff-secondary: "Nunito", Sans;
    }

    :global(html) {
        font-family: var(--ff-primary);
        background-color: var(--main-clr);
        scroll-behavior: smooth;
    }

    :global(.flex) {
        display: flex;
    }

    :global(code) {
        font-family: monospace, sans-serif;
    }
</style>
