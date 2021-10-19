<script>
    import QuizSection from "./QuizSection.svelte";
</script>

<div class="container flex">
    <section class="main-container flex">
        <main class="main">
            <h1 class="main-title">Parabólico</h1>
            <h2 class="main-subtitle">
                Demuestra tus conocimientos con este quiz.
            </h2>
            <a class="play-btn" href="#quiz">Jugar</a>
        </main>
    </section>
    <section>
        <div class="how-to-play-container flex">
            <h2 class="play-title">¿Cómo se juega?</h2>
            <p class="play-paragraph">
                Podrás responder 10 preguntas. Cuando hayas terminado, se te
                mostrarán los resultados.
            </p>
        </div>
    </section>
    <section id="quiz" class="quiz-section flex">
        <QuizSection />
    </section>
</div>

<style>
    section {
        min-height: 100vh;
    }

    .quiz-section {
        flex-direction: column;
        align-content: center;
        justify-content: center;
        padding: 0 1em;
    }

    .container {
        flex-direction: column;
        align-items: center;
    }

    .main-container {
        flex-direction: column;
        justify-content: center;
    }

    .main {
        text-align: center;
    }

    .main-title {
        font-weight: 700;
        font-size: 5rem;
    }

    .main-subtitle {
        font-weight: 400;
        font-size: 1.5rem;
        margin: 1em auto;
        max-width: 25ch;
    }

    .play-btn {
        margin-top: 0.5em;
        display: inline-block;
        text-decoration: none;
        padding: 0.375em 2em;
        background-color: black;
        color: white;
        border-radius: 0.5rem;
    }

    .how-to-play-container {
        flex-direction: column;
        align-items: center;
    }

    .play-title {
        font-size: 3.5rem;
        margin-bottom: 0.25em;
        text-align: center;
    }

    .play-paragraph {
        font-size: 1.5rem;
        text-align: center;
        max-width: 50ch;
    }
</style>
